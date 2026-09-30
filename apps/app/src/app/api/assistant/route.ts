import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { schema } from "@ge/db";
import { respond } from "@/server/assistant/router";
import { toChatJob } from "@/server/assistant/threads";
import { getDb } from "@/server/db";
import { loadJobCards } from "@/server/jobs";
import { getSession } from "@/server/session";

export const dynamic = "force-dynamic";

const Body = z.object({ threadId: z.uuid().nullish(), text: z.string().trim().min(1).max(3000) });

/** Thread titles: the first message, cut at a word near 42 characters. */
function titleFor(text: string) {
  if (text.length <= 42) return text;
  const cut = text.slice(0, 40);
  return `${cut.slice(0, cut.lastIndexOf(" ") > 20 ? cut.lastIndexOf(" ") : 40).trim()}…`;
}

/**
 * One assistant turn, streamed as newline-delimited JSON events:
 * {type:"thread",id,title} → {type:"text",text} → {type:"actions",actions} → {type:"jobs",jobs} → {type:"done",id}.
 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Sign in first." }, { status: 401 });
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Write a message first." }, { status: 400 });
  const { text } = parsed.data;
  const userId = session.user.id;
  const db = getDb();
  const { chatThreads, chatMessages } = schema;

  let threadId = parsed.data.threadId ?? null;
  let title = "";
  if (threadId) {
    const [t] = await db
      .select({ id: chatThreads.id, title: chatThreads.title })
      .from(chatThreads)
      .where(and(eq(chatThreads.id, threadId), eq(chatThreads.userId, userId)));
    if (!t) return Response.json({ error: "Chat not found." }, { status: 404 });
    title = t.title;
  } else {
    title = titleFor(text);
    const [t] = await db
      .insert(chatThreads)
      .values({ userId, title })
      .returning({ id: chatThreads.id });
    threadId = t!.id;
  }
  const [previous] = await db
    .select({ jobIds: chatMessages.jobIds })
    .from(chatMessages)
    .where(and(eq(chatMessages.threadId, threadId), eq(chatMessages.role, "assistant")))
    .orderBy(desc(chatMessages.createdAt))
    .limit(1);
  await db.insert(chatMessages).values({ threadId, role: "user", text });

  const encoder = new TextEncoder();
  const id = threadId;
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: object) =>
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      send({ type: "thread", id, title });
      try {
        const reply = await respond(userId, text, previous?.jobIds ?? []);
        send({ type: "text", text: reply.text });
        if (reply.actions.length) send({ type: "actions", actions: reply.actions });
        const jobs = reply.jobIds.length
          ? (await loadJobCards(userId, { ids: reply.jobIds })).map(toChatJob)
          : [];
        // Keep the reply's order (loadJobCards sorts by score).
        if (jobs.length)
          send({
            type: "jobs",
            jobs: reply.jobIds.flatMap((j) => jobs.find((x) => x.id === j) ?? []),
          });
        const [msg] = await db
          .insert(chatMessages)
          .values({
            threadId: id,
            role: "assistant",
            text: reply.text,
            actions: reply.actions,
            jobIds: reply.jobIds,
          })
          .returning({ id: chatMessages.id });
        await db
          .update(chatThreads)
          .set({ lastMessageAt: new Date() })
          .where(eq(chatThreads.id, id));
        revalidatePath("/", "layout");
        send({ type: "done", id: msg!.id });
      } catch (err) {
        console.error("[assistant]", err);
        send({ type: "error", message: "Something went wrong on our side. Try again." });
      }
      controller.close();
    },
  });
  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson", "Cache-Control": "no-store" },
  });
}
