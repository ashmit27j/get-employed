"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { MCQ_BANK, gradeSession, interviewQuestions, type InterviewType } from "@ge/core";
import { schema } from "@ge/db";
import { getDb } from "../db";
import { liveSessionsThisMonth } from "../interview";
import { enqueue } from "../queue";
import { requireUser } from "../session";

const TYPES = ["Mixed", "Technical", "Behavioural", "Aptitude"] as const;

/** Before a live session: is the monthly cap (a cost guard, not billing) reached? */
export async function checkLiveCap(): Promise<{ ok: boolean; used: number; max: number | null }> {
  const user = await requireUser();
  const { used, max } = await liveSessionsThisMonth(user.id);
  return { ok: max == null || used < max, used, max };
}

const Save = z.object({
  jobId: z.uuid().nullish(),
  label: z.string().trim().min(1).max(200),
  type: z.enum(TYPES),
  format: z.enum(["voice", "typed", "mcq"]),
  skills: z.array(z.string().max(60)).max(30).default([]),
  startedAt: z.iso.datetime(),
  durationS: z
    .number()
    .int()
    .min(0)
    .max(4 * 3600),
  answers: z.array(z.string().max(10_000)).max(20).default([]),
  transcript: z
    .array(
      z.object({
        role: z.enum(["interviewer", "candidate"]),
        text: z.string().max(10_000),
        at: z.number(),
      }),
    )
    .max(200)
    .default([]),
  speakingSeconds: z
    .number()
    .min(0)
    .max(4 * 3600)
    .optional(),
  sttEngine: z.enum(["webspeech", "whisper", "typed"]).nullish(),
  mcqPicks: z.array(z.number().int().min(0).max(3).nullable()).max(MCQ_BANK.length).optional(),
});

/**
 * Save a finished session with its grade. Voice and typed sessions are graded by the rule-based
 * rubric now; interview.grade (Gemini) rewrites the report when an LLM is configured.
 */
export async function saveInterviewSession(input: z.input<typeof Save>): Promise<string> {
  const user = await requireUser();
  const s = Save.parse(input);
  if (s.format === "voice") {
    const cap = await liveSessionsThisMonth(user.id);
    if (cap.max != null && cap.used >= cap.max)
      throw new Error("You've used this month's live sessions.");
  }
  const type = s.type === "Behavioural" ? "behavioural" : "technical";
  let score: number;
  let rubric = null;
  let report;
  if (s.format === "mcq") {
    const picks = s.mcqPicks ?? [];
    const right = MCQ_BANK.filter((q, i) => picks[i] === q.a).length;
    score = Math.round((100 * right) / MCQ_BANK.length);
    report = {
      summary: `${right} of ${MCQ_BANK.length} correct.`,
      answers: [],
      metrics: { wpm: null, fillers: 0 },
      mcq: { picks },
    };
  } else {
    const questions = interviewQuestions({ skills: s.skills, type: s.type as InterviewType });
    const graded = gradeSession({
      questions,
      answers: s.answers,
      speakingSeconds: s.speakingSeconds,
    });
    score = graded.score;
    rubric = graded.rubric;
    report = { ...graded.report, questions: questions.map((q) => q.q) };
  }
  const db = getDb();
  const [row] = await db
    .insert(schema.interviewSessions)
    .values({
      userId: user.id,
      jobId: s.jobId ?? null,
      label: s.label,
      type,
      format: s.format,
      startedAt: new Date(s.startedAt),
      durationS: s.durationS,
      score,
      rubric,
      transcript: s.transcript,
      sttEngine:
        s.format === "voice" ? (s.sttEngine ?? "webspeech") : s.format === "typed" ? "typed" : null,
      report,
    })
    .returning({ id: schema.interviewSessions.id });
  if (s.format === "voice")
    await db.insert(schema.usageEvents).values({ userId: user.id, kind: "interview_session" });
  if (s.format !== "mcq") {
    await enqueue("interview.grade", { sessionId: row!.id }, { singletonKey: row!.id }).catch(
      (err: unknown) => console.error("[interview] could not queue interview.grade", err),
    );
  }
  revalidatePath("/interview");
  return row!.id;
}
