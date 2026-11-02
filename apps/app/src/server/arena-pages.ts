import "server-only";
import { cache } from "react";
import {
  ARENA_IDS,
  ARENAS,
  type ArenaId,
  type ArenaMcqSet,
  type ArenaMcqSetSummary,
  type ArenaProblem,
  type ArenaProblemSummary,
  type ArenaProgress,
} from "@ge/core";
import { arenaLoad, isArenaSlug, type ArenaResult } from "./arena";

export interface ArenaHubCard {
  id: ArenaId;
  total: number;
  done: number;
}

export interface ArenaHub {
  cards: ArenaHubCard[];
  recent: { slug: string; title: string; arena: ArenaId; solvedAt: string }[];
}

export async function loadArenaHub(userId: string): Promise<ArenaResult<ArenaHub>> {
  const progress = await arenaLoad<ArenaProgress>(userId, "/me/progress");
  if (!progress.ok) return progress;
  const lists = await Promise.all(
    ARENA_IDS.map((id) =>
      ARENAS[id].kind === "judged"
        ? arenaLoad<{ problems: ArenaProblemSummary[] }>(userId, `/problems?arena=${id}`)
        : arenaLoad<{ sets: ArenaMcqSetSummary[] }>(userId, `/mcq?arena=${id}`),
    ),
  );
  const attempted = new Set(progress.data.mcq.map((m) => m.setId));
  const titles = new Map<string, { title: string; arena: ArenaId }>();
  const cards = ARENA_IDS.map((id, i) => {
    const r = lists[i]!;
    if (!r.ok) return { id, total: 0, done: 0 };
    if ("problems" in r.data) {
      for (const p of r.data.problems) titles.set(p.slug, { title: p.title, arena: id });
      return {
        id,
        total: r.data.problems.length,
        done: r.data.problems.filter((p) => p.solved).length,
      };
    }
    const sets = (r.data as { sets: ArenaMcqSetSummary[] }).sets;
    return { id, total: sets.length, done: sets.filter((s) => attempted.has(s.setId)).length };
  });
  const recent = [...progress.data.solved]
    .sort((a, b) => b.solvedAt.localeCompare(a.solvedAt))
    .flatMap((s) => {
      const t = titles.get(s.slug);
      return t ? [{ slug: s.slug, title: t.title, arena: t.arena, solvedAt: s.solvedAt }] : [];
    })
    .slice(0, 5);
  return { ok: true, data: { cards, recent } };
}

export async function loadProblemList(userId: string, arena: ArenaId) {
  return arenaLoad<{ problems: ArenaProblemSummary[] }>(userId, `/problems?arena=${arena}`);
}

export async function loadMcqList(userId: string, arena: ArenaId) {
  const [sets, progress] = await Promise.all([
    arenaLoad<{ sets: ArenaMcqSetSummary[] }>(userId, `/mcq?arena=${arena}`),
    arenaLoad<ArenaProgress>(userId, "/me/progress"),
  ]);
  if (!sets.ok) return sets;
  return {
    ok: true as const,
    data: { sets: sets.data.sets, best: progress.ok ? progress.data.mcq : [] },
  };
}

/** Cached per request, so generateMetadata and the page share one call. */
export const loadProblem = cache(async function loadProblem(
  userId: string,
  slug: string,
): Promise<ArenaResult<{ problem: ArenaProblem }> | null> {
  if (!isArenaSlug(slug)) return null;
  return arenaLoad<{ problem: ArenaProblem }>(userId, `/problems/${slug}`);
});

export const loadMcqSet = cache(async function loadMcqSet(
  userId: string,
  setId: string,
): Promise<ArenaResult<{ set: ArenaMcqSet; best?: ArenaProgress["mcq"][number] }> | null> {
  if (!isArenaSlug(setId)) return null;
  const [set, progress] = await Promise.all([
    arenaLoad<{ set: ArenaMcqSet }>(userId, `/mcq/${setId}`),
    arenaLoad<ArenaProgress>(userId, "/me/progress"),
  ]);
  if (!set.ok) return set;
  const best = progress.ok ? progress.data.mcq.find((m) => m.setId === setId) : undefined;
  return { ok: true, data: { set: set.data.set, best } };
});
