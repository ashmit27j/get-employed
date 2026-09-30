"use server";
import { and, count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { schema } from "@ge/db";
import { getDb } from "../db";
import { latestThreadId, loadThread } from "../assistant/threads";
import { requireUser } from "../session";

/** Chat thread and group management from the sidebar (pin, rename, move, delete, new group). */

const Id = z.string().uuid();
const Title = z.string().trim().min(1).max(120);

async function ownThread(userId: string, threadId: string) {
  const [row] = await getDb()
    .select({ id: schema.chatThreads.id, pinned: schema.chatThreads.pinned })
    .from(schema.chatThreads)
    .where(and(eq(schema.chatThreads.id, threadId), eq(schema.chatThreads.userId, userId)));
  if (!row) throw new Error("Chat not found");
  return row;
}

const done = () => revalidatePath("/", "layout");

export async function togglePinThread(threadId: string) {
  const user = await requireUser();
  const t = await ownThread(user.id, Id.parse(threadId));
  await getDb()
    .update(schema.chatThreads)
    .set({ pinned: !t.pinned })
    .where(eq(schema.chatThreads.id, t.id));
  done();
}

export async function renameThread(threadId: string, title: string) {
  const user = await requireUser();
  const t = await ownThread(user.id, Id.parse(threadId));
  await getDb()
    .update(schema.chatThreads)
    .set({ title: Title.parse(title) })
    .where(eq(schema.chatThreads.id, t.id));
  done();
}

export async function deleteThread(threadId: string) {
  const user = await requireUser();
  const t = await ownThread(user.id, Id.parse(threadId));
  await getDb().delete(schema.chatThreads).where(eq(schema.chatThreads.id, t.id));
  done();
}

/** Move a chat into a group, or out of all groups with `null`. */
export async function moveThread(threadId: string, groupId: string | null) {
  const user = await requireUser();
  const t = await ownThread(user.id, Id.parse(threadId));
  if (groupId) {
    const [g] = await getDb()
      .select({ id: schema.chatGroups.id })
      .from(schema.chatGroups)
      .where(
        and(eq(schema.chatGroups.id, Id.parse(groupId)), eq(schema.chatGroups.userId, user.id)),
      );
    if (!g) throw new Error("Group not found");
  }
  await getDb().update(schema.chatThreads).set({ groupId }).where(eq(schema.chatThreads.id, t.id));
  done();
}

/** Creates a group (colour cycles through the palette) and optionally moves a chat into it. */
export async function createGroup(name: string, threadId?: string) {
  const user = await requireUser();
  const db = getDb();
  const [{ n } = { n: 0 }] = await db
    .select({ n: count() })
    .from(schema.chatGroups)
    .where(eq(schema.chatGroups.userId, user.id));
  const [group] = await db
    .insert(schema.chatGroups)
    .values({ userId: user.id, name: Title.parse(name), colorIndex: n % 6, position: n })
    .returning({ id: schema.chatGroups.id });
  if (threadId && group) {
    const t = await ownThread(user.id, Id.parse(threadId));
    await db
      .update(schema.chatThreads)
      .set({ groupId: group.id })
      .where(eq(schema.chatThreads.id, t.id));
  }
  done();
  return group?.id;
}

/** The dock's conversation: the given chat, or the most recent one. */
export async function getChatThread(threadId?: string | null) {
  const user = await requireUser();
  const id = threadId ? Id.parse(threadId) : await latestThreadId(user.id);
  return id ? loadThread(user.id, id) : null;
}
