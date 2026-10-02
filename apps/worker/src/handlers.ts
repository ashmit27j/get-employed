import type { QueueName } from "@ge/core";
import type { Ctx } from "./ctx";
import { cleanup, ingestSearch, refreshSaved } from "./ingest/handlers";
import { computeMatches } from "./match";
import { draftFollowUps, findContact, sendEmail, writeDraft } from "./outreach";
import { gradeSessionJob } from "./interview";
import { importGithub, importLinkedin } from "./profiles";
import { compileResumeJob, parseResumeJob, tailorResumeJob } from "./resume";

export type Handler = (ctx: Ctx, data: unknown) => Promise<void>;

/** One handler per queue in QUEUES. The Record type makes a missing queue a compile error. */
export const handlers: Record<QueueName, Handler> = {
  "ingest.search": ingestSearch,
  "ingest.refresh-saved": (ctx) => refreshSaved(ctx),
  "ingest.cleanup": (ctx) => cleanup(ctx),
  "match.compute": computeMatches,
  "contact.find": findContact,
  "email.draft": writeDraft,
  "email.send": sendEmail,
  "email.track": (ctx) => draftFollowUps(ctx),
  "resume.parse": parseResumeJob,
  "resume.tailor": tailorResumeJob,
  "resume.compile": compileResumeJob,
  "profile.import-linkedin": importLinkedin,
  "profile.import-github": importGithub,
  "interview.grade": gradeSessionJob,
};

/** Cron schedules (UTC). */
export const schedules: { queue: QueueName; cron: string; data?: object }[] = [
  { queue: "ingest.refresh-saved", cron: "0 * * * *" },
  // Company boards refresh even when nobody searches, so the feed stays current.
  { queue: "ingest.search", cron: "30 */4 * * *", data: {} },
  { queue: "ingest.cleanup", cron: "15 3 * * *" },
  { queue: "email.track", cron: "0 4 * * *" },
];
