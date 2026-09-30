import { generateText, Output, type LanguageModel } from "ai";
import { z } from "zod";
import {
  FILTER_OPTIONS,
  ProfileSchema,
  type JobFilters,
  type Profile,
  type RubricScores,
} from "@ge/core";
import { HOUSE_STYLE } from "./model";

/*
 * One function per LLM task. Each takes a model from languageModel() and returns validated data;
 * callers keep the rule-based result when the model is null or a call fails.
 */

const brief = (p: Profile) =>
  JSON.stringify({
    summary: p.summary,
    skills: p.skills.flatMap((g) => g.items),
    experience: p.experience.map((e) => ({ role: e.role, co: e.co, bullets: e.bullets })),
    projects: p.projects.map((x) => ({ name: x.name, stack: x.stack, bullets: x.bullets })),
    education: p.education.map((e) => `${e.degree}, ${e.school} ${e.dates}`),
  });

async function object<T>(
  model: LanguageModel,
  schema: z.ZodType<T>,
  prompt: string,
  system = HOUSE_STYLE,
) {
  const { output } = await generateText({
    model,
    system,
    prompt,
    output: Output.object({ schema }),
    maxRetries: 1,
  });
  return output as T;
}

/** Plain-English search → filters. The rule parser's result is passed in and refined. */
export async function parseQuery(
  model: LanguageModel,
  query: string,
  rules: JobFilters,
): Promise<JobFilters> {
  const schema = z.object({
    type: z.enum(["any", "job", "internship"]),
    roles: z.array(z.string()),
    locations: z.array(z.string()),
    modes: z.array(z.enum(["Remote", "Hybrid", "On-site"])),
    experience: z.array(z.string()),
    salaryMinLpa: z.number().min(0).max(100),
    skills: z.array(z.string()),
  });
  const out = await object(
    model,
    schema,
    `Turn this job search into filters.\nQuery: ${JSON.stringify(query)}\n` +
      `Prefer these values when they fit: roles ${FILTER_OPTIONS.roles.join(", ")}; locations ${FILTER_OPTIONS.locations.join(", ")}; ` +
      `experience ${FILTER_OPTIONS.experience.join(", ")}. Salary is a minimum in LPA (0 if none; "40k a month" is 4.8 LPA). ` +
      `A rule-based parser already found: ${JSON.stringify(rules)}. Keep what is right and add what it missed.`,
  );
  return {
    ...rules,
    type: out.type,
    roles: [...new Set(out.roles)],
    locations: [...new Set(out.locations)],
    modes: [...new Set(out.modes)],
    experience: [...new Set(out.experience)],
    salaryMin:
      out.salaryMinLpa > 0
        ? Math.min(30, Math.max(1, Math.round(out.salaryMinLpa)))
        : rules.salaryMin,
    skills: [...new Set(out.skills)],
  };
}

/** Skills a job description asks for that the dictionary missed. */
export async function extractSkills(
  model: LanguageModel,
  description: string,
  found: string[],
): Promise<string[]> {
  const out = await object(
    model,
    z.object({ skills: z.array(z.string()).max(15) }),
    `List the concrete technical skills (languages, frameworks, tools, platforms) this job asks for, ` +
      `as short names like "Go", "Kafka", "PostgreSQL". Already found: ${found.join(", ") || "none"}.\n\n${description.slice(0, 6000)}`,
  );
  return out.skills;
}

/** One sentence on why a job fits, for the job card. */
export async function matchReason(
  model: LanguageModel,
  input: {
    profile: Profile;
    job: { title: string; company: string; skills: string[]; description: string };
    score: number;
    missing: string[];
  },
): Promise<string> {
  const out = await object(
    model,
    z.object({ reason: z.string().max(160) }),
    `In one sentence (under 20 words), tell the user why this job fits them, citing a specific project or role of theirs. ` +
      `Don't mention the score. Match score ${input.score}/100; missing skills: ${input.missing.join(", ") || "none"}.\n` +
      `Job: ${input.job.title} at ${input.job.company}. Skills: ${input.job.skills.join(", ")}.\n${input.job.description.slice(0, 1500)}\n\nProfile: ${brief(input.profile)}`,
  );
  return out.reason;
}

export interface TailorDiff {
  section: string;
  old: string;
  new: string;
  reason: string;
}

/**
 * Per-bullet rewrites for one job. Only rephrases what the resume already says; each diff's `old`
 * is an exact existing line so the app can apply it.
 */
export async function tailorResume(
  model: LanguageModel,
  input: {
    profile: Profile;
    job: { title: string; company: string; skills: string[]; description: string };
  },
): Promise<TailorDiff[]> {
  const lines = [
    { section: "Summary", text: input.profile.summary },
    ...input.profile.experience.flatMap((e) =>
      e.bullets.map((b) => ({ section: `Experience · ${e.co}`, text: b })),
    ),
    ...input.profile.projects.flatMap((p) =>
      p.bullets.map((b) => ({ section: `Projects · ${p.name}`, text: b })),
    ),
  ].filter((l) => l.text.trim());
  const out = await object(
    model,
    z.object({
      diffs: z
        .array(z.object({ index: z.number().int(), new: z.string(), reason: z.string().max(140) }))
        .max(8),
    }),
    `Tailor this resume to the job by rewriting up to 6 lines. Rules: keep every fact true (no new numbers, employers, ` +
      `tools or outcomes that aren't in the line or the profile), surface skills the job asks for when the profile backs them, ` +
      `lead with impact, keep each line under 30 words. Give the index of the line you rewrite and a one-line reason.\n` +
      `Job: ${input.job.title} at ${input.job.company}. Skills: ${input.job.skills.join(", ")}.\n${input.job.description.slice(0, 2500)}\n\n` +
      `Lines:\n${lines.map((l, i) => `${i}. [${l.section}] ${l.text}`).join("\n")}\n\nFull profile: ${brief(input.profile)}`,
  );
  return out.diffs
    .filter((d) => lines[d.index] && d.new.trim() && d.new.trim() !== lines[d.index]!.text.trim())
    .map((d) => ({
      section: lines[d.index]!.section,
      old: lines[d.index]!.text,
      new: d.new.trim(),
      reason: d.reason,
    }));
}

/** An outreach email to a hiring manager. Sent only after the user approves it. */
export async function draftEmail(
  model: LanguageModel,
  input: {
    toName: string;
    toRole: string | null;
    job: { title: string; company: string; description: string };
    profile: Profile;
    senderName: string;
    tone: string;
    reason: string | null;
  },
): Promise<{ subject: string; body: string }> {
  return object(
    model,
    z.object({ subject: z.string().max(90), body: z.string().max(1500) }),
    `Write a short cold email (90–140 words) from ${input.senderName} to ${input.toName}${input.toRole ? `, ${input.toRole}` : ""} ` +
      `about the ${input.job.title} role at ${input.job.company}. Tone: ${input.tone}. Mention one specific, true thing from the profile ` +
      `that fits the role, say a tailored resume is attached, and ask for a 15-minute chat. Plain text, first name greeting, sign off with the sender's first name.\n` +
      `Why it fits: ${input.reason ?? "use the profile"}\nJob: ${input.job.description.slice(0, 1500)}\nProfile: ${brief(input.profile)}`,
  );
}

/** Resume text (from a PDF, DOCX or LaTeX file) → the structured profile. */
export async function parseResume(
  model: LanguageModel,
  text: string,
  fallback: { name: string; email: string },
): Promise<Profile> {
  const out = await object(
    model,
    ProfileSchema,
    `Extract this resume into the schema. Copy text exactly, don't summarise or invent. Dates as written ("Jun 2025 – Jul 2025"). ` +
      `Group skills as they appear (e.g. Languages, Frameworks, Tools). If the name or email is missing use ${fallback.name} / ${fallback.email}.\n\n${text.slice(0, 20000)}`,
  );
  return ProfileSchema.parse(out);
}

/** The interviewer's next line: a short follow-up on the answer, or the next planned question. */
export async function interviewTurn(
  model: LanguageModel,
  input: {
    role: string;
    strictness: "Lenient" | "Standard" | "Strict";
    transcript: { who: "ai" | "you"; text: string }[];
    nextQuestion: string | null;
    followUpsLeft: number;
  },
): Promise<{ text: string; followUp: boolean }> {
  const out = await object(
    model,
    z.object({ text: z.string().max(400), followUp: z.boolean() }),
    `You are a ${input.strictness.toLowerCase()} interviewer for a ${input.role} role. Reply in one or two short spoken sentences. ` +
      (input.followUpsLeft > 0
        ? `If the last answer was vague or missed something important, ask one pointed follow-up (followUp: true). Otherwise `
        : "") +
      (input.nextQuestion
        ? `briefly acknowledge the answer and ask the next question: ${JSON.stringify(input.nextQuestion)} (followUp: false).`
        : `thank the candidate and close the interview (followUp: false).`) +
      `\n\nTranscript:\n${input.transcript.map((l) => `${l.who === "ai" ? "Interviewer" : "Candidate"}: ${l.text}`).join("\n")}`,
    "You run realistic mock job interviews. Speak naturally, never give away answers, no emoji.",
  );
  return out;
}

export interface GradedInterview {
  rubric: RubricScores;
  summary: string;
  answers: { q: string; score: number; note: string; tip: string }[];
}

/** interview.grade: the four-part rubric and answer-by-answer notes. */
export async function gradeInterview(
  model: LanguageModel,
  input: { role: string; strictness: string; qa: { q: string; a: string }[] },
): Promise<GradedInterview> {
  const score = z.number().int().min(0).max(100);
  return object(
    model,
    z.object({
      rubric: z.object({
        communication: score,
        technical: score,
        structure: score,
        confidence: score,
      }),
      summary: z.string().max(300),
      answers: z.array(
        z.object({ q: z.string(), score, note: z.string().max(200), tip: z.string().max(120) }),
      ),
    }),
    `Grade this ${input.role} mock interview (${input.strictness.toLowerCase()} marking). Score each rubric part 0–100. ` +
      `Summary: two sentences, what was strongest and the one thing to fix. For each answer: a score, a specific note, and a tip ` +
      `starting with a lowercase verb (e.g. "state the trade-off first."). Unanswered questions score 0.\n\n` +
      input.qa.map((x, i) => `Q${i + 1}: ${x.q}\nA${i + 1}: ${x.a || "(no answer)"}`).join("\n\n"),
  );
}

/** LinkedIn profile text (PDF export or public page) → rebuilt sections and rewrites that match the resume. */
export async function linkedinReview(
  model: LanguageModel,
  input: { text: string; profile: Profile },
): Promise<{
  sections: { icon: string; title: string; body: string }[];
  strength: number;
  suggestions: { section: string; old: string; new: string; alts: string[]; reason: string }[];
}> {
  return object(
    model,
    z.object({
      sections: z
        .array(z.object({ icon: z.string(), title: z.string(), body: z.string() }))
        .max(10),
      strength: z.number().int().min(0).max(100),
      suggestions: z
        .array(
          z.object({
            section: z.string(),
            old: z.string(),
            new: z.string(),
            alts: z.array(z.string()).max(2),
            reason: z.string().max(140),
          }),
        )
        .max(5),
    }),
    `Rebuild this LinkedIn profile into sections (Headline, About, Education, Experience, Projects, Skills; icons from: ` +
      `user-round, align-left, graduation-cap, briefcase, folder-git-2, code). Score its strength 0–100 for recruiter search. ` +
      `Suggest up to 4 rewrites where the resume says it better; only use facts from the resume.\n\nLinkedIn:\n${input.text.slice(0, 12000)}\n\nResume: ${brief(input.profile)}`,
  );
}
