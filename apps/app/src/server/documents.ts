import "server-only";
import { and, desc, eq, inArray, isNotNull } from "drizzle-orm";
import { applyDiffs, type JobCard, type Profile, type ResumeDiff } from "@ge/core";
import { schema } from "@ge/db";
import { getDb } from "./db";
import { loadJobCard, loadJobCards } from "./jobs";
import { loadProfile } from "./profile";

const { resumes, resumeDiffs, jobs } = schema;

export interface MainResume {
  id: string | null;
  doc: Profile;
  template: string;
  /** Hand-edited LaTeX; null while the code view is generated from `doc`. */
  latex: string | null;
  editedAt: string | null;
}

export interface TailoredItem {
  id: string;
  jobId: string | null;
  title: string;
  company: string;
  template: string;
  atsScore: number | null;
  editedAt: string;
  /** The tailored content: the main resume at creation with accepted rewrites applied. */
  doc: Profile;
}

export interface TailorData {
  job: JobCard;
  resume: {
    id: string;
    template: string;
    atsScoreBefore: number | null;
    editedAt: string;
    doc: Profile;
    diffs: ResumeDiff[];
  } | null;
}

export async function loadMainResume(userId: string): Promise<MainResume> {
  const [profile, [row]] = await Promise.all([
    loadProfile(userId),
    getDb()
      .select()
      .from(resumes)
      .where(and(eq(resumes.userId, userId), eq(resumes.kind, "main"))),
  ]);
  return {
    id: row?.id ?? null,
    doc: profile.doc,
    template: row?.template ?? "classic",
    latex: row?.sourceFormat === "latex" ? row.source : null,
    editedAt: row?.editedAt.toISOString() ?? null,
  };
}

/**
 * Keywords the main resume is scored against: the listed skills of the user's best-matching open
 * roles (up to 40), repeated once per posting so common skills weigh more.
 */
export async function mainAtsKeywords(
  userId: string,
): Promise<{ keywords: string[]; postings: number }> {
  const cards = (await loadJobCards(userId, { limit: 40 })).filter((c) => c.score != null);
  return { keywords: cards.flatMap((c) => c.skills), postings: cards.length };
}

async function diffsFor(resumeIds: string[]): Promise<Map<string, ResumeDiff[]>> {
  const rows = resumeIds.length
    ? await getDb()
        .select()
        .from(resumeDiffs)
        .where(inArray(resumeDiffs.resumeId, resumeIds))
        .orderBy(resumeDiffs.position)
    : [];
  const out = new Map<string, ResumeDiff[]>();
  for (const d of rows) {
    const list = out.get(d.resumeId) ?? [];
    list.push({
      id: d.id,
      section: d.section,
      old: d.old,
      new: d.new,
      reason: d.reason,
      status: d.status,
    });
    out.set(d.resumeId, list);
  }
  return out;
}

export async function loadTailoredList(userId: string): Promise<TailoredItem[]> {
  const rows = await getDb()
    .select({ r: resumes, jobTitle: jobs.title })
    .from(resumes)
    .leftJoin(jobs, eq(jobs.id, resumes.jobId))
    .where(and(eq(resumes.userId, userId), eq(resumes.kind, "tailored"), isNotNull(resumes.doc)))
    .orderBy(desc(resumes.editedAt));
  const diffs = await diffsFor(rows.map((x) => x.r.id));
  return rows.map(({ r, jobTitle }) => {
    // Names are "<title> · <company>" (see createTailoredResume).
    const [title, company = ""] = r.name.split(" · ");
    return {
      id: r.id,
      jobId: r.jobId,
      title: jobTitle ?? title!,
      company,
      template: r.template,
      atsScore: r.atsScore,
      editedAt: r.editedAt.toISOString(),
      doc: applyDiffs(r.doc!, diffs.get(r.id) ?? []),
    };
  });
}

/** The job and the newest tailored resume for it, if there is one. */
export async function loadTailor(userId: string, jobId: string): Promise<TailorData | null> {
  const job = await loadJobCard(userId, jobId);
  if (!job) return null;
  const [row] = await getDb()
    .select()
    .from(resumes)
    .where(and(eq(resumes.userId, userId), eq(resumes.kind, "tailored"), eq(resumes.jobId, jobId)))
    .orderBy(desc(resumes.createdAt))
    .limit(1);
  if (!row?.doc) return { job, resume: null };
  const diffs = (await diffsFor([row.id])).get(row.id) ?? [];
  return {
    job,
    resume: {
      id: row.id,
      template: row.template,
      atsScoreBefore: row.atsScoreBefore,
      editedAt: row.editedAt.toISOString(),
      doc: row.doc,
      diffs,
    },
  };
}
