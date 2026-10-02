import { and, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { parseQuery } from "@ge/ai";
import {
  EMPTY_FILTERS,
  chipsToFilters,
  filtersToChips,
  matchesFilters,
  parseFilters,
  SEARCH_FREQUENCY_MS,
  type JobCard,
  type JobFilters,
  type RawJob,
} from "@ge/core";
import { schema } from "@ge/db";
import { withFallback, type Ctx } from "../ctx";
import { closeStaleJobs, markSource, upsertJobs } from "./pipeline";
import { BOARDS, adzuna, ashby, greenhouse, lever, linkedin } from "./sources";

const { jobs, companies, jobSources, savedSearches, savedSearchResults, salaryEstimates } = schema;

const BOARD_FETCH = { greenhouse, lever, ashby } as const;
/** A source that failed is skipped for this long (circuit breaker). */
const COOL_DOWN_MS = 30 * 60_000;

async function due(ctx: Ctx, key: string, freshMs: number): Promise<boolean> {
  const [row] = await ctx.db
    .select({
      lastRunAt: jobSources.lastRunAt,
      lastError: jobSources.lastError,
      enabled: jobSources.enabled,
    })
    .from(jobSources)
    .where(eq(jobSources.key, key));
  if (!row) return true;
  if (!row.enabled) return false;
  const age = Date.now() - (row.lastRunAt?.getTime() ?? 0);
  return age > (row.lastError ? COOL_DOWN_MS : freshMs);
}

async function run(ctx: Ctx, key: string, fetcher: () => Promise<RawJob[]>): Promise<RawJob[]> {
  try {
    const out = await fetcher();
    await markSource(ctx, key, null);
    return out;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    ctx.log(`source ${key} failed: ${msg}`);
    await markSource(ctx, key, msg.slice(0, 500));
    return [];
  }
}

/** Company boards return all their openings, so they refresh on a timer rather than per query. */
async function refreshBoards(ctx: Ctx, force = false): Promise<string[]> {
  const freshMs = ctx.env.SEARCH_FRESHNESS_MINUTES * 60_000;
  const raws: RawJob[] = [];
  for (const b of BOARDS) {
    const key = `${b.source}:${b.token}`;
    if (!force && !(await due(ctx, key, freshMs))) continue;
    raws.push(...(await run(ctx, key, () => BOARD_FETCH[b.source](b.token, b.company))));
  }
  return upsertJobs(ctx, raws);
}

/** Open jobs as the filter code expects them (salary stated or estimated). */
async function openCards(ctx: Ctx): Promise<JobCard[]> {
  const rows = await ctx.db
    .select({
      id: jobs.id,
      title: jobs.title,
      company: companies.name,
      location: jobs.location,
      mode: jobs.mode,
      experience: jobs.experience,
      skills: jobs.skills,
      salaryMin: jobs.salaryMin,
      salaryMax: jobs.salaryMax,
      estMin: salaryEstimates.min,
      estMax: salaryEstimates.max,
      postedAt: jobs.postedAt,
    })
    .from(jobs)
    .innerJoin(companies, eq(companies.id, jobs.companyId))
    .leftJoin(salaryEstimates, eq(salaryEstimates.jobId, jobs.id))
    .where(isNull(jobs.closedAt));
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    company: r.company,
    location: r.location,
    mode: r.mode,
    experience: r.experience,
    skills: r.skills,
    missing: [],
    score: null,
    reason: null,
    salary:
      r.salaryMin != null
        ? { type: "stated", min: r.salaryMin, max: r.salaryMax ?? r.salaryMin }
        : r.estMin != null
          ? { type: "est", min: r.estMin, max: r.estMax!, confidence: 0, samples: 0 }
          : null,
    postedAt: r.postedAt.toISOString(),
    sourceLabel: "",
    url: null,
    contact: { status: "none", name: null, role: null },
    saved: false,
    hidden: false,
  }));
}

const SearchJob = z.object({
  userId: z.string().optional(),
  savedSearchId: z.string().uuid().optional(),
  query: z.string().max(3000).optional(),
  force: z.boolean().optional(),
});

/**
 * ingest.search: refresh company boards when stale, run keyword sources for the query, record new
 * matches on a saved search, then re-score the user's feed.
 */
export async function ingestSearch(ctx: Ctx, data: unknown) {
  const job = SearchJob.parse(data);
  let filters: JobFilters = EMPTY_FILTERS;
  let saved: typeof savedSearches.$inferSelect | undefined;
  if (job.savedSearchId) {
    [saved] = await ctx.db
      .select()
      .from(savedSearches)
      .where(eq(savedSearches.id, job.savedSearchId));
    if (!saved || saved.deletedAt) return;
    filters = chipsToFilters(saved.filters);
    // The LLM refines the rule-based chips once; they are stored so the UI shows them.
    if (saved.query.trim() && !saved.lastRunAt) {
      const refined = await withFallback(
        ctx,
        "parseQuery",
        await ctx.llm(saved.userId),
        (m) => parseQuery(m, saved!.query, filters),
        () => filters,
      );
      if (refined !== filters) {
        filters = refined;
        await ctx.db
          .update(savedSearches)
          .set({ filters: filtersToChips(filters) })
          .where(eq(savedSearches.id, saved.id));
      }
    }
  } else if (job.query) {
    filters = parseFilters(job.query);
  }

  const touched = await refreshBoards(ctx, job.force);
  const keyword: RawJob[] = [];
  const freshMs = ctx.env.SEARCH_FRESHNESS_MINUTES * 60_000;
  if (job.savedSearchId || job.query) {
    if (ctx.env.ADZUNA_APP_ID && (await due(ctx, "adzuna", 0)))
      keyword.push(...(await run(ctx, "adzuna", () => adzuna(ctx.env, filters))));
    if (ctx.env.LINKEDIN_SCRAPING_ENABLED && (await due(ctx, "linkedin", freshMs / 4)))
      keyword.push(...(await run(ctx, "linkedin", () => linkedin(ctx.env, filters))));
  }
  touched.push(...(await upsertJobs(ctx, keyword)));

  if (saved) {
    const hits = (await openCards(ctx)).filter((c) => matchesFilters(c, filters));
    let fresh = 0;
    if (hits.length) {
      const inserted = await ctx.db
        .insert(savedSearchResults)
        .values(hits.map((h) => ({ savedSearchId: saved!.id, jobId: h.id })))
        .onConflictDoNothing()
        .returning({ jobId: savedSearchResults.jobId });
      fresh = inserted.length;
    }
    await ctx.db
      .update(savedSearches)
      .set({ lastRunAt: new Date(), newCount: sql`${savedSearches.newCount} + ${fresh}` })
      .where(eq(savedSearches.id, saved.id));
    ctx.log(`saved search ${saved.id}: ${hits.length} matches, ${fresh} new`);
  }
  const userId = job.userId ?? saved?.userId;
  if (userId && touched.length) await ctx.send("match.compute", { userId }, `match:${userId}`);
}

/** ingest.refresh-saved (cron): queue every active cloud search that is due. */
export async function refreshSaved(ctx: Ctx) {
  const rows = await ctx.db
    .select({
      id: savedSearches.id,
      userId: savedSearches.userId,
      frequency: savedSearches.frequency,
      lastRunAt: savedSearches.lastRunAt,
    })
    .from(savedSearches)
    .where(
      and(
        eq(savedSearches.active, true),
        eq(savedSearches.runOn, "cloud"),
        isNull(savedSearches.deletedAt),
      ),
    );
  let queued = 0;
  for (const r of rows) {
    const age = Date.now() - (r.lastRunAt?.getTime() ?? 0);
    // Five minutes' slack so a 4-hourly search runs on its fourth hourly tick, not the fifth.
    if (age + 5 * 60_000 < SEARCH_FREQUENCY_MS[r.frequency]) continue;
    await ctx.send("ingest.search", { userId: r.userId, savedSearchId: r.id }, r.id);
    queued++;
  }
  ctx.log(`refresh-saved: ${queued} of ${rows.length} searches queued`);
}

/** ingest.cleanup (daily cron): close expired and long-unseen jobs. */
export async function cleanup(ctx: Ctx) {
  const n = await closeStaleJobs(ctx, ctx.env.JOB_STALE_DAYS);
  ctx.log(`cleanup: closed ${n} jobs`);
}
