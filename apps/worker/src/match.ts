import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { matchReason } from "@ge/ai";
import { ProfileSchema, matchScore } from "@ge/core";
import { schema } from "@ge/db";
import type { Ctx } from "./ctx";

const { jobs, companies, jobMatches, profiles, users } = schema;

/** The LLM writes reasons for the best matches only; the rest keep the rule-based sentence. */
const LLM_REASONS_PER_RUN = 12;

/**
 * match.compute: score every open job against the user's current profile version and store the
 * score, reason and missing skills (job_matches). Jobs already scored at this version are skipped.
 */
export async function computeMatches(ctx: Ctx, data: unknown) {
  const { userId } = z.object({ userId: z.string() }).parse(data);
  const [p] = await ctx.db.select().from(profiles).where(eq(profiles.userId, userId));
  const [u] = await ctx.db
    .select({
      level: users.experienceLevel,
      locations: users.preferredLocations,
      role: users.targetRole,
    })
    .from(users)
    .where(eq(users.id, userId));
  if (!p || !u) return;
  const profile = ProfileSchema.parse(p.doc);

  const done = new Set(
    (
      await ctx.db
        .select({ jobId: jobMatches.jobId })
        .from(jobMatches)
        .where(and(eq(jobMatches.userId, userId), eq(jobMatches.profileVersion, p.version)))
    ).map((r) => r.jobId),
  );
  const open = await ctx.db
    .select({
      id: jobs.id,
      title: jobs.title,
      company: companies.name,
      skills: jobs.skills,
      experience: jobs.experience,
      location: jobs.location,
      mode: jobs.mode,
      description: jobs.description,
    })
    .from(jobs)
    .innerJoin(companies, eq(companies.id, jobs.companyId))
    .where(isNull(jobs.closedAt));
  const todo = open.filter((j) => !done.has(j.id));
  if (!todo.length) return;

  const scored = todo
    .map((job) => ({
      job,
      ...matchScore({
        profile,
        job,
        experienceLevel: u.level,
        preferredLocations: u.locations ?? [],
        targetRole: u.role,
      }),
    }))
    .sort((a, b) => b.score - a.score);

  const model = await ctx.llm(userId);
  let llmCalls = 0;
  for (const s of scored) {
    let reason = s.reason;
    if (model && llmCalls < LLM_REASONS_PER_RUN && s.score >= 60) {
      llmCalls++;
      try {
        reason = await matchReason(model, {
          profile,
          job: s.job,
          score: s.score,
          missing: s.missing,
        });
      } catch (err) {
        ctx.log("matchReason failed", err instanceof Error ? err.message : err);
      }
    }
    await ctx.db
      .insert(jobMatches)
      .values({
        userId,
        jobId: s.job.id,
        profileVersion: p.version,
        score: s.score,
        reason,
        missing: s.missing,
      })
      .onConflictDoUpdate({
        target: [jobMatches.userId, jobMatches.jobId, jobMatches.profileVersion],
        set: { score: s.score, reason, missing: s.missing, updatedAt: new Date() },
      });
  }
  ctx.log(`match.compute ${userId}: scored ${scored.length} jobs (${llmCalls} AI reasons)`);
}
