import "server-only";
import { and, count, desc, eq, gte } from "drizzle-orm";
import type { RubricScores, SessionReport } from "@ge/core";
import { schema } from "@ge/db";
import { getDb } from "./db";
import { env } from "./env";
import { loadJobCards } from "./jobs";
import { loadProfile } from "./profile";

const { interviewSessions } = schema;

export interface SessionView {
  id: string;
  label: string;
  type: "technical" | "behavioural";
  format: "voice" | "typed" | "mcq";
  startedAt: string;
  durationS: number | null;
  score: number | null;
  rubric: RubricScores | null;
  report: SessionReport | null;
  jobId: string | null;
}

export interface InterviewData {
  sessions: SessionView[];
  /** Company → roles from the user's open jobs, for the setup pickers. */
  jobs: { id: string; title: string; company: string; skills: string[] }[];
  /** Live sessions this month and the cap (null when there's no cap). */
  cap: { used: number; max: number | null };
  /** Skills from the user's profile, for sessions that aren't about one job. */
  profileSkills: string[];
}

const monthStart = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
};

/** The cap applies to live (voice) sessions only; unset means no cap (the self-hosted default). */
export async function liveSessionsThisMonth(userId: string) {
  const [row] = await getDb()
    .select({ n: count() })
    .from(interviewSessions)
    .where(
      and(
        eq(interviewSessions.userId, userId),
        eq(interviewSessions.format, "voice"),
        gte(interviewSessions.startedAt, monthStart()),
      ),
    );
  return { used: row?.n ?? 0, max: env().INTERVIEW_MONTHLY_SESSION_CAP ?? null };
}

export async function loadInterview(userId: string): Promise<InterviewData> {
  const [rows, cards, cap, profile] = await Promise.all([
    getDb()
      .select()
      .from(interviewSessions)
      .where(eq(interviewSessions.userId, userId))
      .orderBy(desc(interviewSessions.startedAt))
      .limit(50),
    loadJobCards(userId, { limit: 100 }),
    liveSessionsThisMonth(userId),
    loadProfile(userId),
  ]);
  return {
    sessions: rows.map((r) => ({
      id: r.id,
      label: r.label,
      type: r.type,
      format: r.format,
      startedAt: r.startedAt.toISOString(),
      durationS: r.durationS,
      score: r.score,
      rubric: r.rubric,
      report: r.report,
      jobId: r.jobId,
    })),
    jobs: cards.map((c) => ({ id: c.id, title: c.title, company: c.company, skills: c.skills })),
    cap,
    profileSkills: profile.doc.skills.flatMap((g) => g.items),
  };
}
