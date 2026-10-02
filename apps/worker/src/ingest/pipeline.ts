import { and, eq, inArray, isNotNull, isNull, lt, sql } from "drizzle-orm";
import { extractSkills } from "@ge/ai";
import {
  dedupeHash,
  dictionarySkills,
  isIndia,
  isTechRole,
  normaliseExperience,
  normaliseLocation,
  normaliseMode,
  priorSalaryBand,
  statedSalary,
  titleFamily,
  toLpa,
  type RawJob,
} from "@ge/core";
import { schema } from "@ge/db";
import type { Ctx } from "../ctx";

const { jobs, companies, salaryEstimates, jobSources } = schema;

/** LLM skill extraction is capped per run: the dictionary covers most postings. */
const LLM_SKILL_CALLS_PER_RUN = 3;

async function companyId(ctx: Ctx, name: string, cache: Map<string, string>): Promise<string> {
  const key = name.trim().toLowerCase();
  const hit = cache.get(key);
  if (hit) return hit;
  const [found] = await ctx.db
    .select({ id: companies.id })
    .from(companies)
    .where(sql`lower(${companies.name}) = ${key}`)
    .limit(1);
  const id =
    found?.id ??
    (
      await ctx.db.insert(companies).values({ name: name.trim() }).returning({ id: companies.id })
    )[0]!.id;
  cache.set(key, id);
  return id;
}

/**
 * Normalise, filter (India, engineering roles), dedupe and upsert. Returns the ids of every job
 * touched. The same role from several sources merges into one row; the earliest posted date wins.
 */
export async function upsertJobs(ctx: Ctx, raws: RawJob[]): Promise<string[]> {
  const cache = new Map<string, string>();
  const ids: string[] = [];
  const model = await ctx.llm(null);
  let llmCalls = 0;

  for (const raw of raws) {
    if (!raw.title || !isTechRole(raw.title)) continue;
    if (!isIndia(raw)) continue;
    const city = normaliseLocation(raw.location);
    const mode = normaliseMode({ ...raw, workplace: raw.workplace ?? null });
    const exp = normaliseExperience(raw.title, raw.description);
    const text = `${raw.title}\n${raw.description}`;
    let skills = dictionarySkills(text);
    if (
      skills.length < 2 &&
      model &&
      llmCalls < LLM_SKILL_CALLS_PER_RUN &&
      raw.description.length > 200
    ) {
      llmCalls++;
      try {
        skills = [
          ...new Set([...skills, ...(await extractSkills(model, raw.description, skills))]),
        ].slice(0, 12);
      } catch (err) {
        ctx.log("skills: LLM failed", err instanceof Error ? err.message : err);
      }
    }
    const pay =
      raw.salaryMin || raw.salaryMax
        ? { min: toLpa(raw.salaryMin ?? raw.salaryMax), max: toLpa(raw.salaryMax ?? raw.salaryMin) }
        : statedSalary(raw.description);
    const postedAt = raw.postedAt ? new Date(raw.postedAt) : new Date();
    const hash = dedupeHash(raw.company, raw.title, city);
    const values = {
      sourceKey: raw.sourceKey,
      sourceLabel: raw.sourceLabel,
      externalId: raw.externalId,
      dedupeHash: hash,
      companyId: await companyId(ctx, raw.company, cache),
      title: raw.title,
      location: mode === "remote" && city === "Remote" ? "Remote" : city,
      mode,
      experience: exp.label,
      experienceMinYears: exp.min,
      experienceMaxYears: exp.max,
      skills,
      description: raw.description.slice(0, 20000),
      url: raw.url,
      salaryMin: pay?.min ?? null,
      salaryMax: pay?.max ?? null,
      postedAt: Number.isNaN(postedAt.getTime()) ? new Date() : postedAt,
    };

    const [existing] = await ctx.db
      .select({ id: jobs.id, postedAt: jobs.postedAt, sourceKey: jobs.sourceKey })
      .from(jobs)
      .where(eq(jobs.dedupeHash, hash));
    if (existing) {
      // Seen again: refresh it, reopen it, keep the earliest posted date.
      await ctx.db
        .update(jobs)
        .set({
          description: values.description || undefined,
          skills: values.skills.length ? values.skills : undefined,
          salaryMin: values.salaryMin ?? undefined,
          salaryMax: values.salaryMax ?? undefined,
          url: existing.sourceKey === "seed" ? values.url : undefined,
          postedAt: values.postedAt < existing.postedAt ? values.postedAt : undefined,
          closedAt: null,
          updatedAt: new Date(),
        })
        .where(eq(jobs.id, existing.id));
      ids.push(existing.id);
    } else {
      const [row] = await ctx.db
        .insert(jobs)
        .values(values)
        .onConflictDoUpdate({
          target: [jobs.sourceKey, jobs.externalId],
          set: {
            title: values.title,
            description: values.description,
            closedAt: null,
            updatedAt: new Date(),
          },
        })
        .returning({ id: jobs.id });
      ids.push(row!.id);
    }
  }
  await estimateSalaries(ctx, ids);
  return ids;
}

/**
 * Jobs without a stated salary get an estimate: the median band of comparable jobs (same title
 * family and city) that state one, else a market prior with low confidence.
 */
export async function estimateSalaries(ctx: Ctx, ids: string[]): Promise<void> {
  if (!ids.length) return;
  const targets = await ctx.db
    .select({
      id: jobs.id,
      title: jobs.title,
      location: jobs.location,
      minYears: jobs.experienceMinYears,
    })
    .from(jobs)
    .where(and(inArray(jobs.id, ids), isNull(jobs.salaryMin)));
  if (!targets.length) return;
  const stated = await ctx.db
    .select({
      title: jobs.title,
      location: jobs.location,
      min: jobs.salaryMin,
      max: jobs.salaryMax,
      minYears: jobs.experienceMinYears,
    })
    .from(jobs)
    .where(and(isNotNull(jobs.salaryMin), isNull(jobs.closedAt)));
  const median = (xs: number[]) => {
    const s = [...xs].sort((a, b) => a - b);
    return s[Math.floor(s.length / 2)]!;
  };
  for (const t of targets) {
    const fam = titleFamily(t.title);
    const band = (y: number | null) =>
      y == null ? "?" : y >= 5 ? "5" : y >= 3 ? "3" : y >= 1 ? "1" : "0";
    const peers = stated.filter(
      (s) =>
        titleFamily(s.title) === fam &&
        s.location === t.location &&
        band(s.minYears) === band(t.minYears),
    );
    const est =
      peers.length >= 3
        ? {
            min: median(peers.map((p) => p.min!)),
            max: median(peers.map((p) => p.max ?? p.min!)),
            confidence: Math.min(90, 40 + peers.length * 8),
            sampleSize: peers.length,
          }
        : { ...priorSalaryBand(fam, t.minYears), confidence: 30, sampleSize: peers.length };
    await ctx.db
      .insert(salaryEstimates)
      .values({ jobId: t.id, ...est })
      .onConflictDoUpdate({
        target: salaryEstimates.jobId,
        set: { ...est, updatedAt: new Date() },
      });
  }
}

/** Record a source run (job_sources.last_run_at / last_error) for freshness and the circuit breaker. */
export async function markSource(ctx: Ctx, key: string, error: string | null) {
  await ctx.db
    .insert(jobSources)
    .values({ key, lastRunAt: new Date(), lastError: error })
    .onConflictDoUpdate({
      target: jobSources.key,
      set: { lastRunAt: new Date(), lastError: error, updatedAt: new Date() },
    });
}

/** Close jobs not seen for `days` or past their expiry. Seed jobs are left alone. */
export async function closeStaleJobs(ctx: Ctx, days: number): Promise<number> {
  const cutoff = new Date(Date.now() - days * 86_400_000);
  const closed = await ctx.db
    .update(jobs)
    .set({ closedAt: new Date() })
    .where(
      and(
        isNull(jobs.closedAt),
        sql`${jobs.sourceKey} <> 'seed'`,
        sql`(${lt(jobs.updatedAt, cutoff)} or ${jobs.expiresAt} < now())`,
      ),
    )
    .returning({ id: jobs.id });
  return closed.length;
}
