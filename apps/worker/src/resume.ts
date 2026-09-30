import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { parseResume, tailorResume, type TailorDiff } from "@ge/ai";
import {
  ProfileSchema,
  applyDiffs,
  atsScore,
  latexToText,
  mentions,
  parseResumeText,
  profileSkills,
  templateName,
  toLatex,
  type Profile,
} from "@ge/core";
import { schema } from "@ge/db";
import { withFallback, type Ctx } from "./ctx";

const { resumes, resumeDiffs, profiles, users, jobs, companies } = schema;

/** PDF, DOCX or LaTeX bytes → plain text. */
export async function fileText(bytes: Uint8Array, format: string): Promise<string> {
  if (format === "pdf") {
    const { extractText, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(bytes);
    const { text } = await extractText(pdf, { mergePages: true });
    return text;
  }
  if (format === "docx") {
    const mammoth = await import("mammoth");
    const { value } = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
    return value;
  }
  return latexToText(new TextDecoder().decode(bytes));
}

/** Store a new profile version (the main resume's content, D18) and re-score the feed. */
async function saveProfile(ctx: Ctx, userId: string, doc: Profile) {
  const [cur] = await ctx.db
    .select({ version: profiles.version })
    .from(profiles)
    .where(eq(profiles.userId, userId));
  if (cur)
    await ctx.db
      .update(profiles)
      .set({ doc, version: cur.version + 1, updatedAt: new Date() })
      .where(eq(profiles.userId, userId));
  else await ctx.db.insert(profiles).values({ userId, doc });
  await ctx.send("match.compute", { userId }, `match:${userId}`);
}

const ParseJob = z.object({
  userId: z.string(),
  resumeId: z.string().uuid(),
  key: z.string().optional(),
  format: z.string().optional(),
  targetRole: z.string().nullish(),
});

/**
 * resume.parse: an uploaded file (or the pasted LaTeX) becomes the structured main resume.
 * Gemini extracts when configured; the rule-based parser otherwise.
 */
export async function parseResumeJob(ctx: Ctx, data: unknown) {
  const job = ParseJob.parse(data);
  const [row] = await ctx.db
    .select()
    .from(resumes)
    .where(and(eq(resumes.id, job.resumeId), eq(resumes.userId, job.userId)));
  const [user] = await ctx.db
    .select({ name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, job.userId));
  if (!row || !user) return;

  let text = "";
  let latex: string | null = null;
  if (job.key) {
    if (!job.key.startsWith(`users/${job.userId}/`))
      throw new Error("resume.parse: key outside the user's folder");
    const file = await ctx.storage.get(job.key);
    if (!file) throw new Error(`resume.parse: ${job.key} not found`);
    const format = (job.format ?? job.key.split(".").pop() ?? "").toLowerCase();
    if (format === "tex") latex = new TextDecoder().decode(file.body);
    text = await fileText(file.body, format);
  } else if (row.source) {
    latex = row.source;
    text = latexToText(row.source);
  }
  if (!text.trim()) throw new Error("resume.parse: no text found in the file");

  const doc = await withFallback(
    ctx,
    "parseResume",
    await ctx.llm(job.userId),
    (m) => parseResume(m, text, user),
    () => parseResumeText(text, user),
  );
  const [existing] = await ctx.db
    .select({ doc: profiles.doc })
    .from(profiles)
    .where(eq(profiles.userId, job.userId));
  const keywords = profileSkills(doc);
  await ctx.db
    .update(resumes)
    .set({
      doc,
      atsScore: atsScore(doc, keywords).score,
      // LaTeX uploads keep their source; other formats are edited visually from now on.
      ...(latex != null ? { sourceFormat: "latex" as const, source: latex } : {}),
      editedAt: new Date(),
    })
    .where(eq(resumes.id, row.id));
  // The parsed resume becomes the profile's resume content, keeping contact details already set.
  const prev = existing ? ProfileSchema.parse(existing.doc) : null;
  await saveProfile(ctx, job.userId, {
    ...doc,
    contact: {
      ...doc.contact,
      name: doc.contact.name || prev?.contact.name || user.name,
      email: doc.contact.email || prev?.contact.email || user.email,
    },
  });
  if (row.kind === "main")
    await ctx.send("resume.compile", { userId: job.userId, resumeId: row.id }, `compile:${row.id}`);
  ctx.log(
    `resume.parse ${row.id}: ${doc.experience.length} roles, ${doc.projects.length} projects, ${keywords.length} skills`,
  );
}

/**
 * Rule-based tailoring: only facts already in the resume. Bullets gain a job skill their own
 * project's stack names; the skills line gains skills the projects show but the list omits.
 */
export function ruleDiffs(doc: Profile, jobSkills: string[]): TailorDiff[] {
  const diffs: TailorDiff[] = [];
  for (const p of doc.projects) {
    const surface = jobSkills.filter(
      (s) => mentions(p.stack, s) && !p.bullets.some((b) => mentions(b, s)),
    );
    const target = p.bullets.find((b) => b.trim());
    if (surface.length && target) {
      const sentence = target.replace(/\.\s*$/, "");
      diffs.push({
        section: `Projects · ${p.name}`,
        old: target,
        new: `${sentence}, using ${surface.slice(0, 2).join(" and ")}.`,
        reason: `Names ${surface.slice(0, 2).join(" and ")}, which the job asks for and ${p.name} used.`,
      });
    }
  }
  const listed = new Set(profileSkills(doc).map((s) => s.toLowerCase()));
  const shown = jobSkills.filter(
    (s) =>
      !listed.has(s.toLowerCase()) &&
      [...doc.projects.map((p) => p.stack), ...doc.experience.flatMap((e) => e.bullets)].some((t) =>
        mentions(t, s),
      ),
  );
  const group = doc.skills.find((g) => /tool|framework|tech/i.test(g.name)) ?? doc.skills.at(-1);
  if (shown.length && group) {
    diffs.push({
      section: "Skills",
      old: `${group.name}: ${group.items.join(", ")}`,
      new: `${group.name}: ${[...group.items, ...shown].join(", ")}`,
      reason: `Adds ${shown.join(", ")}, which your projects already use and the job lists.`,
    });
  }
  return diffs.slice(0, 6);
}

const TailorJob = z.object({
  userId: z.string(),
  resumeId: z.string().uuid(),
  jobId: z.string().uuid().nullish(),
  regenerate: z.boolean().optional(),
});

/** resume.tailor: suggested rewrites for one job (resume_diffs), reviewed by the user. */
export async function tailorResumeJob(ctx: Ctx, data: unknown) {
  const t = TailorJob.parse(data);
  const [row] = await ctx.db
    .select()
    .from(resumes)
    .where(and(eq(resumes.id, t.resumeId), eq(resumes.userId, t.userId)));
  if (!row || !row.jobId || !row.doc) return;
  const [job] = await ctx.db
    .select({
      title: jobs.title,
      company: companies.name,
      skills: jobs.skills,
      description: jobs.description,
    })
    .from(jobs)
    .innerJoin(companies, eq(companies.id, jobs.companyId))
    .where(eq(jobs.id, row.jobId));
  if (!job) return;
  const doc = ProfileSchema.parse(row.doc);
  const diffs = await withFallback(
    ctx,
    "tailorResume",
    await ctx.llm(t.userId),
    async (m) => {
      const ai = await tailorResume(m, { profile: doc, job });
      return ai.length ? ai : ruleDiffs(doc, job.skills);
    },
    () => ruleDiffs(doc, job.skills),
  );
  await ctx.db.transaction(async (tx) => {
    await tx.delete(resumeDiffs).where(eq(resumeDiffs.resumeId, row.id));
    if (diffs.length)
      await tx
        .insert(resumeDiffs)
        .values(diffs.map((d, i) => ({ resumeId: row.id, ...d, position: i })));
  });
  ctx.log(`resume.tailor ${row.id}: ${diffs.length} suggestions`);
}

function run(cmd: string, args: string[], cwd: string): Promise<{ code: number; out: string }> {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { cwd });
    let out = "";
    p.stdout.on("data", (d) => (out += d));
    p.stderr.on("data", (d) => (out += d));
    p.on("error", reject);
    p.on("close", (code) => resolve({ code: code ?? 1, out }));
  });
}

/** resume.compile: LaTeX → PDF with Tectonic, stored and linked on the resume (pdf_key). */
export async function compileResumeJob(ctx: Ctx, data: unknown) {
  const { userId, resumeId } = z
    .object({ userId: z.string(), resumeId: z.string().uuid() })
    .parse(data);
  const [row] = await ctx.db
    .select()
    .from(resumes)
    .where(and(eq(resumes.id, resumeId), eq(resumes.userId, userId)));
  if (!row) return;
  let doc = row.doc ? ProfileSchema.parse(row.doc) : null;
  // A tailored resume is its copy of the main resume plus the rewrites the user accepted.
  if (doc && row.kind === "tailored") {
    const diffs = await ctx.db.select().from(resumeDiffs).where(eq(resumeDiffs.resumeId, row.id));
    doc = applyDiffs(doc, diffs);
  }
  const source =
    row.sourceFormat === "latex" && row.source
      ? row.source
      : doc
        ? toLatex(doc, templateName(row.template))
        : null;
  if (!source) return;
  const dir = await mkdtemp(join(tmpdir(), "ge-resume-"));
  try {
    await writeFile(join(dir, "resume.tex"), source);
    let result: { code: number; out: string };
    try {
      result = await run(
        ctx.env.TECTONIC_BIN ?? "tectonic",
        ["--chatter", "minimal", "resume.tex"],
        dir,
      );
    } catch (err) {
      // No Tectonic on this machine: the app keeps printing the preview instead.
      ctx.log(
        "resume.compile: Tectonic isn't installed; skipping",
        err instanceof Error ? err.message : err,
      );
      return;
    }
    if (result.code !== 0) throw new Error(`Tectonic failed: ${result.out.slice(-800)}`);
    const pdf = await readFile(join(dir, "resume.pdf"));
    // The edit time in the name tells the app whether this PDF matches the current resume.
    const key = `users/${userId}/compiled/${row.id}-${row.editedAt.getTime()}.pdf`;
    await ctx.storage.put(key, new Uint8Array(pdf), "application/pdf");
    await ctx.db
      .update(resumes)
      .set({ pdfKey: key, updatedAt: new Date() })
      .where(eq(resumes.id, row.id));
    ctx.log(`resume.compile ${row.id}: ${pdf.length} bytes`);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
