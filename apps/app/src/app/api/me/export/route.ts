import { eq, inArray } from "drizzle-orm";
import { schema } from "@ge/db";
import { getDb } from "@/server/db";
import { getSession } from "@/server/session";

export const dynamic = "force-dynamic";

/**
 * Account → Export data: everything the user created, as one JSON file. Secrets (password hashes,
 * OAuth tokens, mailbox credentials) are left out.
 */
export async function GET() {
  const session = await getSession();
  if (!session) return new Response(null, { status: 401 });
  const userId = session.user.id;
  const db = getDb();
  const s = schema;
  const [
    user,
    profile,
    settings,
    resumes,
    applications,
    alerts,
    emails,
    inbox,
    searches,
    linked,
    interviews,
    threads,
  ] = await Promise.all([
    db
      .select({
        name: s.users.name,
        email: s.users.email,
        username: s.users.username,
        createdAt: s.users.createdAt,
      })
      .from(s.users)
      .where(eq(s.users.id, userId)),
    db
      .select({ doc: s.profiles.doc, details: s.profiles.details })
      .from(s.profiles)
      .where(eq(s.profiles.userId, userId)),
    db
      .select({
        general: s.userSettings.general,
        mailbox: s.userSettings.mailbox,
        ai: s.userSettings.ai,
      })
      .from(s.userSettings)
      .where(eq(s.userSettings.userId, userId)),
    db.select().from(s.resumes).where(eq(s.resumes.userId, userId)),
    db.select().from(s.applications).where(eq(s.applications.userId, userId)),
    db.select().from(s.alerts).where(eq(s.alerts.userId, userId)),
    db.select().from(s.emails).where(eq(s.emails.userId, userId)),
    db.select().from(s.inboxMessages).where(eq(s.inboxMessages.userId, userId)),
    db.select().from(s.savedSearches).where(eq(s.savedSearches.userId, userId)),
    db
      .select({
        kind: s.linkedProfiles.kind,
        snapshot: s.linkedProfiles.snapshot,
        suggestions: s.linkedProfiles.suggestions,
      })
      .from(s.linkedProfiles)
      .where(eq(s.linkedProfiles.userId, userId)),
    db.select().from(s.interviewSessions).where(eq(s.interviewSessions.userId, userId)),
    db.select().from(s.chatThreads).where(eq(s.chatThreads.userId, userId)),
  ]);
  const resumeIds = resumes.map((r) => r.id);
  const threadIds = threads.map((t) => t.id);
  const [diffs, messages] = await Promise.all([
    resumeIds.length
      ? db.select().from(s.resumeDiffs).where(inArray(s.resumeDiffs.resumeId, resumeIds))
      : [],
    threadIds.length
      ? db.select().from(s.chatMessages).where(inArray(s.chatMessages.threadId, threadIds))
      : [],
  ]);
  const data = {
    exportedAt: new Date().toISOString(),
    account: user[0],
    profile: profile[0] ?? null,
    settings: settings[0] ?? null,
    resumes: resumes.map((r) => ({ ...r, diffs: diffs.filter((d) => d.resumeId === r.id) })),
    applications,
    alerts,
    // Tracking tokens and provider ids are internal.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    emails: emails.map(({ trackingToken, providerMessageId, ...e }) => e),
    inbox,
    savedSearches: searches,
    linkedProfiles: linked,
    interviews,
    assistant: threads.map((t) => ({
      ...t,
      messages: messages.filter((m) => m.threadId === t.id),
    })),
  };
  const date = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="getemployed-export-${date}.json"`,
    },
  });
}
