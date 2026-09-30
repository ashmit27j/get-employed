import "server-only";
import { and, asc, desc, eq, inArray, isNotNull, isNull } from "drizzle-orm";
import type { EmailAttachment, EmailStatus, InboxKind } from "@ge/core";
import { schema } from "@ge/db";
import { getDb } from "./db";
import { loadJobCards } from "./jobs";

const { emails, contacts, resumes, inboxMessages, mailboxConnections, userSettings } = schema;

export interface OutboxEmail {
  id: string;
  jobId: string | null;
  toName: string;
  toRole: string | null;
  toEmail: string;
  company: string;
  subject: string;
  body: string;
  status: EmailStatus;
  /** Contact-email confidence and how it was found ("Verified by SMTP handshake"). */
  confidence: number | null;
  method: string | null;
  /** The job's match score, shown while the draft waits for review. */
  score: number | null;
  sentAt: string | null;
  openedAt: string | null;
  repliedAt: string | null;
  replyText: string | null;
  error: string | null;
  attachments: EmailAttachment[];
  /** The resume that goes with it: tailored for the job when there is one, else the main resume. */
  resume: { id: string; href: string; tailored: boolean; atsScore: number | null } | null;
}

export interface InboxMessage {
  id: string;
  kind: InboxKind;
  fromName: string;
  fromRole: string | null;
  company: string;
  fromEmail: string;
  subject: string;
  body: string;
  receivedAt: string;
  unread: boolean;
  /** Replies the user sent from the Inbox, oldest first. */
  replies: { id: string; body: string; at: string }[];
}

export interface MailboxData {
  outbox: OutboxEmail[];
  inbox: InboxMessage[];
  /** The connected sending address, or null when no mailbox is connected yet. */
  sender: string | null;
  window: { start: string; end: string };
  library: { id: string; name: string; tailored: boolean }[];
}

export async function loadMailbox(user: { id: string; email: string }): Promise<MailboxData> {
  const db = getDb();
  const [rows, messages, [connection], [settings], resumeRows] = await Promise.all([
    db
      .select({ e: emails, confidence: contacts.confidence, method: contacts.method })
      .from(emails)
      .leftJoin(contacts, eq(contacts.id, emails.contactId))
      .where(and(eq(emails.userId, user.id), isNull(emails.inReplyToId)))
      .orderBy(desc(emails.createdAt)),
    db
      .select()
      .from(inboxMessages)
      .where(and(eq(inboxMessages.userId, user.id), isNull(inboxMessages.archivedAt)))
      .orderBy(desc(inboxMessages.receivedAt)),
    db
      .select({ address: mailboxConnections.address })
      .from(mailboxConnections)
      .where(
        and(eq(mailboxConnections.userId, user.id), eq(mailboxConnections.status, "connected")),
      ),
    db
      .select({ mailbox: userSettings.mailbox })
      .from(userSettings)
      .where(eq(userSettings.userId, user.id)),
    db
      .select({
        id: resumes.id,
        kind: resumes.kind,
        jobId: resumes.jobId,
        name: resumes.name,
        atsScore: resumes.atsScore,
      })
      .from(resumes)
      .where(eq(resumes.userId, user.id))
      .orderBy(asc(resumes.kind), desc(resumes.editedAt)),
  ]);

  const jobIds = [...new Set(rows.flatMap((r) => (r.e.jobId ? [r.e.jobId] : [])))];
  const scores = new Map(
    (jobIds.length ? await loadJobCards(user.id, { ids: jobIds }) : []).map((c) => [c.id, c.score]),
  );
  const main = resumeRows.find((r) => r.kind === "main");
  const tailoredFor = new Map(
    resumeRows.filter((r) => r.kind === "tailored" && r.jobId).map((r) => [r.jobId!, r]),
  );

  const ids = messages.map((m) => m.id);
  const replies = ids.length
    ? await db
        .select({ id: emails.id, body: emails.body, at: emails.approvedAt, to: emails.inReplyToId })
        .from(emails)
        .where(and(inArray(emails.inReplyToId, ids), isNotNull(emails.approvedAt)))
        .orderBy(asc(emails.approvedAt))
    : [];

  const mailbox = (settings?.mailbox ?? {}) as { windowStart?: string; windowEnd?: string };
  return {
    outbox: rows.map(({ e, confidence, method }) => {
      const t = e.jobId ? tailoredFor.get(e.jobId) : undefined;
      const r = t ?? main;
      return {
        id: e.id,
        jobId: e.jobId,
        toName: e.toName,
        toRole: e.toRole,
        toEmail: e.toEmail,
        company: e.company,
        subject: e.subject,
        body: e.body,
        status: e.status,
        confidence,
        method,
        score: e.jobId ? (scores.get(e.jobId) ?? null) : null,
        sentAt: e.sentAt?.toISOString() ?? null,
        openedAt: e.openedAt?.toISOString() ?? null,
        repliedAt: e.repliedAt?.toISOString() ?? null,
        replyText: e.replyText,
        error: e.error,
        attachments: e.attachments,
        resume: r
          ? {
              id: r.id,
              href: t ? `/documents?view=tailor&job=${e.jobId}` : "/documents?view=main",
              tailored: !!t,
              atsScore: r.atsScore,
            }
          : null,
      };
    }),
    inbox: messages.map((m) => ({
      id: m.id,
      kind: m.kind,
      fromName: m.fromName,
      fromRole: m.fromRole,
      company: m.company,
      fromEmail: m.fromEmail,
      subject: m.subject,
      body: m.body,
      receivedAt: m.receivedAt.toISOString(),
      unread: m.readAt == null,
      replies: replies
        .filter((x) => x.to === m.id)
        .map((x) => ({ id: x.id, body: x.body, at: x.at!.toISOString() })),
    })),
    sender: connection?.address ?? null,
    window: { start: mailbox.windowStart ?? "9:00", end: mailbox.windowEnd ?? "18:00" },
    library: resumeRows.map((r) => ({
      id: r.id,
      name: r.kind === "main" ? "Main resume" : r.name,
      tailored: r.kind === "tailored",
    })),
  };
}
