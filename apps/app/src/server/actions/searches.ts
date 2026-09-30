"use server";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { SEARCH_FREQUENCIES, SEARCH_NOTIFY, SEARCH_RUN_ON, SearchFiltersSchema } from "@ge/core";
import { schema } from "@ge/db";
import { getDb } from "../db";
import { enqueue } from "../queue";
import { requireUser } from "../session";

const { savedSearches } = schema;
const Id = z.string().uuid();
const Query = z.string().trim().min(1).max(3000);

async function own(userId: string, id: string) {
  const [row] = await getDb()
    .select({ id: savedSearches.id })
    .from(savedSearches)
    .where(and(eq(savedSearches.id, Id.parse(id)), eq(savedSearches.userId, userId)));
  if (!row) throw new Error("Search not found");
  return row.id;
}

const refresh = () => {
  revalidatePath("/jobs");
  revalidatePath("/jobs/searches/[id]", "page");
};

/** Save a Deep Search: stores the query and its filter chips, then queues a first run. */
export async function createSavedSearch(input: {
  query: string;
  chips: unknown;
  frequency: string;
  /** "Draft outreach for matches above 85" (stored in user_settings.ai.autoDraft, also on Settings → AI & privacy). */
  autoDraft?: boolean;
}) {
  const user = await requireUser();
  if (input.autoDraft != null) {
    await getDb()
      .insert(schema.userSettings)
      .values({ userId: user.id, ai: { autoDraft: z.boolean().parse(input.autoDraft) } })
      .onConflictDoUpdate({
        target: schema.userSettings.userId,
        set: {
          ai: sql`${schema.userSettings.ai} || ${JSON.stringify({ autoDraft: input.autoDraft })}::jsonb`,
        },
      });
  }
  const [row] = await getDb()
    .insert(savedSearches)
    .values({
      userId: user.id,
      query: Query.parse(input.query),
      filters: SearchFiltersSchema.parse(input.chips),
      frequency: z.enum(SEARCH_FREQUENCIES).parse(input.frequency),
      active: true,
    })
    .returning({ id: savedSearches.id });
  await enqueue(
    "ingest.search",
    { userId: user.id, savedSearchId: row!.id },
    { singletonKey: row!.id },
  );
  refresh();
  return row!.id;
}

export async function updateSavedSearch(
  id: string,
  patch: {
    query?: string;
    chips?: unknown;
    frequency?: string;
    active?: boolean;
    runOn?: string;
    notify?: string;
  },
) {
  const user = await requireUser();
  const sid = await own(user.id, id);
  await getDb()
    .update(savedSearches)
    .set({
      ...(patch.query != null && { query: Query.parse(patch.query) }),
      ...(patch.chips != null && { filters: SearchFiltersSchema.parse(patch.chips) }),
      ...(patch.frequency != null && {
        frequency: z.enum(SEARCH_FREQUENCIES).parse(patch.frequency),
      }),
      ...(patch.active != null && { active: z.boolean().parse(patch.active) }),
      ...(patch.runOn != null && { runOn: z.enum(SEARCH_RUN_ON).parse(patch.runOn) }),
      ...(patch.notify != null && { notify: z.enum(SEARCH_NOTIFY).parse(patch.notify) }),
    })
    .where(eq(savedSearches.id, sid));
  refresh();
}

/** Soft delete so the page can offer Undo. */
export async function deleteSavedSearch(id: string) {
  const user = await requireUser();
  const sid = await own(user.id, id);
  await getDb()
    .update(savedSearches)
    .set({ deletedAt: new Date() })
    .where(eq(savedSearches.id, sid));
  refresh();
}

export async function restoreSavedSearch(id: string) {
  const user = await requireUser();
  const sid = await own(user.id, id);
  await getDb().update(savedSearches).set({ deletedAt: null }).where(eq(savedSearches.id, sid));
  refresh();
}

/** "Check now": queue an immediate run. */
export async function runSavedSearch(id: string) {
  const user = await requireUser();
  const sid = await own(user.id, id);
  await enqueue("ingest.search", { userId: user.id, savedSearchId: sid }, { singletonKey: sid });
}
