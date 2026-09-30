import "server-only";
import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import {
  hasSkill,
  matchBreakdown,
  skillEvidence,
  type JobCard,
  type MatchBreakdown,
} from "@ge/core";
import { schema } from "@ge/db";
import { getDb } from "./db";
import { loadProfile } from "./profile";

const { jobs, companies, jobMatches, salaryEstimates, contacts, applications, hiddenJobs } = schema;

/**
 * Open jobs with the user's match score, salary (stated or estimated), contact status and
 * saved/hidden flags. Best match first; unscored jobs follow, newest first.
 */
export async function loadJobCards(
  userId: string,
  options: { ids?: string[]; limit?: number } = {},
): Promise<JobCard[]> {
  const db = getDb();
  const rows = await db
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
      postedAt: jobs.postedAt,
      sourceLabel: jobs.sourceLabel,
      url: jobs.url,
      score: jobMatches.score,
      reason: jobMatches.reason,
      missing: jobMatches.missing,
      estMin: salaryEstimates.min,
      estMax: salaryEstimates.max,
      estConfidence: salaryEstimates.confidence,
      estSamples: salaryEstimates.sampleSize,
      saved: sql<boolean>`${applications.id} is not null`,
      hidden: sql<boolean>`${hiddenJobs.jobId} is not null`,
    })
    .from(jobs)
    .innerJoin(companies, eq(companies.id, jobs.companyId))
    // Matches are cached per profile version. Use the newest one so a profile edit shows the
    // previous score until match.compute has caught up, instead of no score at all.
    .leftJoin(
      jobMatches,
      and(
        eq(jobMatches.jobId, jobs.id),
        eq(jobMatches.userId, userId),
        eq(
          jobMatches.profileVersion,
          sql`(select max(m.profile_version) from job_matches m where m.user_id = ${userId} and m.job_id = ${jobs.id})`,
        ),
      ),
    )
    .leftJoin(salaryEstimates, eq(salaryEstimates.jobId, jobs.id))
    .leftJoin(applications, and(eq(applications.jobId, jobs.id), eq(applications.userId, userId)))
    .leftJoin(hiddenJobs, and(eq(hiddenJobs.jobId, jobs.id), eq(hiddenJobs.userId, userId)))
    .where(and(isNull(jobs.closedAt), options.ids ? inArray(jobs.id, options.ids) : undefined))
    .orderBy(sql`${jobMatches.score} desc nulls last`, desc(jobs.postedAt))
    .limit(options.limit ?? 300);

  const ids = rows.map((r) => r.id);
  const contactRows = ids.length
    ? await db
        .select({
          jobId: contacts.jobId,
          status: contacts.status,
          name: contacts.name,
          role: contacts.role,
        })
        .from(contacts)
        .where(inArray(contacts.jobId, ids))
    : [];
  const contactByJob = new Map(contactRows.map((c) => [c.jobId, c]));

  return rows.map((r) => {
    const c = contactByJob.get(r.id);
    return {
      id: r.id,
      title: r.title,
      company: r.company,
      location: r.location,
      mode: r.mode,
      experience: r.experience,
      skills: r.skills,
      missing: r.missing ?? [],
      score: r.score,
      reason: r.reason,
      salary:
        r.salaryMin != null && r.salaryMax != null
          ? { type: "stated", min: r.salaryMin, max: r.salaryMax }
          : r.estMin != null && r.estMax != null
            ? {
                type: "est",
                min: r.estMin,
                max: r.estMax,
                confidence: r.estConfidence ?? 0,
                samples: r.estSamples ?? 0,
              }
            : null,
      postedAt: r.postedAt.toISOString(),
      sourceLabel: r.sourceLabel,
      url: r.url,
      contact: { status: c?.status ?? "none", name: c?.name ?? null, role: c?.role ?? null },
      saved: r.saved,
      hidden: r.hidden,
    } satisfies JobCard;
  });
}

export async function loadJobCard(userId: string, jobId: string): Promise<JobCard | null> {
  const [card] = await loadJobCards(userId, { ids: [jobId], limit: 1 });
  return card ?? null;
}

export interface JobDetail {
  job: JobCard;
  description: string;
  /** One row per listed skill, in listing order. */
  requirements: { skill: string; missing: boolean; evidence: string }[];
  breakdown: MatchBreakdown;
  /** Market p25–p75 in LPA from other open roles in the same city (all cities when too few). */
  market: { p25: number; p75: number } | null;
  contact: {
    status: JobCard["contact"]["status"];
    name: string | null;
    role: string | null;
    email: string | null;
    confidence: number | null;
    method: string | null;
    /** People found at this company so far. */
    companyCount: number;
  };
}

function percentile(sorted: number[], p: number) {
  const i = (sorted.length - 1) * p;
  const lo = Math.floor(i);
  return sorted[lo]! + (sorted[Math.ceil(i)]! - sorted[lo]!) * (i - lo);
}

export async function loadJobDetail(
  user: { id: string; experienceLevel?: string | null; preferredLocations?: string[] | null },
  jobId: string,
): Promise<JobDetail | null> {
  const db = getDb();
  const [job] = await loadJobCards(user.id, { ids: [jobId], limit: 1 });
  if (!job) return null;
  const [[row], profile, all] = await Promise.all([
    db
      .select({ description: jobs.description, companyId: jobs.companyId })
      .from(jobs)
      .where(eq(jobs.id, jobId)),
    loadProfile(user.id),
    loadJobCards(user.id, { limit: 500 }),
  ]);
  const [contactRow] = await db
    .select({ email: contacts.email, confidence: contacts.confidence, method: contacts.method })
    .from(contacts)
    .where(eq(contacts.jobId, jobId));
  const [{ n } = { n: 0 }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(contacts)
    .where(and(eq(contacts.companyId, row!.companyId), eq(contacts.status, "found")));

  // Skills the user has added since the match was computed no longer count as missing.
  const missing = job.missing.filter((s) => !hasSkill(profile.doc, s));
  const scored = { ...job, missing };
  const mids = (list: JobCard[]) =>
    list
      .flatMap((j) => (j.salary && j.id !== job.id ? [(j.salary.min + j.salary.max) / 2] : []))
      .sort((a, b) => a - b);
  const local = mids(all.filter((j) => j.location === job.location));
  const pool = local.length >= 4 ? local : mids(all);

  return {
    job: scored,
    description: row!.description,
    requirements: job.skills.map((skill) => {
      const miss = missing.includes(skill);
      return {
        skill,
        missing: miss,
        evidence: miss
          ? "Not in profile"
          : (skillEvidence(profile.doc, skill) ?? "Listed in skills"),
      };
    }),
    breakdown: matchBreakdown({
      profile: profile.doc,
      job: scored,
      experienceLevel: user.experienceLevel,
      preferredLocations: user.preferredLocations ?? [],
    }),
    market: pool.length >= 2 ? { p25: percentile(pool, 0.25), p75: percentile(pool, 0.75) } : null,
    contact: {
      ...job.contact,
      email: contactRow?.email ?? null,
      confidence: contactRow?.confidence ?? null,
      method: contactRow?.method ?? null,
      companyCount: n,
    },
  };
}
