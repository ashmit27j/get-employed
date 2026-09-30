import { PgBoss } from "pg-boss";
import { QUEUES } from "@ge/core";
import { loadRootEnv } from "@ge/db/load-env";
import { createCtx } from "./ctx";
import { parseWorkerEnv } from "./env";
import { handlers, schedules } from "./handlers";

loadRootEnv();
const env = parseWorkerEnv();

const boss = new PgBoss(env.DATABASE_URL);
boss.on("error", (err) => console.error("[worker]", err));

await boss.start();
const ctx = createCtx(env, boss);
for (const queue of QUEUES) {
  await boss.createQueue(queue, { retryLimit: 5, retryBackoff: true });
  await boss.work(queue, async (jobs) => {
    for (const job of jobs) {
      try {
        await handlers[queue](ctx, job.data);
      } catch (err) {
        console.error(`[worker] ${queue} failed`, err);
        throw err;
      }
    }
  });
}
for (const { queue, cron, data } of schedules) await boss.schedule(queue, cron, data ?? {});

console.log(
  `[worker] listening on ${QUEUES.length} queues (self-hosted: ${env.SELF_HOSTED}, AI: ${env.GOOGLE_GENERATIVE_AI_API_KEY ? "on" : "off without a key"})`,
);

const shutdown = async () => {
  await boss.stop({ graceful: true });
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
