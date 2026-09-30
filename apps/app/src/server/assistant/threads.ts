import "server-only";
import { and, asc, desc, eq } from "drizzle-orm";
import type { ChatAction, JobCard } from "@ge/core";
import { schema } from "@ge/db";
import { getDb } from "../db";
import { loadJobCards } from "../jobs";

const { chatThreads, chatMessages } = schema;

/** A job as a reply lists it. */
export type ChatJob = Pick<JobCard, "id" | "title" | "company" | "score" | "reason" | "salary">;

export interface ChatMessageView {
  id: string;
  role: "user" | "assistant";
  text: string;
  actions: ChatAction[];
  jobs: ChatJob[];
  at: string;
}

export const toChatJob = (c: JobCard): ChatJob => ({
  id: c.id,
  title: c.title,
  company: c.company,
  score: c.score,
  reason: c.reason,
  salary: c.salary,
});

export async function loadThread(
  userId: string,
  threadId: string,
): Promise<{ id: string; title: string; messages: ChatMessageView[] } | null> {
  const db = getDb();
  const [thread] = await db
    .select({ id: chatThreads.id, title: chatThreads.title })
    .from(chatThreads)
    .where(and(eq(chatThreads.id, threadId), eq(chatThreads.userId, userId)));
  if (!thread) return null;
  const rows = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.threadId, thread.id))
    .orderBy(asc(chatMessages.createdAt));
  const ids = [...new Set(rows.flatMap((r) => r.jobIds))];
  const cards = new Map(
    (ids.length ? await loadJobCards(userId, { ids }) : []).map((c) => [c.id, toChatJob(c)]),
  );
  return {
    ...thread,
    messages: rows.map((r) => ({
      id: r.id,
      role: r.role,
      text: r.text,
      actions: r.actions,
      jobs: r.jobIds.flatMap((id) => cards.get(id) ?? []),
      at: r.createdAt.toISOString(),
    })),
  };
}

/** The dock opens the most recent chat. */
export async function latestThreadId(userId: string): Promise<string | null> {
  const [t] = await getDb()
    .select({ id: chatThreads.id })
    .from(chatThreads)
    .where(eq(chatThreads.userId, userId))
    .orderBy(desc(chatThreads.lastMessageAt))
    .limit(1);
  return t?.id ?? null;
}
