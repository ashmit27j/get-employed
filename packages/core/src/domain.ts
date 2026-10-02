// Enumerations shared by the database, the API and the UI. Values mirror prototype/ge-data.js.
export const STAGES = ["saved", "applied", "interview", "offer", "rejected"] as const;
export type Stage = (typeof STAGES)[number];

export const STAGE_LABELS: Record<Stage, string> = {
  saved: "Saved",
  applied: "Applied",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
};

export const WORK_MODES = ["on-site", "hybrid", "remote"] as const;
export type WorkMode = (typeof WORK_MODES)[number];

export const SEARCH_FREQUENCIES = ["four-hourly", "eight-hourly", "daily"] as const;
export type SearchFrequency = (typeof SEARCH_FREQUENCIES)[number];
export const SEARCH_FREQUENCY_LABELS: Record<SearchFrequency, string> = {
  "four-hourly": "Every 4 hours",
  "eight-hourly": "Every 8 hours",
  daily: "Daily",
};
/** How often each saved search runs; 4 hours is the floor to keep scraping and AI costs down. */
export const SEARCH_FREQUENCY_MS: Record<SearchFrequency, number> = {
  "four-hourly": 4 * 3_600_000,
  "eight-hourly": 8 * 3_600_000,
  daily: 24 * 3_600_000,
};

/** Where a saved search runs: the worker ("cloud") or the open app on the user's device ("local"). */
export const SEARCH_RUN_ON = ["cloud", "local"] as const;
export type SearchRunOn = (typeof SEARCH_RUN_ON)[number];

/** When to tell the user about new matches. */
export const SEARCH_NOTIFY = ["each", "digest", "off"] as const;
export type SearchNotify = (typeof SEARCH_NOTIFY)[number];

export const EMAIL_STATUSES = [
  "draft",
  "approved",
  "sent",
  "opened",
  "replied",
  "bounced",
] as const;
export type EmailStatus = (typeof EMAIL_STATUSES)[number];

/** What an inbox message is about (the Inbox filter tabs). */
export const INBOX_KINDS = ["interview", "reply", "recruiter", "update"] as const;
export type InboxKind = (typeof INBOX_KINDS)[number];

/** A file sent with an outreach email: one of the user's resumes, or an uploaded document. */
export interface EmailAttachment {
  name: string;
  resumeId?: string;
  /** Storage key for uploaded documents. */
  key?: string;
}

export const CONTACT_STATUSES = ["found", "searching", "none"] as const;
export type ContactStatus = (typeof CONTACT_STATUSES)[number];

export const INTERVIEW_TYPES = ["technical", "behavioural"] as const;
export const INTERVIEW_FORMATS = ["voice", "typed", "mcq"] as const;
export const STT_ENGINES = ["webspeech", "whisper", "typed"] as const;

export const RUBRIC = ["communication", "technical", "structure", "confidence"] as const;
export type RubricKey = (typeof RUBRIC)[number];
export const RUBRIC_LABELS: Record<RubricKey, string> = {
  communication: "Communication",
  technical: "Technical accuracy",
  structure: "Structure",
  confidence: "Confidence",
};

export const JOB_SOURCE_KEYS = ["linkedin", "greenhouse", "lever", "ashby", "adzuna"] as const;
export type JobSourceKey = (typeof JOB_SOURCE_KEYS)[number];

/** Background job names handled by apps/worker (pg-boss queues). */
export const QUEUES = [
  "ingest.search",
  "ingest.refresh-saved",
  "ingest.cleanup",
  "match.compute",
  "contact.find",
  "email.draft",
  "email.send",
  "email.track",
  "resume.parse",
  "resume.tailor",
  "resume.compile",
  "profile.import-linkedin",
  "profile.import-github",
  "interview.grade",
] as const;
export type QueueName = (typeof QUEUES)[number];

/** Resume templates (TEMPLATES in prototype/ge-app.js). Layout details live in the app's ResumePaper. */
export const RESUME_TEMPLATES = [
  {
    id: "classic",
    name: "Classic",
    desc: "Centered header and ruled sections. Parses cleanly in every ATS.",
  },
  {
    id: "latex",
    name: "LaTeX",
    desc: "Serif type and small-caps headings, in the style of common LaTeX CVs.",
  },
  {
    id: "compact",
    name: "Compact",
    desc: "Tighter spacing to fit more projects and skills on one page.",
  },
  {
    id: "modern",
    name: "Modern",
    desc: "Left-aligned header and quiet headings for experienced profiles.",
  },
] as const;
export type ResumeTemplate = (typeof RESUME_TEMPLATES)[number]["id"];
export const templateName = (id: string) =>
  RESUME_TEMPLATES.find((t) => t.id === id)?.name ?? "Classic";
