"use server";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import nodemailer from "nodemailer";
import { z } from "zod";
import { AiSettingsSchema, GeneralSettingsSchema, MailboxSettingsSchema } from "@ge/core";
import { seal } from "@ge/core/secret-box";
import { schema } from "@ge/db";
import { getDb } from "../db";
import { loadAccount } from "../account";
import { loadGithub } from "../profiles";
import {
  hasOwnLlmKey,
  loadMailboxConnection,
  loadSettings,
  loadUsage,
  mailboxKey,
} from "../settings";
import { requireUser } from "../session";

const { userSettings, mailboxConnections, feedback } = schema;
const SECTIONS = {
  general: GeneralSettingsSchema.partial(),
  mailbox: MailboxSettingsSchema.partial(),
  ai: AiSettingsSchema.partial(),
} as const;

/** Merge a change into one settings section (user_settings.general | mailbox | ai). */
export async function updateSettings(section: keyof typeof SECTIONS, patch: unknown) {
  const user = await requireUser();
  const key = z.enum(["general", "mailbox", "ai"]).parse(section);
  const parsed = SECTIONS[key].parse(patch) as Record<string, unknown>;
  // .partial() still fills in field defaults; keep only what was sent, so a change to one setting
  // never resets another.
  const sent = Object.keys(z.record(z.string(), z.unknown()).parse(patch));
  const value = Object.fromEntries(sent.filter((k) => k in parsed).map((k) => [k, parsed[k]]));
  const col = userSettings[key];
  await getDb()
    .insert(userSettings)
    .values({ userId: user.id, [key]: value })
    .onConflictDoUpdate({
      target: userSettings.userId,
      set: { [key]: sql`${col} || ${JSON.stringify(value)}::jsonb` },
    });
  revalidatePath("/", "layout");
}

const Smtp = z.object({
  host: z.string().trim().min(1).max(200),
  port: z.coerce.number().int().min(1).max(65535),
  user: z.string().trim().min(1).max(200),
  password: z.string().min(1).max(500),
  address: z.email(),
});

/**
 * Connect an SMTP mailbox for outreach (self-hosters, or an app password). The server logs in once
 * to check the details, then stores them encrypted (MAILBOX_ENCRYPTION_KEY). Replaces any mailbox.
 */
export async function connectSmtp(
  input: z.input<typeof Smtp>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await requireUser();
  const parsed = Smtp.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: "Check the server, port, username, password and address." };
  const s = parsed.data;
  try {
    await nodemailer
      .createTransport({
        host: s.host,
        port: s.port,
        secure: s.port === 465,
        auth: { user: s.user, pass: s.password },
      })
      .verify();
  } catch {
    return {
      ok: false,
      error: "We couldn't sign in to that server. Check the details and try again.",
    };
  }
  const db = getDb();
  await db.delete(mailboxConnections).where(eq(mailboxConnections.userId, user.id));
  await db.insert(mailboxConnections).values({
    userId: user.id,
    kind: "smtp",
    address: s.address,
    credentials: seal(
      JSON.stringify({ host: s.host, port: s.port, user: s.user, password: s.password }),
      mailboxKey(),
    ),
  });
  revalidatePath("/", "layout");
  return { ok: true };
}

const GMAIL_SEND = "https://www.googleapis.com/auth/gmail.send";

/**
 * After Google's consent screen for gmail.send (docs/email-and-google.md): record the mailbox.
 * The OAuth tokens stay in Better Auth's accounts row; the connection points at that account.
 */
export async function finishGmailConnect(): Promise<{ ok: boolean }> {
  const user = await requireUser();
  const db = getDb();
  const [google] = await db
    .select({ accountId: schema.accounts.accountId, scope: schema.accounts.scope })
    .from(schema.accounts)
    .where(and(eq(schema.accounts.userId, user.id), eq(schema.accounts.providerId, "google")));
  if (!google?.scope?.split(/[ ,]/).includes(GMAIL_SEND)) return { ok: false };
  await db.delete(mailboxConnections).where(eq(mailboxConnections.userId, user.id));
  await db.insert(mailboxConnections).values({
    userId: user.id,
    kind: "gmail",
    address: user.email,
    credentials: seal(JSON.stringify({ accountId: google.accountId }), mailboxKey()),
    scopes: ["gmail.send"],
  });
  // Runs during the Mailbox page render, so no revalidatePath here.
  await db
    .insert(userSettings)
    .values({ userId: user.id, mailbox: { setupDone: true } })
    .onConflictDoUpdate({
      target: userSettings.userId,
      set: { mailbox: sql`${userSettings.mailbox} || '{"setupDone":true}'::jsonb` },
    });
  return { ok: true };
}

export async function disconnectMailbox() {
  const user = await requireUser();
  await getDb().delete(mailboxConnections).where(eq(mailboxConnections.userId, user.id));
  revalidatePath("/", "layout");
}

export async function sendFeedback(input: { kind: string; message: string; page?: string | null }) {
  const user = await requireUser();
  await getDb()
    .insert(feedback)
    .values({
      userId: user.id,
      kind: z.enum(["idea", "bug", "question"]).parse(input.kind),
      message: z.string().trim().min(1).max(5000).parse(input.message),
      page: input.page ? z.string().max(500).parse(input.page) : null,
    });
}

/** Settings → Developer: the user's own LLM key, stored encrypted. It replaces the deployment's key for this user. */
export async function saveLlmKey(key: string): Promise<{ ok: boolean; error?: string }> {
  const user = await requireUser();
  const value = z
    .string()
    .trim()
    .regex(/^[\w.-]{10,200}$/, "That doesn't look like an API key.")
    .safeParse(key);
  if (!value.success) return { ok: false, error: value.error.issues[0]?.message };
  const llmKey = seal(value.data, mailboxKey());
  await getDb()
    .insert(userSettings)
    .values({ userId: user.id, llmKey })
    .onConflictDoUpdate({ target: userSettings.userId, set: { llmKey } });
  return { ok: true };
}

export async function removeLlmKey() {
  const user = await requireUser();
  await getDb().update(userSettings).set({ llmKey: null }).where(eq(userSettings.userId, user.id));
}

/** Everything the settings dialog shows, loaded when it opens. */
export async function loadSettingsDialog() {
  const user = await requireUser();
  const [settings, connection, usage, ownKey, account, github] = await Promise.all([
    loadSettings(user.id),
    loadMailboxConnection(user.id),
    loadUsage(user.id),
    hasOwnLlmKey(user.id),
    loadAccount(user.id),
    loadGithub(user.id),
  ]);
  return {
    settings,
    connection,
    usage,
    ownKey,
    email: user.email,
    account,
    connectors: { github: github.login, mailbox: connection?.address ?? null },
    nowIso: new Date().toISOString(),
  };
}
export type SettingsData = Awaited<ReturnType<typeof loadSettingsDialog>>;
