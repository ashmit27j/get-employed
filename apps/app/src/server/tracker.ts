import "server-only";
import { and, asc, desc, eq, inArray, isNull } from "drizzle-orm";
import type { Stage } from "@ge/core";
import type { ApplicationFlag } from "@ge/ui";
import { schema } from "@ge/db";
import { getDb } from "./db";
import { loadJobCards } from "./jobs";

const { applications, applicationEvents, alerts } = schema;

export interface TrackerApp {
  id: string;
  jobId: string | null;
  title: string;
  company: string;
  stage: Stage;
  /** Next step shown under the title ("Round 1 · Sep 29, 11:00"); null after a manual move. */
  note: string | null;
  stageChangedAt: string;
  score: number | null;
  flags: ApplicationFlag[];
}

export interface TrackerAlert {
  id: string;
  action: string;
  dueAt: string | null;
  createdAt: string;
  title: string | null;
  company: string | null;
  jobId: string | null;
}

const FLAG_KINDS: ApplicationFlag[] = ["tailored", "emailed", "opened", "replied"];

export async function loadTracker(
  userId: string,
): Promise<{ apps: TrackerApp[]; alerts: TrackerAlert[] }> {
  const db = getDb();
  const rows = await db
    .select()
    .from(applications)
    .where(eq(applications.userId, userId))
    .orderBy(desc(applications.stageChangedAt), desc(applications.createdAt));
  const ids = rows.map((r) => r.id);
  const jobIds = rows.flatMap((r) => (r.jobId ? [r.jobId] : []));
  const [events, cards, alertRows] = await Promise.all([
    ids.length
      ? db
          .select({ applicationId: applicationEvents.applicationId, kind: applicationEvents.kind })
          .from(applicationEvents)
          .where(inArray(applicationEvents.applicationId, ids))
      : [],
    jobIds.length ? loadJobCards(userId, { ids: jobIds }) : [],
    db
      .select({
        id: alerts.id,
        action: alerts.action,
        dueAt: alerts.dueAt,
        createdAt: alerts.createdAt,
        title: applications.title,
        company: applications.company,
        jobId: applications.jobId,
      })
      .from(alerts)
      .leftJoin(applications, eq(applications.id, alerts.applicationId))
      .where(and(eq(alerts.userId, userId), isNull(alerts.doneAt)))
      .orderBy(asc(alerts.dueAt), asc(alerts.createdAt)),
  ]);
  const score = new Map(cards.map((c) => [c.id, c.score]));
  const flags = new Map<string, Set<ApplicationFlag>>();
  for (const e of events) {
    if (!FLAG_KINDS.includes(e.kind as ApplicationFlag)) continue;
    flags.set(
      e.applicationId,
      (flags.get(e.applicationId) ?? new Set()).add(e.kind as ApplicationFlag),
    );
  }
  return {
    apps: rows.map((r) => ({
      id: r.id,
      jobId: r.jobId,
      title: r.title,
      company: r.company,
      stage: r.stage,
      note: r.note,
      stageChangedAt: r.stageChangedAt.toISOString(),
      score: r.jobId ? (score.get(r.jobId) ?? null) : null,
      flags: FLAG_KINDS.filter((f) => flags.get(r.id)?.has(f)),
    })),
    alerts: alertRows.map((a) => ({
      ...a,
      dueAt: a.dueAt?.toISOString() ?? null,
      createdAt: a.createdAt.toISOString(),
    })),
  };
}
