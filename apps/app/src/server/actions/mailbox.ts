"use server";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { outreachDraft, replySubject } from "@ge/core";
import { schema } from "@ge/db";
import { getDb } from "../db";
import { loadJobCard } from "../jobs";
import { enqueue } from "../queue";
import { requireUser } from "../session";

const { emails, contacts, inboxMessages, applications, applicationEvents } = schema;
const Id = z.uuid();
const refresh = () => revalidatePath("/", "layout");

async function ownEmail(userId: string, id: string) {
  const [row] = await getDb()
    .select()
    .from(emails)
    .where(and(eq(emails.id, Id.parse(id)), eq(emails.userId, userId)));
  if (!row) throw new Error("Email not found");
  return row;
}

async function logEvent(
  userId: string,
  jobId: string | null,
  kind: "emailed" | "opened" | "replied",
) {
  if (!jobId) return;
  const db = getDb();
  const [app] = await db
    .select({ id: applications.id })
    .from(applications)
    .where(and(eq(applications.userId, userId), eq(applications.jobId, jobId)));
  if (app) await db.insert(applicationEvents).values({ applicationId: app.id, kind });
}

/** Edit a draft's subject and body. Only drafts can change. */
export async function updateDraft(id: string, patch: { subject?: string; body?: string }) {
  const user = await requireUser();
  const row = await ownEmail(user.id, id);
  if (row.status !== "draft") throw new Error("Only drafts can be edited");
  await getDb()
    .update(emails)
    .set({
      ...(patch.subject != null && { subject: z.string().max(300).parse(patch.subject) }),
      ...(patch.body != null && { body: z.string().max(20_000).parse(patch.body) }),
    })
    .where(eq(emails.id, row.id));
}

export async function setAttachments(id: string, attachments: unknown) {
  const user = await requireUser();
  const row = await ownEmail(user.id, id);
  if (row.status !== "draft") throw new Error("Only drafts can be edited");
  const list = z
    .array(
      z.object({
        name: z.string().max(200),
        resumeId: Id.optional(),
        key: z.string().max(300).optional(),
      }),
    )
    .max(10)
    .parse(attachments)
    .filter((a) => !a.key || a.key.startsWith(`users/${user.id}/`));
  await getDb().update(emails).set({ attachments: list }).where(eq(emails.id, row.id));
}

/**
 * The explicit approval step (docs/email-and-google.md): sets approved_at and queues the send.
 * Nothing else in the app moves an email past "draft".
 */
export async function approveEmails(ids: string[]) {
  const user = await requireUser();
  const list = z.array(Id).min(1).max(100).parse(ids);
  const approved = await getDb()
    .update(emails)
    .set({ status: "approved", approvedAt: new Date() })
    .where(and(eq(emails.userId, user.id), eq(emails.status, "draft"), inArray(emails.id, list)))
    .returning({ id: emails.id });
  for (const e of approved) await enqueue("email.send", { emailId: e.id }, { singletonKey: e.id });
  refresh();
  return approved.map((e) => e.id);
}

export async function discardDraft(id: string) {
  const user = await requireUser();
  const row = await ownEmail(user.id, id);
  if (row.status !== "draft") throw new Error("Only drafts can be discarded");
  await getDb().delete(emails).where(eq(emails.id, row.id));
  refresh();
}

/** "Regenerate": the worker rewrites the draft (Gemini) and keeps it as a draft. */
export async function regenerateDraft(id: string) {
  const user = await requireUser();
  const row = await ownEmail(user.id, id);
  if (row.status !== "draft") throw new Error("Only drafts can be regenerated");
  await enqueue("email.draft", { emailId: row.id, regenerate: true }, { singletonKey: row.id });
}

/** Without inbox access, the user tells us about a reply (optionally pasting it). */
export async function markReplied(id: string, replyText?: string) {
  const user = await requireUser();
  const row = await ownEmail(user.id, id);
  if (!["sent", "opened"].includes(row.status))
    throw new Error("Only sent emails can be marked replied");
  const text = replyText?.trim() ? z.string().max(20_000).parse(replyText.trim()) : null;
  const db = getDb();
  await db
    .update(emails)
    .set({ status: "replied", repliedAt: new Date(), replyText: text })
    .where(eq(emails.id, row.id));
  if (text) {
    await db.insert(inboxMessages).values({
      userId: user.id,
      emailId: row.id,
      kind: "reply",
      fromName: row.toName,
      fromRole: row.toRole,
      company: row.company,
      fromEmail: row.toEmail,
      subject: replySubject(row.subject),
      body: text,
      source: "manual",
      readAt: new Date(),
    });
  }
  await logEvent(user.id, row.jobId, "replied");
  refresh();
}

export async function markBounced(id: string) {
  const user = await requireUser();
  const row = await ownEmail(user.id, id);
  if (!["sent", "opened"].includes(row.status))
    throw new Error("Only sent emails can be marked bounced");
  await getDb()
    .update(emails)
    .set({ status: "bounced", error: "Marked as bounced" })
    .where(eq(emails.id, row.id));
  refresh();
}

/**
 * "Reach out" / "Draft outreach email" on a job: the job's open draft, or a new one to its
 * contact (rule-based text now, rewritten by email.draft when an LLM is configured).
 */
export async function draftForJob(jobId: string): Promise<string | null> {
  const user = await requireUser();
  const job = await loadJobCard(user.id, Id.parse(jobId));
  if (!job) return null;
  const db = getDb();
  const [existing] = await db
    .select({ id: emails.id })
    .from(emails)
    .where(
      and(
        eq(emails.userId, user.id),
        eq(emails.jobId, job.id),
        eq(emails.status, "draft"),
        isNull(emails.inReplyToId),
      ),
    );
  if (existing) return existing.id;
  const [contact] = await db
    .select()
    .from(contacts)
    .where(and(eq(contacts.jobId, job.id), eq(contacts.status, "found")));
  if (!contact?.email || !contact.name) {
    await enqueue(
      "contact.find",
      { userId: user.id, jobId: job.id },
      { singletonKey: `contact:${job.id}` },
    );
    return null;
  }
  const draft = outreachDraft({
    toName: contact.name,
    jobTitle: job.title,
    company: job.company,
    senderName: user.name,
    highlight: job.reason,
  });
  const [row] = await db
    .insert(emails)
    .values({
      userId: user.id,
      jobId: job.id,
      contactId: contact.id,
      company: job.company,
      toName: contact.name,
      toRole: contact.role,
      toEmail: contact.email,
      subject: draft.subject,
      body: draft.body,
    })
    .returning({ id: emails.id });
  await enqueue("email.draft", { emailId: row!.id }, { singletonKey: row!.id });
  refresh();
  return row!.id;
}

/* ---------- Inbox ---------- */

export async function markMessagesRead(ids: string[] | "all") {
  const user = await requireUser();
  const where =
    ids === "all"
      ? and(eq(inboxMessages.userId, user.id), isNull(inboxMessages.readAt))
      : and(eq(inboxMessages.userId, user.id), inArray(inboxMessages.id, z.array(Id).parse(ids)));
  await getDb().update(inboxMessages).set({ readAt: new Date() }).where(where);
}

export async function archiveMessage(id: string) {
  const user = await requireUser();
  await getDb()
    .update(inboxMessages)
    .set({ archivedAt: new Date() })
    .where(and(eq(inboxMessages.id, Id.parse(id)), eq(inboxMessages.userId, user.id)));
  refresh();
}

/** "Send reply": the click is the approval, so the reply is approved and queued at once. */
export async function sendReply(messageId: string, body: string) {
  const user = await requireUser();
  const text = z.string().trim().min(1).max(20_000).parse(body);
  const db = getDb();
  const [m] = await db
    .select()
    .from(inboxMessages)
    .where(and(eq(inboxMessages.id, Id.parse(messageId)), eq(inboxMessages.userId, user.id)));
  if (!m) throw new Error("Message not found");
  const [original] = m.emailId
    ? await db
        .select({ jobId: emails.jobId, contactId: emails.contactId })
        .from(emails)
        .where(eq(emails.id, m.emailId))
    : [];
  const [row] = await db
    .insert(emails)
    .values({
      userId: user.id,
      jobId: original?.jobId ?? null,
      contactId: original?.contactId ?? null,
      company: m.company,
      toName: m.fromName,
      toRole: m.fromRole,
      toEmail: m.fromEmail,
      subject: replySubject(m.subject),
      body: text,
      status: "approved",
      approvedAt: new Date(),
      inReplyToId: m.id,
    })
    .returning({ id: emails.id });
  await enqueue("email.send", { emailId: row!.id }, { singletonKey: row!.id });
  refresh();
  return { id: row!.id, at: new Date().toISOString() };
}
