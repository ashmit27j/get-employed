// Seeds a demo user and the prototype's mock data. Safe to re-run: it removes the demo user
// (cascading to their rows) and all jobs from the "seed" source first.
//   pnpm db:seed
//   pnpm db:seed -- --reset-jobs   also removes every ingested job (the e2e tests expect only the seed's)
import { eq, inArray } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { createDb } from "./index";
import { loadRootEnv } from "./load-env";
import * as s from "./schema";
import {
  GITHUB,
  INBOX,
  LINKEDIN,
  JOB_DETAILS,
  LATEST_REPORT,
  SEED_NOW,
  TRACKER_ALERTS,
  dedupeHash,
  jobDescription,
  loadPrototypeData,
  parseAgo,
  parseDay,
  parseExperience,
  parseMode,
  parseProfile,
  rubricFrom,
  searchResults,
  toChips,
} from "./seed-data";

export const SEED_USER_ID = "seed-user";
const SEED_SOURCE = "seed";

/** The demo account's password. The public default is for local development only. */
function seedPassword(): string {
  const password = process.env.SEED_PASSWORD || "getemployed-demo";
  if (process.env.NODE_ENV === "production" && password === "getemployed-demo") {
    throw new Error("Set SEED_PASSWORD to a private value before seeding a production database.");
  }
  return password;
}

async function main() {
  loadRootEnv();
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set. Copy .env.example to .env first.");
  const db = createDb(url, { max: 1 });
  const data = loadPrototypeData();

  await db.transaction(async (tx) => {
    await tx.delete(s.users).where(eq(s.users.id, SEED_USER_ID));
    // contacts.job_id is "set null" on delete, so remove the seed jobs' contacts explicitly or
    // every re-seed would add another set.
    const seedJobs = tx
      .select({ id: s.jobs.id })
      .from(s.jobs)
      .where(eq(s.jobs.sourceKey, SEED_SOURCE));
    await tx.delete(s.contacts).where(inArray(s.contacts.jobId, seedJobs));
    await tx.delete(s.jobs).where(eq(s.jobs.sourceKey, SEED_SOURCE));
    if (process.argv.includes("--reset-jobs")) {
      await tx.delete(s.jobs);
      await tx.delete(s.jobSources);
    }

    /* User, settings, profile */
    await tx.insert(s.users).values({
      id: SEED_USER_ID,
      name: data.USER.name,
      email: data.USER.email,
      emailVerified: true,
      username: "ashmit",
      displayUsername: "ashmit",
      targetRole: "Backend engineer",
      preferredLocations: ["Bengaluru", "Mumbai", "Remote"],
      experienceLevel: "Student or intern",
    });
    // Demo sign-in: username "ashmit" or the seed email, password from SEED_PASSWORD.
    await tx.insert(s.accounts).values({
      id: "seed-account",
      userId: SEED_USER_ID,
      accountId: SEED_USER_ID,
      providerId: "credential",
      password: await hashPassword(seedPassword()),
    });
    // The demo inbox is seeded, so skip the Mailbox's first-visit connect step.
    await tx.insert(s.userSettings).values({ userId: SEED_USER_ID, mailbox: { setupDone: true } });
    const profile = parseProfile(data);
    // Job Profile extras on the shared entries (prototype/Profile.dc.html).
    profile.experience = profile.experience.map((x, i) => ({
      ...x,
      type: "Internship",
      ...(i === 0 && {
        summary:
          "Built Nosh, a SwiftUI meal-planning app using MVVM; shipped onboarding and settings with the design team.",
      }),
    }));
    profile.certifications = profile.certifications.map((c, i) =>
      i === 0 ? { ...c, expires: "Mar 2029", credentialId: "AWS-CCP-88213" } : c,
    );
    await tx
      .insert(s.profiles)
      .values({ userId: SEED_USER_ID, doc: profile, details: JOB_DETAILS });

    /* LinkedIn and GitHub, already imported */
    await tx.insert(s.linkedProfiles).values([
      {
        userId: SEED_USER_ID,
        kind: "linkedin",
        source: "seed/linkedin-profile.pdf",
        snapshot: LINKEDIN.snapshot,
        suggestions: LINKEDIN.suggestions,
        importedAt: SEED_NOW,
      },
      {
        userId: SEED_USER_ID,
        kind: "github",
        source: GITHUB.login,
        snapshot: GITHUB,
        importedAt: SEED_NOW,
      },
    ]);

    /* Companies */
    const companyNames = new Set([...data.JOBS.map((j) => j.co), ...data.EMAILS.map((e) => e.co)]);
    const companyIds = new Map<string, string>();
    for (const name of companyNames) {
      const existing = await tx.query.companies.findFirst({ where: eq(s.companies.name, name) });
      const row =
        existing ??
        (await tx.insert(s.companies).values({ name }).returning({ id: s.companies.id }))[0]!;
      companyIds.set(name, row.id);
    }

    /* Jobs, salary estimates, matches, contacts */
    const jobIds = new Map<string, string>();
    const contactIds = new Map<string, string>();
    for (const j of data.JOBS) {
      const [minY, maxY] = parseExperience(j.exp);
      const stated = j.salary.type === "stated";
      const [job] = await tx
        .insert(s.jobs)
        .values({
          sourceKey: SEED_SOURCE,
          sourceLabel: j.src,
          externalId: j.id,
          dedupeHash: dedupeHash(j.co, j.title, j.loc),
          companyId: companyIds.get(j.co)!,
          title: j.title,
          location: j.loc,
          mode: parseMode(j.mode),
          experience: j.exp,
          experienceMinYears: minY,
          experienceMaxYears: maxY,
          skills: j.skills,
          description: jobDescription(j.co),
          salaryMin: stated ? j.salary.min : null,
          salaryMax: stated ? j.salary.max : null,
          postedAt: parseAgo(j.posted),
        })
        .returning({ id: s.jobs.id });
      jobIds.set(j.id, job!.id);

      if (!stated) {
        await tx.insert(s.salaryEstimates).values({
          jobId: job!.id,
          min: j.salary.min,
          max: j.salary.max,
          confidence: j.salary.conf ?? 50,
          sampleSize: j.salary.n ?? 0,
        });
      }
      await tx.insert(s.jobMatches).values({
        userId: SEED_USER_ID,
        jobId: job!.id,
        profileVersion: 1,
        score: j.score,
        reason: j.why,
        missing: j.missing,
      });
      const [contact] = await tx
        .insert(s.contacts)
        .values({
          companyId: companyIds.get(j.co)!,
          jobId: job!.id,
          name: j.contact.name ?? null,
          role: j.contact.role ?? null,
          email: j.contact.email ?? null,
          confidence: j.contact.conf ?? null,
          method: data.EMAILS.find((e) => e.job === j.id)?.how ?? null,
          status: j.contact.status,
        })
        .returning({ id: s.contacts.id });
      contactIds.set(j.id, contact!.id);
    }

    /* Saved searches */
    for (const q of data.SEARCHES) {
      const [search] = await tx
        .insert(s.savedSearches)
        .values({
          userId: SEED_USER_ID,
          query: q.q,
          filters: toChips(q.chips),
          frequency: q.freq.toLowerCase() as "hourly" | "daily" | "weekly",
          active: q.active,
          newCount: q.newCount,
          lastRunAt: SEED_NOW,
        })
        .returning({ id: s.savedSearches.id });
      await tx.insert(s.savedSearchResults).values(
        searchResults(q, data.JOBS).map((r, i) => ({
          savedSearchId: search!.id,
          jobId: jobIds.get(r.jobId)!,
          seen: r.seen,
          // Newest first: unseen results arrived most recently.
          firstSeenAt: new Date(SEED_NOW.getTime() - i * 3_600_000),
        })),
      );
    }

    /* Emails. Anything past "draft" was approved in the prototype's story. */
    for (const e of data.EMAILS) {
      const sentAt = e.sent ? parseDay(e.sent) : null;
      await tx.insert(s.emails).values({
        userId: SEED_USER_ID,
        jobId: e.job ? (jobIds.get(e.job) ?? null) : null,
        contactId: e.job ? (contactIds.get(e.job) ?? null) : null,
        company: e.co,
        toName: e.to,
        toRole: e.role,
        toEmail: e.email,
        subject: e.subject,
        body: e.body ?? "",
        status: e.status,
        approvedAt: e.status === "draft" ? null : sentAt,
        sentAt,
        openedAt: e.status === "opened" || e.status === "replied" ? sentAt : null,
        repliedAt: e.status === "replied" ? sentAt : null,
        replyText: e.reply ?? null,
        error: e.err ?? null,
      });
    }

    /* Inbox */
    for (const m of INBOX) {
      const at = new Date(m.at);
      await tx.insert(s.inboxMessages).values({
        userId: SEED_USER_ID,
        kind: m.kind,
        fromName: m.from,
        fromRole: m.role,
        company: m.co,
        fromEmail: m.email,
        subject: m.subject,
        body: m.text,
        source: "seed",
        receivedAt: at,
        readAt: m.unread ? null : at,
      });
    }

    /* Tracker */
    for (const a of data.APPS) {
      const job = data.JOBS.find((j) => j.title === a.title && j.co === a.co);
      const [app] = await tx
        .insert(s.applications)
        .values({
          userId: SEED_USER_ID,
          jobId: job ? (jobIds.get(job.id) ?? null) : null,
          title: a.title,
          company: a.co,
          stage: a.stage,
          note: a.meta,
        })
        .returning({ id: s.applications.id });
      const alert = TRACKER_ALERTS.find((x) => x.title === a.title && x.co === a.co);
      if (alert) {
        const dueAt = parseDay(alert.day);
        await tx
          .update(s.applications)
          .set({ deadlineAt: dueAt })
          .where(eq(s.applications.id, app!.id));
        await tx
          .insert(s.alerts)
          .values({ userId: SEED_USER_ID, applicationId: app!.id, action: alert.action, dueAt });
      }
      const flagKinds = ["tailored", "emailed", "opened", "replied"] as const;
      for (const kind of flagKinds.filter((k) => a.flags.includes(k))) {
        await tx.insert(s.applicationEvents).values({ applicationId: app!.id, kind });
      }
    }

    /* Resumes: the main resume plus one tailored version with the prototype's diffs (Zepto, ATS 62 → 79) */
    const [main] = await tx
      .insert(s.resumes)
      .values({
        userId: SEED_USER_ID,
        kind: "main",
        name: "Main resume",
        doc: profile,
        atsScore: 62,
      })
      .returning({ id: s.resumes.id });
    await tx
      .update(s.profiles)
      .set({
        details: {
          ...JOB_DETAILS,
          documents: [
            {
              id: "main",
              name: "Main resume",
              type: "Resume",
              meta: "From Documents · updated Sep 24",
              resumeId: main!.id,
            },
            {
              id: "transcript",
              name: "Semester 5 transcript.pdf",
              type: "Transcript",
              meta: "Uploaded · 0.4 MB · Sep 2",
            },
          ],
        },
      })
      .where(eq(s.profiles.userId, SEED_USER_ID));
    const [tailored] = await tx
      .insert(s.resumes)
      .values({
        userId: SEED_USER_ID,
        kind: "tailored",
        parentId: main!.id,
        jobId: jobIds.get("j2") ?? null,
        name: "SDE-1, Platform · Zepto",
        doc: profile,
        atsScoreBefore: 62,
        atsScore: 79,
      })
      .returning({ id: s.resumes.id });
    await tx.insert(s.resumeDiffs).values(
      data.DIFFS.map((d, i) => ({
        resumeId: tailored!.id,
        section: d.sec,
        old: d.old,
        new: d.neu,
        reason: d.why,
        position: i,
      })),
    );

    /* Assistant: the conversation in prototype/Assistant.dc.html */
    const [thread] = await tx
      .insert(s.chatThreads)
      .values({
        userId: SEED_USER_ID,
        title: "Job hunt, week of Sep 22",
        pinned: true,
        lastMessageAt: SEED_NOW,
      })
      .returning({ id: s.chatThreads.id });
    const at = (hm: string) => new Date(`2026-09-26T${hm}:00+05:30`);
    await tx.insert(s.chatMessages).values([
      {
        threadId: thread!.id,
        role: "user",
        text: "Find backend roles in Bengaluru that would take a 2027 grad. I'm fine with hybrid.",
        createdAt: at("10:02"),
      },
      {
        threadId: thread!.id,
        role: "assistant",
        text: "I searched 4 job boards and 60 careers pages. 6 roles fit; these three match your profile best.",
        actions: [
          {
            icon: "search",
            title: "Searched jobs",
            detail: "Backend · Bengaluru · Hybrid or on-site · 0–2 yrs",
            status: "done",
            href: "/jobs",
            cta: "Open in Jobs",
          },
        ],
        jobIds: ["j1", "j3", "j4"].map((k) => jobIds.get(k)!),
        createdAt: at("10:02"),
      },
      {
        threadId: thread!.id,
        role: "user",
        text: "Tailor my resume for the Razorpay one and draft an email to the hiring manager.",
        createdAt: at("10:04"),
      },
      {
        threadId: thread!.id,
        role: "assistant",
        text: "Done. I rewrote 4 bullets to surface your Kafka and Go work (ATS 62 → 84) and found Ananya Krishnan, the Engineering Manager for Payments. The email is waiting in your Outbox; nothing is sent until you approve it.",
        actions: [
          {
            icon: "file-check",
            title: "Tailored resume for Backend Engineer I · Razorpay",
            detail: "4 rewrites to review",
            status: "done",
            href: `/documents?view=tailor&job=${jobIds.get("j1")}`,
            cta: "Review",
          },
          {
            icon: "send",
            title: "Drafted outreach to Ananya Krishnan",
            detail: "ananya.k@razorpay.com · 94% confidence",
            status: "done",
            href: "/mailbox?box=outbox",
            cta: "Open Outbox",
          },
        ],
        createdAt: at("10:04"),
      },
    ]);

    /* Interview history */
    for (const i of data.SESSIONS) {
      await tx.insert(s.interviewSessions).values({
        userId: SEED_USER_ID,
        label: i.job,
        type: i.type.toLowerCase().startsWith("tech") ? "technical" : "behavioural",
        format: "voice",
        startedAt: parseDay(i.date),
        durationS: Number.parseInt(i.dur, 10) * 60,
        score: i.score,
        rubric: rubricFrom(i.r),
        sttEngine: "webspeech",
        jobId: i.job.startsWith("Backend Engineer I") ? (jobIds.get("j1") ?? null) : null,
        report: i.id === "i5" ? LATEST_REPORT : null,
      });
    }
  });

  console.log(
    `Seeded ${SEED_USER_ID} (${process.env.DATABASE_URL?.replace(/:[^:@/]+@/, ":***@")})`,
  );
  process.exit(0);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
