import "server-only";
import { and, count, desc, eq } from "drizzle-orm";
import { schema } from "@ge/db";
import type { SessionUser } from "./auth";
import { getDb } from "./db";

export interface ChatThreadItem {
  id: string;
  title: string;
  pinned: boolean;
  groupId: string | null;
}
export interface ChatGroupItem {
  id: string;
  name: string;
  colorIndex: number;
}
export interface ShellData {
  user: { id: string; name: string; email: string; image: string | null };
  threads: ChatThreadItem[];
  groups: ChatGroupItem[];
  /** Drafts waiting for approval, shown on the Mailbox nav item. */
  draftCount: number;
  /** A new account whose Job Profile isn't complete yet: navigation is locked. */
  locked: boolean;
}

export async function loadShellData(user: SessionUser): Promise<ShellData> {
  const db = getDb();
  const [threads, groups, [drafts]] = await Promise.all([
    db
      .select({
        id: schema.chatThreads.id,
        title: schema.chatThreads.title,
        pinned: schema.chatThreads.pinned,
        groupId: schema.chatThreads.groupId,
      })
      .from(schema.chatThreads)
      .where(eq(schema.chatThreads.userId, user.id))
      .orderBy(desc(schema.chatThreads.lastMessageAt))
      .limit(100),
    db
      .select({
        id: schema.chatGroups.id,
        name: schema.chatGroups.name,
        colorIndex: schema.chatGroups.colorIndex,
      })
      .from(schema.chatGroups)
      .where(eq(schema.chatGroups.userId, user.id))
      .orderBy(schema.chatGroups.position),
    db
      .select({ n: count() })
      .from(schema.emails)
      .where(and(eq(schema.emails.userId, user.id), eq(schema.emails.status, "draft"))),
  ]);
  return {
    user: { id: user.id, name: user.name, email: user.email, image: user.image ?? null },
    threads,
    groups,
    draftCount: drafts?.n ?? 0,
    locked: user.onboardingStep != null,
  };
}
