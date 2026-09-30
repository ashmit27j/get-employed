import "server-only";
import { and, count, eq, gte, isNotNull, isNull } from "drizzle-orm";
import { parseSettings, type UserSettings } from "@ge/core";
import { keyFrom, open } from "@ge/core/secret-box";
import { schema } from "@ge/db";
import { getDb } from "./db";
import { env } from "./env";

const { userSettings, mailboxConnections, savedSearches, resumes, emails, interviewSessions } =
  schema;

export async function loadSettings(userId: string): Promise<UserSettings> {
  const [row] = await getDb().select().from(userSettings).where(eq(userSettings.userId, userId));
  return parseSettings(row);
}

export interface MailboxConnectionInfo {
  id: string;
  kind: "gmail" | "smtp" | "imap";
  address: string;
  status: "connected" | "reconnect" | "error";
  connectedAt: string;
}

export async function loadMailboxConnection(userId: string): Promise<MailboxConnectionInfo | null> {
  const [row] = await getDb()
    .select({
      id: mailboxConnections.id,
      kind: mailboxConnections.kind,
      address: mailboxConnections.address,
      status: mailboxConnections.status,
      createdAt: mailboxConnections.createdAt,
    })
    .from(mailboxConnections)
    .where(eq(mailboxConnections.userId, userId));
  return row ? { ...row, connectedAt: row.createdAt.toISOString() } : null;
}

/** The key for mailbox credentials. Development falls back to one derived from the auth secret. */
export function mailboxKey(): Buffer {
  const e = env();
  return keyFrom(
    e.MAILBOX_ENCRYPTION_KEY,
    e.NODE_ENV === "production" ? undefined : (e.BETTER_AUTH_SECRET ?? "dev-only"),
  );
}

const monthStart = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
};

/** This month's activity for Settings → Usage. Counts only: plan limits aren't built (docs/decisions.md D15). */
export async function loadUsage(userId: string) {
  const db = getDb();
  const since = monthStart();
  const n = async (q: Promise<{ n: number }[]>) => (await q)[0]?.n ?? 0;
  const [searches, tailored, sent, interviews] = await Promise.all([
    n(
      db
        .select({ n: count() })
        .from(savedSearches)
        .where(and(eq(savedSearches.userId, userId), isNull(savedSearches.deletedAt))),
    ),
    n(
      db
        .select({ n: count() })
        .from(resumes)
        .where(
          and(
            eq(resumes.userId, userId),
            eq(resumes.kind, "tailored"),
            gte(resumes.createdAt, since),
          ),
        ),
    ),
    n(
      db
        .select({ n: count() })
        .from(emails)
        .where(and(eq(emails.userId, userId), isNotNull(emails.sentAt), gte(emails.sentAt, since))),
    ),
    n(
      db
        .select({ n: count() })
        .from(interviewSessions)
        .where(and(eq(interviewSessions.userId, userId), gte(interviewSessions.startedAt, since))),
    ),
  ]);
  const next = new Date(since.getFullYear(), since.getMonth() + 1, 1);
  return {
    resets: next.toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
    rows: [
      ["Saved searches", searches],
      ["Tailored resumes", tailored],
      ["Outreach emails", sent],
      ["Mock interviews", interviews],
    ] as [string, number][],
  };
}

export async function hasOwnLlmKey(userId: string): Promise<boolean> {
  const [row] = await getDb()
    .select({ llmKey: userSettings.llmKey })
    .from(userSettings)
    .where(eq(userSettings.userId, userId));
  return !!row?.llmKey;
}

/** The LLM key for this user's AI calls: their own key when saved, else the deployment's. Server only. */
export async function llmKeyFor(userId: string): Promise<string | undefined> {
  const [row] = await getDb()
    .select({ llmKey: userSettings.llmKey })
    .from(userSettings)
    .where(eq(userSettings.userId, userId));
  return row?.llmKey ? open(row.llmKey, mailboxKey()) : env().GOOGLE_GENERATIVE_AI_API_KEY;
}
