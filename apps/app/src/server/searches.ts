import "server-only";
import { and, desc, eq, isNull } from "drizzle-orm";
import type { Chip, JobCard, SearchFrequency, SearchNotify, SearchRunOn } from "@ge/core";
import { schema } from "@ge/db";
import { getDb } from "./db";
import { loadJobCards } from "./jobs";

export interface SavedSearchItem {
  id: string;
  query: string;
  chips: Chip[];
  frequency: SearchFrequency;
  runOn: SearchRunOn;
  notify: SearchNotify;
  active: boolean;
  newCount: number;
  lastRunAt: string | null;
}

const { savedSearches, savedSearchResults } = schema;

const toItem = (r: typeof savedSearches.$inferSelect): SavedSearchItem => ({
  id: r.id,
  query: r.query,
  chips: r.filters,
  frequency: r.frequency,
  runOn: r.runOn,
  notify: r.notify,
  active: r.active,
  newCount: r.newCount,
  lastRunAt: r.lastRunAt?.toISOString() ?? null,
});

export async function loadSavedSearches(userId: string): Promise<SavedSearchItem[]> {
  const rows = await getDb()
    .select()
    .from(savedSearches)
    .where(and(eq(savedSearches.userId, userId), isNull(savedSearches.deletedAt)))
    .orderBy(desc(savedSearches.createdAt));
  return rows.map(toItem);
}

export async function loadSavedSearch(userId: string, id: string): Promise<SavedSearchItem | null> {
  const [row] = await getDb()
    .select()
    .from(savedSearches)
    .where(
      and(
        eq(savedSearches.id, id),
        eq(savedSearches.userId, userId),
        isNull(savedSearches.deletedAt),
      ),
    );
  return row ? toItem(row) : null;
}

/** A saved search's matches, newest first, flagged when the user hasn't seen them yet. */
export async function loadSavedSearchMatches(
  userId: string,
  searchId: string,
): Promise<(JobCard & { isNew: boolean })[]> {
  const rows = await getDb()
    .select({ jobId: savedSearchResults.jobId, seen: savedSearchResults.seen })
    .from(savedSearchResults)
    .where(eq(savedSearchResults.savedSearchId, searchId))
    .orderBy(desc(savedSearchResults.firstSeenAt));
  if (rows.length === 0) return [];
  const cards = new Map(
    (await loadJobCards(userId, { ids: rows.map((r) => r.jobId) })).map((c) => [c.id, c]),
  );
  return rows.flatMap((r) => {
    const card = cards.get(r.jobId);
    return card ? [{ ...card, isNew: !r.seen }] : [];
  });
}
