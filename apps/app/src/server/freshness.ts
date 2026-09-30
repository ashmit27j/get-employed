import "server-only";
import { and, eq, isNull, sql } from "drizzle-orm";
import { schema } from "@ge/db";
import { getDb } from "./db";
import { env } from "./env";
import { enqueue } from "./queue";

const { jobs, jobSources, jobMatches, profiles } = schema;

/**
 * Called when the job board opens. Queues a board refresh when the sources are stale, else scoring
 * for open jobs the user has no match for yet. Never blocks or fails the page.
 */
export async function keepFeedFresh(userId: string): Promise<void> {
  try {
    const db = getDb();
    const [src] = await db
      .select({ last: sql<Date | null>`max(${jobSources.lastRunAt})` })
      .from(jobSources);
    const staleMs = env().SEARCH_FRESHNESS_MINUTES * 60_000;
    if (!src?.last || Date.now() - new Date(src.last).getTime() > staleMs) {
      await enqueue("ingest.search", { userId }, { singletonKey: "ingest:boards" });
      return;
    }
    const [unscored] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(jobs)
      .leftJoin(profiles, eq(profiles.userId, userId))
      .leftJoin(
        jobMatches,
        and(
          eq(jobMatches.jobId, jobs.id),
          eq(jobMatches.userId, userId),
          eq(jobMatches.profileVersion, profiles.version),
        ),
      )
      .where(and(isNull(jobs.closedAt), isNull(jobMatches.id)));
    if ((unscored?.n ?? 0) > 0)
      await enqueue("match.compute", { userId }, { singletonKey: `match:${userId}` });
  } catch (err) {
    console.error("[feed] could not check freshness", err);
  }
}
