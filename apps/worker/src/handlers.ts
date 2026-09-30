import type { QueueName } from "@ge/core";

export type Handler = (data: unknown) => Promise<void>;

const notYet =
  (queue: QueueName): Handler =>
  async () => {
    // Phase 6 wires each queue (docs/roadmap.md). Until then jobs complete as no-ops.
    console.warn(`[worker] ${queue}: handler not implemented yet`);
  };

/** One handler per queue in QUEUES. The Record type makes a missing queue a compile error. */
export const handlers: Record<QueueName, Handler> = {
  "ingest.search": notYet("ingest.search"),
  "ingest.refresh-saved": notYet("ingest.refresh-saved"),
  "match.compute": notYet("match.compute"),
  "contact.find": notYet("contact.find"),
  "email.draft": notYet("email.draft"),
  "email.send": notYet("email.send"),
  "email.track": notYet("email.track"),
  "resume.parse": notYet("resume.parse"),
  "resume.tailor": notYet("resume.tailor"),
  "resume.compile": notYet("resume.compile"),
  "profile.import-linkedin": notYet("profile.import-linkedin"),
  "profile.import-github": notYet("profile.import-github"),
  "interview.grade": notYet("interview.grade"),
};

/** Cron schedules (UTC). */
export const schedules: { queue: QueueName; cron: string }[] = [
  { queue: "ingest.refresh-saved", cron: "0 * * * *" },
];
