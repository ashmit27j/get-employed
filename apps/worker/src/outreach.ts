import { resolveMx } from "node:dns/promises";
import { and, count, eq, gte, inArray, isNull, lt, or } from "drizzle-orm";
import nodemailer from "nodemailer";
import MailComposer from "nodemailer/lib/mail-composer/index.js";
import { z } from "zod";
import { draftEmail } from "@ge/ai";
import { ProfileSchema, outreachDraft, parseSettings, replySubject } from "@ge/core";
import { open } from "@ge/core/secret-box";
import { schema } from "@ge/db";
import { withFallback, type Ctx } from "./ctx";

const {
  emails,
  contacts,
  jobs,
  companies,
  users,
  profiles,
  userSettings,
  mailboxConnections,
  accounts,
  resumes,
  jobMatches,
  applications,
  applicationEvents,
} = schema;

/* ---------- contact.find ---------- */

const EMAIL_RE = /[\w.+-]+@[\w-]+(\.[\w-]+)+/g;
const GENERIC =
  /^(no-?reply|donotreply|privacy|legal|support|help|info|security|abuse|press|media|accessibility)@/i;

/** Email addresses a job post itself lists for applications. */
export function emailsInPost(text: string): string[] {
  return [...new Set((text.match(EMAIL_RE) ?? []).map((e) => e.toLowerCase()))].filter(
    (e) => !GENERIC.test(e),
  );
}

/** Candidate web domains for a company name: "Razorpay" → razorpay.com, razorpay.in, … */
export function domainGuesses(company: string): string[] {
  const slug = company
    .toLowerCase()
    .replace(
      /\b(pvt|private|ltd|limited|inc|llp|technologies|technology|software|labs|india)\b/g,
      "",
    )
    .replace(/[^a-z0-9]/g, "");
  return slug ? [`${slug}.com`, `${slug}.in`, `${slug}.co.in`, `${slug}.io`, `${slug}.co`] : [];
}

async function hasMx(domain: string): Promise<boolean> {
  try {
    return (await resolveMx(domain)).length > 0;
  } catch {
    return false;
  }
}

/**
 * contact.find: who to write to about a job. An address listed in the post wins (high confidence);
 * else the company's mail domain (checked by MX) with its careers inbox (low confidence). We never
 * guess a named person's address. Then the draft the user asked for is created.
 */
export async function findContact(ctx: Ctx, data: unknown) {
  const { userId, jobId } = z.object({ userId: z.string(), jobId: z.string().uuid() }).parse(data);
  const [job] = await ctx.db
    .select({
      id: jobs.id,
      title: jobs.title,
      description: jobs.description,
      companyId: jobs.companyId,
      company: companies.name,
      domain: companies.domain,
    })
    .from(jobs)
    .innerJoin(companies, eq(companies.id, jobs.companyId))
    .where(eq(jobs.id, jobId));
  if (!job) return;

  let [contact] = await ctx.db
    .select()
    .from(contacts)
    .where(and(eq(contacts.jobId, job.id), eq(contacts.status, "found")));
  if (!contact) {
    const listed = emailsInPost(job.description);
    let found: {
      name: string;
      role: string;
      email: string;
      confidence: number;
      method: string;
    } | null = null;
    if (listed[0]) {
      found = {
        name: `${job.company} hiring team`,
        role: "Recruiting",
        email: listed[0],
        confidence: 90,
        method: "Listed in the job post",
      };
    } else {
      const domains = job.domain ? [job.domain] : domainGuesses(job.company);
      for (const d of domains) {
        if (await hasMx(d)) {
          if (!job.domain)
            await ctx.db
              .update(companies)
              .set({ domain: d })
              .where(eq(companies.id, job.companyId))
              .catch(() => undefined);
          found = {
            name: `${job.company} hiring team`,
            role: "Recruiting",
            email: `careers@${d}`,
            confidence: 40,
            method: `Company mail domain (MX checked) · ${d}`,
          };
          break;
        }
      }
    }
    [contact] = await ctx.db
      .insert(contacts)
      .values({
        companyId: job.companyId,
        jobId: job.id,
        ...(found ?? {}),
        status: found ? "found" : "none",
      })
      .returning();
  }
  if (!contact || contact.status !== "found" || !contact.email) {
    ctx.log(`contact.find ${jobId}: no contact`);
    return;
  }

  // The user asked to reach out: create the draft (unless one is open) and have it written.
  const [open_] = await ctx.db
    .select({ id: emails.id })
    .from(emails)
    .where(
      and(
        eq(emails.userId, userId),
        eq(emails.jobId, job.id),
        eq(emails.status, "draft"),
        isNull(emails.inReplyToId),
      ),
    );
  if (open_) return;
  const [user] = await ctx.db.select({ name: users.name }).from(users).where(eq(users.id, userId));
  const [match] = await ctx.db
    .select({ reason: jobMatches.reason })
    .from(jobMatches)
    .where(and(eq(jobMatches.userId, userId), eq(jobMatches.jobId, job.id)))
    .limit(1);
  const draft = outreachDraft({
    toName: contact.name ?? "there",
    jobTitle: job.title,
    company: job.company,
    senderName: user?.name ?? "",
    highlight: match?.reason,
  });
  const [row] = await ctx.db
    .insert(emails)
    .values({
      userId,
      jobId: job.id,
      contactId: contact.id,
      company: job.company,
      toName: contact.name ?? job.company,
      toRole: contact.role,
      toEmail: contact.email,
      ...draft,
    })
    .returning({ id: emails.id });
  await ctx.send("email.draft", { emailId: row!.id }, row!.id);
}

/* ---------- email.draft ---------- */

/** email.draft: Gemini writes (or rewrites) an outreach draft. It stays a draft until approved. */
export async function writeDraft(ctx: Ctx, data: unknown) {
  const { emailId } = z
    .object({ emailId: z.string().uuid(), regenerate: z.boolean().optional() })
    .parse(data);
  const [e] = await ctx.db.select().from(emails).where(eq(emails.id, emailId));
  if (!e || e.status !== "draft" || e.inReplyToId) return;
  const model = await ctx.llm(e.userId);
  if (!model) return; // The rule-based draft the app wrote stays.
  const [[user], [p], [s], job] = await Promise.all([
    ctx.db.select({ name: users.name }).from(users).where(eq(users.id, e.userId)),
    ctx.db.select({ doc: profiles.doc }).from(profiles).where(eq(profiles.userId, e.userId)),
    ctx.db.select().from(userSettings).where(eq(userSettings.userId, e.userId)),
    e.jobId
      ? ctx.db
          .select({
            title: jobs.title,
            company: companies.name,
            description: jobs.description,
            reason: jobMatches.reason,
          })
          .from(jobs)
          .innerJoin(companies, eq(companies.id, jobs.companyId))
          .leftJoin(jobMatches, and(eq(jobMatches.jobId, jobs.id), eq(jobMatches.userId, e.userId)))
          .where(eq(jobs.id, e.jobId))
          .limit(1)
          .then((r) => r[0])
      : Promise.resolve(undefined),
  ]);
  if (!user || !p) return;
  const tone = parseSettings(s).ai.tone;
  const out = await withFallback(
    ctx,
    "draftEmail",
    model,
    (m) =>
      draftEmail(m, {
        toName: e.toName,
        toRole: e.toRole,
        job: {
          title: job?.title ?? e.subject,
          company: e.company,
          description: job?.description ?? "",
        },
        profile: ProfileSchema.parse(p.doc),
        senderName: user.name,
        tone,
        reason: job?.reason ?? null,
      }),
    () => null,
  );
  if (!out) return;
  // Only overwrite a draft that is still a draft (the user may have approved it meanwhile).
  await ctx.db
    .update(emails)
    .set({ subject: out.subject, body: out.body, updatedAt: new Date() })
    .where(and(eq(emails.id, e.id), eq(emails.status, "draft")));
}

/* ---------- email.send ---------- */

const tzOf = (label: string) => label.split(" ")[0] || "Asia/Kolkata";

/** Minutes past midnight in a time zone. */
function minutesIn(tz: string, at: Date): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(at);
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return h * 60 + m;
}
const hm = (s: string) => {
  const [h, m] = s.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
};

/** When a send may happen: null if now is inside the window, else the next window opening. */
export function nextWindow(now: Date, tz: string, start: string, end: string): Date | null {
  const cur = minutesIn(tz, now);
  const a = hm(start);
  const b = hm(end);
  const inside = a <= b ? cur >= a && cur < b : cur >= a || cur < b;
  if (inside) return null;
  const wait = (a - cur + 1440) % 1440 || 1440;
  return new Date(now.getTime() + wait * 60_000);
}

async function gmailToken(ctx: Ctx, userId: string): Promise<string> {
  const [acc] = await ctx.db
    .select()
    .from(accounts)
    .where(and(eq(accounts.userId, userId), eq(accounts.providerId, "google")));
  if (!acc?.refreshToken && !acc?.accessToken)
    throw new SendError("Reconnect Gmail to send.", true);
  if (
    acc.accessToken &&
    acc.accessTokenExpiresAt &&
    acc.accessTokenExpiresAt.getTime() > Date.now() + 60_000
  )
    return acc.accessToken;
  if (!acc.refreshToken || !ctx.env.GOOGLE_CLIENT_ID || !ctx.env.GOOGLE_CLIENT_SECRET)
    throw new SendError("Reconnect Gmail to send.", true);
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: ctx.env.GOOGLE_CLIENT_ID,
      client_secret: ctx.env.GOOGLE_CLIENT_SECRET,
      refresh_token: acc.refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const json = (await res.json()) as { access_token?: string; expires_in?: number; error?: string };
  if (!res.ok || !json.access_token) {
    // Testing-mode refresh tokens expire after 7 days (docs/email-and-google.md).
    await ctx.db
      .update(mailboxConnections)
      .set({ status: "reconnect" })
      .where(eq(mailboxConnections.userId, userId));
    throw new SendError("Gmail access expired. Reconnect Gmail to send.", true);
  }
  await ctx.db
    .update(accounts)
    .set({
      accessToken: json.access_token,
      accessTokenExpiresAt: new Date(Date.now() + (json.expires_in ?? 3600) * 1000),
    })
    .where(eq(accounts.id, acc.id));
  return json.access_token;
}

/** A failure that retrying won't fix; the email keeps its status and shows the message. */
class SendError extends Error {
  constructor(
    message: string,
    readonly final: boolean,
  ) {
    super(message);
  }
}

const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/**
 * email.send: only for approved emails (the database refuses "sent" without approved_at).
 * Honours the sending window and daily limit, attaches the resume PDF when one is compiled, adds
 * the open-tracking pixel, and sends through the user's Gmail (gmail.send) or SMTP.
 */
export async function sendEmail(ctx: Ctx, data: unknown) {
  const { emailId } = z.object({ emailId: z.string().uuid() }).parse(data);
  const [e] = await ctx.db.select().from(emails).where(eq(emails.id, emailId));
  if (!e || e.status !== "approved" || !e.approvedAt) return;

  const [s] = await ctx.db.select().from(userSettings).where(eq(userSettings.userId, e.userId));
  const settings = parseSettings(s);
  const tz = tzOf(settings.general.timeZone);
  // Replies from the Inbox go straight away; outreach waits for the window and the daily limit.
  if (!e.inReplyToId) {
    const later = nextWindow(
      new Date(),
      tz,
      settings.mailbox.windowStart,
      settings.mailbox.windowEnd,
    );
    if (later) {
      await ctx.send("email.send", { emailId }, `${emailId}:${later.getTime()}`, later);
      return;
    }
    const dayStart = new Date(Date.now() - minutesIn(tz, new Date()) * 60_000);
    const [sent] = await ctx.db
      .select({ n: count() })
      .from(emails)
      .where(and(eq(emails.userId, e.userId), gte(emails.sentAt, dayStart)));
    if ((sent?.n ?? 0) >= settings.mailbox.dailyLimit) {
      const tomorrow = new Date(
        dayStart.getTime() + 86_400_000 + hm(settings.mailbox.windowStart) * 60_000,
      );
      await ctx.send("email.send", { emailId }, `${emailId}:${tomorrow.getTime()}`, tomorrow);
      return;
    }
  }

  const [conn] = await ctx.db
    .select()
    .from(mailboxConnections)
    .where(eq(mailboxConnections.userId, e.userId));
  if (!conn) {
    await ctx.db
      .update(emails)
      .set({ error: "Connect a mailbox in Settings → Mailbox to send." })
      .where(eq(emails.id, e.id));
    return;
  }
  const [user] = await ctx.db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, e.userId));

  // The resume: tailored for the job when there is one, else the main resume. Only compiled PDFs.
  const attachments: { filename: string; content: Buffer; contentType: string }[] = [];
  const [resume] = await ctx.db
    .select({ pdfKey: resumes.pdfKey, name: resumes.name, kind: resumes.kind })
    .from(resumes)
    .where(
      and(
        eq(resumes.userId, e.userId),
        or(
          e.jobId ? and(eq(resumes.kind, "tailored"), eq(resumes.jobId, e.jobId)) : undefined,
          eq(resumes.kind, "main"),
        ),
      ),
    )
    .orderBy(resumes.kind);
  if (resume?.pdfKey?.endsWith(".pdf")) {
    const f = await ctx.storage.get(resume.pdfKey);
    if (f)
      attachments.push({
        filename: `${(user?.name ?? "Resume").replace(/\s+/g, "-")}-Resume.pdf`,
        content: Buffer.from(f.body),
        contentType: "application/pdf",
      });
  }
  for (const a of e.attachments) {
    if (!a.key?.startsWith(`users/${e.userId}/`)) continue;
    const f = await ctx.storage.get(a.key);
    if (f)
      attachments.push({
        filename: a.name,
        content: Buffer.from(f.body),
        contentType: f.contentType,
      });
  }

  const pixel = `${ctx.env.NEXT_PUBLIC_SITE_URL}/t/o/${e.trackingToken}`;
  const message = {
    from: `${user?.name ?? ""} <${conn.address}>`,
    to: `${e.toName} <${e.toEmail}>`,
    subject: e.subject,
    text: e.body,
    html: `${esc(e.body).replace(/\n/g, "<br>")}<img src="${pixel}" width="1" height="1" alt="" style="display:none">`,
    attachments,
  };

  try {
    let providerId: string | null = null;
    if (conn.kind === "smtp") {
      const c = JSON.parse(open(conn.credentials, ctx.secretKey)) as {
        host: string;
        port: number;
        user: string;
        password: string;
      };
      const info = await nodemailer
        .createTransport({
          host: c.host,
          port: c.port,
          secure: c.port === 465,
          auth: { user: c.user, pass: c.password },
        })
        .sendMail(message);
      if (info.rejected.length) throw new SendError(`The server rejected ${e.toEmail}.`, true);
      providerId = info.messageId;
    } else if (conn.kind === "gmail") {
      const token = await gmailToken(ctx, e.userId);
      const raw = (await new MailComposer(message).compile().build()).toString("base64url");
      const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ raw }),
      });
      const json = (await res.json()) as { id?: string; error?: { message?: string } };
      if (res.status === 401 || res.status === 403)
        throw new SendError("Reconnect Gmail to send.", true);
      if (!res.ok) throw new Error(json.error?.message ?? `Gmail ${res.status}`);
      providerId = json.id ?? null;
    } else {
      throw new SendError("This mailbox can't send yet.", true);
    }
    await ctx.db
      .update(emails)
      .set({ status: "sent", sentAt: new Date(), providerMessageId: providerId, error: null })
      .where(and(eq(emails.id, e.id), eq(emails.status, "approved")));
    if (e.jobId) {
      const [app] = await ctx.db
        .select({ id: applications.id })
        .from(applications)
        .where(and(eq(applications.userId, e.userId), eq(applications.jobId, e.jobId)));
      if (app)
        await ctx.db
          .insert(applicationEvents)
          .values({ applicationId: app.id, kind: "emailed", data: { emailId: e.id } });
    }
    ctx.log(`email.send ${e.id}: sent via ${conn.kind}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // SMTP 5xx on the recipient means the address doesn't exist: that's a bounce.
    const bounce = /\b55[0-4]\b/.test(msg);
    await ctx.db
      .update(emails)
      .set(bounce ? { status: "bounced", error: msg.slice(0, 300) } : { error: msg.slice(0, 300) })
      .where(eq(emails.id, e.id));
    if (err instanceof SendError || bounce) return;
    throw err; // Transient: pg-boss retries with backoff.
  }
}

/* ---------- email.track (daily): follow-up drafts ---------- */

/**
 * Drafts one follow-up for outreach sent 7+ days ago with no reply, for users with automatic
 * follow-ups on. Follow-ups are drafts: the user approves them like any other email.
 */
export async function draftFollowUps(ctx: Ctx) {
  const cutoff = new Date(Date.now() - 7 * 86_400_000);
  const due = await ctx.db
    .select()
    .from(emails)
    .where(
      and(
        inArray(emails.status, ["sent", "opened"]),
        lt(emails.sentAt, cutoff),
        isNull(emails.repliedAt),
        isNull(emails.inReplyToId),
      ),
    );
  let made = 0;
  for (const e of due) {
    const [s] = await ctx.db.select().from(userSettings).where(eq(userSettings.userId, e.userId));
    if (!parseSettings(s).mailbox.followUps) continue;
    const subject = replySubject(e.subject);
    const [already] = await ctx.db
      .select({ id: emails.id })
      .from(emails)
      .where(
        and(
          eq(emails.userId, e.userId),
          eq(emails.toEmail, e.toEmail),
          eq(emails.subject, subject),
        ),
      );
    if (already) continue;
    const [user] = await ctx.db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, e.userId));
    const first = (n: string) => n.trim().split(/\s+/)[0] ?? n;
    await ctx.db.insert(emails).values({
      userId: e.userId,
      jobId: e.jobId,
      contactId: e.contactId,
      company: e.company,
      toName: e.toName,
      toRole: e.toRole,
      toEmail: e.toEmail,
      subject,
      body: `Hi ${first(e.toName)},\n\nFollowing up on my note last week about the role at ${e.company}. I'm still very interested and happy to share anything that helps.\n\nThanks,\n${first(user?.name ?? "")}`,
    });
    made++;
  }
  ctx.log(`email.track: ${made} follow-up drafts`);
}
