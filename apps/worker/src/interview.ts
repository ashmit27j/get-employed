import { eq } from "drizzle-orm";
import { z } from "zod";
import { gradeInterview } from "@ge/ai";
import type { SessionReport } from "@ge/core";
import { schema } from "@ge/db";
import type { Ctx } from "./ctx";

const { interviewSessions } = schema;

/**
 * interview.grade: Gemini re-grades a finished voice or typed session (docs/interviews.md). The
 * rule-based grade saved by the app stays when no LLM is configured or the call fails.
 */
export async function gradeSessionJob(ctx: Ctx, data: unknown) {
  const { sessionId } = z.object({ sessionId: z.string().uuid() }).parse(data);
  const [s] = await ctx.db
    .select()
    .from(interviewSessions)
    .where(eq(interviewSessions.id, sessionId));
  if (!s || s.format === "mcq" || !s.report) return;
  const report = s.report as SessionReport;
  if (report.gradedBy === "ai" || !report.qa?.length) return;
  const model = await ctx.llm(s.userId, "interview");
  if (!model) return;
  const strictness = report.strictness ?? "Standard";
  let graded;
  try {
    graded = await gradeInterview(model, { role: s.label, strictness, qa: report.qa });
  } catch (err) {
    ctx.log(
      "interview.grade: LLM failed, keeping the rule-based grade",
      err instanceof Error ? err.message : err,
    );
    return;
  }
  const r = graded.rubric;
  const score = Math.round((r.communication + r.technical + r.structure + r.confidence) / 4);
  await ctx.db
    .update(interviewSessions)
    .set({
      score,
      rubric: r,
      // Delivery metrics (pace, filler words) are measured, not judged: keep them.
      report: { ...report, summary: graded.summary, answers: graded.answers, gradedBy: "ai" },
      updatedAt: new Date(),
    })
    .where(eq(interviewSessions.id, s.id));
  ctx.log(`interview.grade ${s.id}: ${score}`);
}
