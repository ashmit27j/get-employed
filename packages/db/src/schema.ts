// Database schema. Documented in docs/data-model.md; column names are snake_case in Postgres
// (casing: "snake_case"), camelCase here.
import { sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import {
  CONTACT_STATUSES,
  EMAIL_STATUSES,
  INBOX_KINDS,
  INTERVIEW_FORMATS,
  INTERVIEW_TYPES,
  SEARCH_FREQUENCIES,
  SEARCH_NOTIFY,
  SEARCH_RUN_ON,
  STAGES,
  STT_ENGINES,
  WORK_MODES,
  type ChatAction,
  type EmailAttachment,
  type GithubSnapshot,
  type JobDetails,
  type LinkedinSnapshot,
  type LinkedinSuggestion,
  type Profile,
  type RubricScores,
  type SessionReport,
  type SearchFilters,
} from "@ge/core";

const timestamps = {
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};
const id = () => uuid().primaryKey().defaultRandom();
const userRef = () =>
  text()
    .notNull()
    .references(() => users.id, { onDelete: "cascade" });

export const stageEnum = pgEnum("stage", STAGES);
export const workModeEnum = pgEnum("work_mode", WORK_MODES);
export const searchFrequencyEnum = pgEnum("search_frequency", SEARCH_FREQUENCIES);
export const emailStatusEnum = pgEnum("email_status", EMAIL_STATUSES);
export const contactStatusEnum = pgEnum("contact_status", CONTACT_STATUSES);
export const interviewTypeEnum = pgEnum("interview_type", INTERVIEW_TYPES);
export const interviewFormatEnum = pgEnum("interview_format", INTERVIEW_FORMATS);
export const sttEngineEnum = pgEnum("stt_engine", STT_ENGINES);
export const resumeKindEnum = pgEnum("resume_kind", ["main", "tailored"]);
export const diffStatusEnum = pgEnum("diff_status", ["pending", "accepted", "rejected"]);
export const mailboxKindEnum = pgEnum("mailbox_kind", ["gmail", "smtp", "imap"]);
export const linkedProfileKindEnum = pgEnum("linked_profile_kind", ["linkedin", "github"]);
export const ttsTierEnum = pgEnum("tts_tier", ["wavenet", "standard"]);

/* ---------- Auth (Better Auth tables, plural names; ids are Better Auth strings) ---------- */

export const users = pgTable("users", {
  id: text().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  emailVerified: boolean().notNull().default(false),
  image: text(),
  username: text().unique(),
  displayUsername: text(),
  /** 1–6 while onboarding is in progress, null when finished or skipped. */
  onboardingStep: integer(),
  targetRole: text(),
  experienceLevel: text(),
  preferredLocations: text()
    .array()
    .notNull()
    .default(sql`'{}'::text[]`),
  ...timestamps,
});

export const sessions = pgTable("sessions", {
  id: text().primaryKey(),
  userId: userRef(),
  token: text().notNull().unique(),
  expiresAt: timestamp({ withTimezone: true }).notNull(),
  ipAddress: text(),
  userAgent: text(),
  ...timestamps,
});

export const accounts = pgTable("accounts", {
  id: text().primaryKey(),
  userId: userRef(),
  accountId: text().notNull(),
  providerId: text().notNull(),
  accessToken: text(),
  refreshToken: text(),
  idToken: text(),
  accessTokenExpiresAt: timestamp({ withTimezone: true }),
  refreshTokenExpiresAt: timestamp({ withTimezone: true }),
  scope: text(),
  password: text(),
  ...timestamps,
});

export const verifications = pgTable("verifications", {
  id: text().primaryKey(),
  identifier: text().notNull(),
  value: text().notNull(),
  expiresAt: timestamp({ withTimezone: true }).notNull(),
  ...timestamps,
});

export const userSettings = pgTable("user_settings", {
  userId: text()
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  general: jsonb().$type<Record<string, unknown>>().notNull().default({}),
  mailbox: jsonb().$type<Record<string, unknown>>().notNull().default({}),
  ai: jsonb().$type<Record<string, unknown>>().notNull().default({}),
  /** The user's own LLM API key, sealed with MAILBOX_ENCRYPTION_KEY (@ge/core/secret-box). */
  llmKey: text(),
  ...timestamps,
});

/* ---------- Profile ---------- */

export const profiles = pgTable("profiles", {
  userId: text()
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  /** Bumped on every edit; job_matches are cached per version. */
  version: integer().notNull().default(1),
  doc: jsonb().$type<Profile>().notNull(),
  /** Job Profile facts that are not resume content (JobDetailsSchema). */
  details: jsonb().$type<Partial<JobDetails>>().notNull().default({}),
  ...timestamps,
});

export const linkedProfiles = pgTable(
  "linked_profiles",
  {
    id: id(),
    userId: userRef(),
    kind: linkedProfileKindEnum().notNull(),
    source: text().notNull(),
    /** LinkedinSnapshot or GithubSnapshot; null until the import has run. */
    snapshot: jsonb().$type<LinkedinSnapshot | GithubSnapshot>(),
    /** LinkedIn rewrites (LinkedinSuggestion[]). */
    suggestions: jsonb().$type<LinkedinSuggestion[]>().notNull().default([]),
    importedAt: timestamp({ withTimezone: true }),
    ...timestamps,
  },
  (t) => [uniqueIndex().on(t.userId, t.kind)],
);

/* ---------- Jobs ---------- */

export const companies = pgTable("companies", {
  id: id(),
  name: text().notNull(),
  domain: text().unique(),
  logoUrl: text(),
  ...timestamps,
});

export const jobSources = pgTable("job_sources", {
  key: text().primaryKey(),
  enabled: boolean().notNull().default(true),
  config: jsonb().$type<Record<string, unknown>>().notNull().default({}),
  lastRunAt: timestamp({ withTimezone: true }),
  lastError: text(),
  ...timestamps,
});

export const jobs = pgTable(
  "jobs",
  {
    id: id(),
    sourceKey: text().notNull(),
    /** Human label shown on the card ("LinkedIn", "Careers page", "Naukri"). */
    sourceLabel: text().notNull(),
    externalId: text().notNull(),
    dedupeHash: text().notNull().unique(),
    companyId: uuid()
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    title: text().notNull(),
    location: text().notNull(),
    mode: workModeEnum().notNull(),
    experience: text().notNull(),
    experienceMinYears: real(),
    experienceMaxYears: real(),
    skills: text()
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    description: text().notNull().default(""),
    url: text(),
    /** Stated salary in LPA; null when the listing has none (see salary_estimates). */
    salaryMin: real(),
    salaryMax: real(),
    postedAt: timestamp({ withTimezone: true }).notNull(),
    expiresAt: timestamp({ withTimezone: true }),
    closedAt: timestamp({ withTimezone: true }),
    ...timestamps,
  },
  (t) => [uniqueIndex().on(t.sourceKey, t.externalId), index().on(t.postedAt)],
);

export const salaryEstimates = pgTable("salary_estimates", {
  jobId: uuid()
    .primaryKey()
    .references(() => jobs.id, { onDelete: "cascade" }),
  min: real().notNull(),
  max: real().notNull(),
  confidence: integer().notNull(),
  sampleSize: integer().notNull(),
  ...timestamps,
});

export const jobMatches = pgTable(
  "job_matches",
  {
    id: id(),
    userId: userRef(),
    jobId: uuid()
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    profileVersion: integer().notNull(),
    score: integer().notNull(),
    reason: text().notNull(),
    missing: text()
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    ...timestamps,
  },
  (t) => [
    uniqueIndex().on(t.userId, t.jobId, t.profileVersion),
    check("job_matches_score_range", sql`${t.score} between 0 and 100`),
  ],
);

export const contacts = pgTable("contacts", {
  id: id(),
  companyId: uuid()
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  jobId: uuid().references(() => jobs.id, { onDelete: "set null" }),
  name: text(),
  role: text(),
  email: text(),
  confidence: integer(),
  method: text(),
  status: contactStatusEnum().notNull().default("searching"),
  ...timestamps,
});

/** Jobs a user hid from their feed ("We'll rank similar roles lower"). */
export const hiddenJobs = pgTable(
  "hidden_jobs",
  {
    userId: userRef(),
    jobId: uuid()
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.jobId] })],
);

/* ---------- Saved searches ---------- */

export const savedSearches = pgTable("saved_searches", {
  id: id(),
  userId: userRef(),
  query: text().notNull(),
  filters: jsonb().$type<SearchFilters>().notNull().default([]),
  frequency: searchFrequencyEnum().notNull().default("daily"),
  runOn: text({ enum: SEARCH_RUN_ON }).notNull().default("cloud"),
  notify: text({ enum: SEARCH_NOTIFY }).notNull().default("each"),
  active: boolean().notNull().default(true),
  lastRunAt: timestamp({ withTimezone: true }),
  newCount: integer().notNull().default(0),
  deletedAt: timestamp({ withTimezone: true }),
  ...timestamps,
});

export const savedSearchResults = pgTable(
  "saved_search_results",
  {
    savedSearchId: uuid()
      .notNull()
      .references(() => savedSearches.id, { onDelete: "cascade" }),
    jobId: uuid()
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    firstSeenAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    seen: boolean().notNull().default(false),
  },
  (t) => [primaryKey({ columns: [t.savedSearchId, t.jobId] })],
);

/* ---------- Tracker ---------- */

export const applications = pgTable(
  "applications",
  {
    id: id(),
    userId: userRef(),
    jobId: uuid().references(() => jobs.id, { onDelete: "set null" }),
    title: text().notNull(),
    company: text().notNull(),
    stage: stageEnum().notNull().default("saved"),
    stageChangedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    deadlineAt: timestamp({ withTimezone: true }),
    /** Free-text next step shown on the card, e.g. "Round 1 · Sep 29, 11:00". */
    note: text(),
    ...timestamps,
  },
  (t) => [index().on(t.userId, t.stage)],
);

export const applicationEvents = pgTable("application_events", {
  id: id(),
  applicationId: uuid()
    .notNull()
    .references(() => applications.id, { onDelete: "cascade" }),
  kind: text({
    enum: ["stage", "tailored", "emailed", "opened", "replied", "interview_scheduled", "offer"],
  }).notNull(),
  data: jsonb().$type<Record<string, unknown>>().notNull().default({}),
  at: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

/** Tracker alerts: dated next steps for an application, or the user's own reminders. */
export const alerts = pgTable(
  "alerts",
  {
    id: id(),
    userId: userRef(),
    applicationId: uuid().references(() => applications.id, { onDelete: "cascade" }),
    action: text().notNull(),
    dueAt: timestamp({ withTimezone: true }),
    doneAt: timestamp({ withTimezone: true }),
    ...timestamps,
  },
  (t) => [index().on(t.userId, t.doneAt)],
);

/* ---------- Resumes ---------- */

export const resumes = pgTable(
  "resumes",
  {
    id: id(),
    userId: userRef(),
    kind: resumeKindEnum().notNull(),
    parentId: uuid(),
    jobId: uuid().references(() => jobs.id, { onDelete: "set null" }),
    name: text().notNull(),
    template: text().notNull().default("classic"),
    sourceFormat: text({ enum: ["structured", "latex"] })
      .notNull()
      .default("structured"),
    source: text(),
    doc: jsonb().$type<Profile>(),
    atsScore: integer(),
    atsScoreBefore: integer(),
    pdfKey: text(),
    editedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("resumes_one_main_per_user")
      .on(t.userId)
      .where(sql`${t.kind} = 'main'`),
  ],
);

export const resumeDiffs = pgTable("resume_diffs", {
  id: id(),
  resumeId: uuid()
    .notNull()
    .references(() => resumes.id, { onDelete: "cascade" }),
  section: text().notNull(),
  old: text().notNull(),
  new: text().notNull(),
  reason: text().notNull(),
  status: diffStatusEnum().notNull().default("pending"),
  position: integer().notNull().default(0),
  ...timestamps,
});

/* ---------- Mailbox ---------- */

export const mailboxConnections = pgTable("mailbox_connections", {
  id: id(),
  userId: userRef(),
  kind: mailboxKindEnum().notNull(),
  address: text().notNull(),
  /** Encrypted at rest by the app before insert. */
  credentials: text().notNull(),
  scopes: text()
    .array()
    .notNull()
    .default(sql`'{}'::text[]`),
  status: text({ enum: ["connected", "reconnect", "error"] })
    .notNull()
    .default("connected"),
  ...timestamps,
});

export const emails = pgTable(
  "emails",
  {
    id: id(),
    userId: userRef(),
    jobId: uuid().references(() => jobs.id, { onDelete: "set null" }),
    contactId: uuid().references(() => contacts.id, { onDelete: "set null" }),
    company: text().notNull(),
    toName: text().notNull(),
    toRole: text(),
    toEmail: text().notNull(),
    subject: text().notNull(),
    body: text().notNull().default(""),
    status: emailStatusEnum().notNull().default("draft"),
    approvedAt: timestamp({ withTimezone: true }),
    sentAt: timestamp({ withTimezone: true }),
    openedAt: timestamp({ withTimezone: true }),
    repliedAt: timestamp({ withTimezone: true }),
    replyText: text(),
    error: text(),
    providerMessageId: text(),
    /** Extra documents. The resume (tailored for the job, else the main one) is always attached. */
    attachments: jsonb().$type<EmailAttachment[]>().notNull().default([]),
    /** Set on replies written from the Inbox. */
    inReplyToId: uuid().references((): AnyPgColumn => inboxMessages.id, { onDelete: "set null" }),
    trackingToken: uuid().notNull().defaultRandom().unique(),
    ...timestamps,
  },
  (t) => [
    // Never send without approval: any status past "draft" requires approved_at.
    check("emails_approved_before_send", sql`${t.status} = 'draft' or ${t.approvedAt} is not null`),
    index().on(t.userId, t.status),
  ],
);

/**
 * Mail received about the user's search: replies, interview invites, recruiter mail. Filled by the
 * optional IMAP connection (roadmap) and by replies the user pastes when marking an email replied.
 * Gmail's read scopes are restricted and not used (docs/email-and-google.md).
 */
export const inboxMessages = pgTable(
  "inbox_messages",
  {
    id: id(),
    userId: userRef(),
    /** The outreach email this answers, when known. */
    emailId: uuid().references((): AnyPgColumn => emails.id, { onDelete: "set null" }),
    kind: text({ enum: INBOX_KINDS }).notNull(),
    fromName: text().notNull(),
    fromRole: text(),
    company: text().notNull(),
    fromEmail: text().notNull(),
    subject: text().notNull(),
    body: text().notNull(),
    source: text({ enum: ["imap", "manual", "seed"] }).notNull(),
    receivedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    readAt: timestamp({ withTimezone: true }),
    archivedAt: timestamp({ withTimezone: true }),
    ...timestamps,
  },
  (t) => [index().on(t.userId, t.receivedAt)],
);

/* ---------- Interviews ---------- */

export const interviewSessions = pgTable("interview_sessions", {
  id: id(),
  userId: userRef(),
  jobId: uuid().references(() => jobs.id, { onDelete: "set null" }),
  label: text().notNull(),
  type: interviewTypeEnum().notNull(),
  format: interviewFormatEnum().notNull(),
  startedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  durationS: integer(),
  score: integer(),
  rubric: jsonb().$type<RubricScores>(),
  transcript: jsonb().$type<{ role: "interviewer" | "candidate"; text: string; at: number }[]>(),
  sttEngine: sttEngineEnum(),
  /** Summary, answer-by-answer notes, delivery metrics (SessionReport in packages/core). */
  report: jsonb().$type<SessionReport>(),
  ...timestamps,
});

/** Google Cloud TTS characters used per month and tier (global: the free tier is per project). */
export const ttsUsage = pgTable(
  "tts_usage",
  {
    month: text().notNull(),
    tier: ttsTierEnum().notNull(),
    characters: integer().notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.month, t.tier] })],
);

export const interviewAudioCache = pgTable("interview_audio_cache", {
  hash: text().primaryKey(),
  voice: text().notNull(),
  storageKey: text().notNull(),
  characters: integer().notNull(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

/* ---------- Assistant ---------- */

export const chatGroups = pgTable("chat_groups", {
  id: id(),
  userId: userRef(),
  name: text().notNull(),
  colorIndex: integer().notNull().default(0),
  position: integer().notNull().default(0),
  ...timestamps,
});

export const chatThreads = pgTable(
  "chat_threads",
  {
    id: id(),
    userId: userRef(),
    groupId: uuid().references(() => chatGroups.id, { onDelete: "set null" }),
    title: text().notNull(),
    pinned: boolean().notNull().default(false),
    lastMessageAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    ...timestamps,
  },
  (t) => [index().on(t.userId, t.lastMessageAt)],
);

export const chatMessages = pgTable("chat_messages", {
  id: id(),
  threadId: uuid()
    .notNull()
    .references(() => chatThreads.id, { onDelete: "cascade" }),
  role: text({ enum: ["user", "assistant"] }).notNull(),
  text: text().notNull(),
  actions: jsonb().$type<ChatAction[]>().notNull().default([]),
  /** Jobs the reply lists (shown as a short job list under the message). */
  jobIds: text()
    .array()
    .notNull()
    .default(sql`'{}'::text[]`),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

/** Settings → Send feedback. */
export const feedback = pgTable("feedback", {
  id: id(),
  userId: userRef(),
  kind: text({ enum: ["idea", "bug", "question"] }).notNull(),
  message: text().notNull(),
  /** The page the user was on, when they chose to include it. */
  page: text(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

/* ---------- Usage (cost guards, not billing) ---------- */

export const usageEvents = pgTable(
  "usage_events",
  {
    id: id(),
    userId: userRef(),
    kind: text({ enum: ["interview_session", "tailor", "email_sent", "search"] }).notNull(),
    at: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index().on(t.userId, t.kind, t.at)],
);
