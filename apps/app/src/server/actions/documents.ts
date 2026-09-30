"use server";
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ProfileSchema, RESUME_TEMPLATES, applyDiffs, atsScore, type Profile } from "@ge/core";
import { schema } from "@ge/db";
import { getDb } from "../db";
import { mainAtsKeywords } from "../documents";
import { loadJobCard } from "../jobs";
import { loadProfile, saveProfile } from "../profile";
import { enqueue } from "../queue";
import { requireUser } from "../session";

const { resumes, resumeDiffs, applications, applicationEvents } = schema;
const Id = z.uuid();
const Template = z.enum(RESUME_TEMPLATES.map((t) => t.id) as [string, ...string[]]);

const refresh = () => revalidatePath("/documents");

async function ownResume(userId: string, id: string) {
  const [row] = await getDb()
    .select()
    .from(resumes)
    .where(and(eq(resumes.id, Id.parse(id)), eq(resumes.userId, userId)));
  if (!row) throw new Error("Resume not found");
  return row;
}

/** Save the main resume (the profile document, docs/decisions.md D18) and its ATS score. */
export async function saveMainResume(doc: Profile): Promise<{ atsScore: number }> {
  const user = await requireUser();
  const parsed = ProfileSchema.parse(doc);
  const { keywords } = await mainAtsKeywords(user.id);
  const score = atsScore(parsed, keywords).score;
  await saveProfile(user.id, parsed, { atsScore: score });
  refresh();
  return { atsScore: score };
}

/** Hand-edited LaTeX for the main resume; null goes back to code generated from the content. */
export async function saveMainLatex(source: string | null) {
  const user = await requireUser();
  const text = source == null ? null : z.string().max(200_000).parse(source);
  await getDb()
    .update(resumes)
    .set({
      sourceFormat: text == null ? "structured" : "latex",
      source: text,
      editedAt: new Date(),
    })
    .where(and(eq(resumes.userId, user.id), eq(resumes.kind, "main")));
  refresh();
}

/** The main resume's template; creates the main resume row if the user has none yet. */
export async function setMainTemplate(template: string) {
  const user = await requireUser();
  const value = Template.parse(template);
  const db = getDb();
  const updated = await db
    .update(resumes)
    .set({ template: value })
    .where(and(eq(resumes.userId, user.id), eq(resumes.kind, "main")))
    .returning({ id: resumes.id });
  if (updated.length === 0) {
    const { doc } = await loadProfile(user.id);
    await db
      .insert(resumes)
      .values({ userId: user.id, kind: "main", name: "Main resume", template: value, doc });
  }
  refresh();
}

export async function setResumeTemplate(resumeId: string, template: string) {
  const user = await requireUser();
  const row = await ownResume(user.id, resumeId);
  await getDb()
    .update(resumes)
    .set({ template: Template.parse(template) })
    .where(eq(resumes.id, row.id));
  refresh();
}

/**
 * Upload view, "Paste LaTeX": stores the source on the main resume and queues resume.parse to fit
 * it into the structured document. Files go through /api/uploads/resume instead.
 */
export async function submitLatexResume(input: {
  source: string;
  template: string;
  targetRole?: string;
}) {
  const user = await requireUser();
  const source = z.string().trim().min(1).max(200_000).parse(input.source);
  const template = Template.parse(input.template);
  const db = getDb();
  const values = { sourceFormat: "latex" as const, source, template, editedAt: new Date() };
  const [existing] = await db
    .select({ id: resumes.id })
    .from(resumes)
    .where(and(eq(resumes.userId, user.id), eq(resumes.kind, "main")));
  const [row] = existing
    ? await db
        .update(resumes)
        .set(values)
        .where(eq(resumes.id, existing.id))
        .returning({ id: resumes.id })
    : await db
        .insert(resumes)
        .values({ userId: user.id, kind: "main", name: "Main resume", ...values })
        .returning({ id: resumes.id });
  await enqueue(
    "resume.parse",
    {
      userId: user.id,
      resumeId: row!.id,
      format: "tex",
      targetRole: input.targetRole?.trim() || null,
    },
    { singletonKey: row!.id },
  );
  refresh();
}

/** Upload view, "Upload file" then "Fit resume": parse the uploaded file with the chosen options. */
export async function fitUploadedResume(input: {
  key: string;
  template: string;
  targetRole?: string;
}) {
  const user = await requireUser();
  const key = z.string().parse(input.key);
  // Keys are minted per user by /api/uploads/resume.
  if (!key.startsWith(`users/${user.id}/resumes/`)) throw new Error("Unknown upload");
  const [row] = await getDb()
    .update(resumes)
    .set({ template: Template.parse(input.template), editedAt: new Date() })
    .where(and(eq(resumes.userId, user.id), eq(resumes.kind, "main")))
    .returning({ id: resumes.id });
  if (!row) throw new Error("Upload the file first");
  await enqueue(
    "resume.parse",
    {
      userId: user.id,
      resumeId: row.id,
      key,
      format: key.split(".").pop(),
      targetRole: input.targetRole?.trim() || null,
    },
    { singletonKey: row.id },
  );
  refresh();
}

/**
 * Start tailoring for a job: a copy of the main resume, scored against the job, and a queued
 * resume.tailor that writes the suggested rewrites (resume_diffs).
 */
export async function createTailoredResume(jobId: string): Promise<string> {
  const user = await requireUser();
  const job = await loadJobCard(user.id, Id.parse(jobId));
  if (!job) throw new Error("Job not found");
  const db = getDb();
  const [existing] = await db
    .select({ id: resumes.id })
    .from(resumes)
    .where(
      and(eq(resumes.userId, user.id), eq(resumes.kind, "tailored"), eq(resumes.jobId, job.id)),
    );
  if (existing) return existing.id;
  const [{ doc }, [main]] = await Promise.all([
    loadProfile(user.id),
    db
      .select({ id: resumes.id, template: resumes.template })
      .from(resumes)
      .where(and(eq(resumes.userId, user.id), eq(resumes.kind, "main"))),
  ]);
  const before = atsScore(doc, job.skills).score;
  const [row] = await db
    .insert(resumes)
    .values({
      userId: user.id,
      kind: "tailored",
      parentId: main?.id ?? null,
      jobId: job.id,
      name: `${job.title} · ${job.company}`,
      template: main?.template ?? "classic",
      doc,
      atsScoreBefore: before,
      atsScore: before,
    })
    .returning({ id: resumes.id });
  await enqueue(
    "resume.tailor",
    { userId: user.id, resumeId: row!.id, jobId: job.id },
    { singletonKey: row!.id },
  );
  refresh();
  return row!.id;
}

export async function setDiffStatus(
  resumeId: string,
  diffIds: string[],
  status: "pending" | "accepted" | "rejected",
) {
  const user = await requireUser();
  const row = await ownResume(user.id, resumeId);
  const ids = z.array(Id).parse(diffIds);
  if (ids.length === 0) return;
  await getDb()
    .update(resumeDiffs)
    .set({ status: z.enum(["pending", "accepted", "rejected"]).parse(status) })
    .where(and(eq(resumeDiffs.resumeId, row.id), inArray(resumeDiffs.id, ids)));
}

/** "Regenerate all suggestions": clears the review and asks the worker for a new set. */
export async function regenerateSuggestions(resumeId: string) {
  const user = await requireUser();
  const row = await ownResume(user.id, resumeId);
  await getDb()
    .update(resumeDiffs)
    .set({ status: "pending" })
    .where(eq(resumeDiffs.resumeId, row.id));
  await enqueue(
    "resume.tailor",
    { userId: user.id, resumeId: row.id, jobId: row.jobId, regenerate: true },
    { singletonKey: row.id },
  );
}

/**
 * Save a tailored resume: stores the ATS score with the accepted rewrites and marks the
 * application "tailored" in the tracker.
 */
export async function saveTailoredResume(resumeId: string): Promise<{ atsScore: number }> {
  const user = await requireUser();
  const row = await ownResume(user.id, resumeId);
  const db = getDb();
  const [diffs, job] = await Promise.all([
    db.select().from(resumeDiffs).where(eq(resumeDiffs.resumeId, row.id)),
    row.jobId ? loadJobCard(user.id, row.jobId) : null,
  ]);
  const doc = applyDiffs(row.doc ?? (await loadProfile(user.id)).doc, diffs);
  const score = atsScore(doc, job?.skills ?? []).score;
  await db
    .update(resumes)
    .set({ atsScore: score, editedAt: new Date() })
    .where(eq(resumes.id, row.id));
  if (row.jobId && diffs.some((d) => d.status === "accepted")) {
    const [app] = await db
      .select({ id: applications.id })
      .from(applications)
      .where(and(eq(applications.userId, user.id), eq(applications.jobId, row.jobId)));
    if (app) {
      const [seen] = await db
        .select({ id: applicationEvents.id })
        .from(applicationEvents)
        .where(
          and(eq(applicationEvents.applicationId, app.id), eq(applicationEvents.kind, "tailored")),
        );
      if (!seen)
        await db
          .insert(applicationEvents)
          .values({ applicationId: app.id, kind: "tailored", data: { resumeId: row.id } });
    }
  }
  refresh();
  revalidatePath("/tracker");
  return { atsScore: score };
}

export async function deleteTailoredResume(resumeId: string) {
  const user = await requireUser();
  const row = await ownResume(user.id, resumeId);
  if (row.kind !== "tailored") throw new Error("Only tailored resumes can be deleted");
  await getDb().delete(resumes).where(eq(resumes.id, row.id));
  refresh();
}
