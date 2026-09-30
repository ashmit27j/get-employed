import { PgBoss } from "pg-boss";
import { QUEUES, parseServerEnv } from "@ge/core";
import { loadRootEnv } from "@ge/db/load-env";
import { handlers, schedules } from "./handlers";

loadRootEnv();
const env = parseServerEnv();

const boss = new PgBoss(env.DATABASE_URL);
boss.on("error", (err) => console.error("[worker]", err));

await boss.start();
for (const queue of QUEUES) {
  await boss.createQueue(queue, { retryLimit: 5, retryBackoff: true });
  await boss.work(queue, async (jobs) => {
    for (const job of jobs) await handlers[queue](job.data);
  });
}
for (const { queue, cron } of schedules) await boss.schedule(queue, cron);

console.log(`[worker] listening on ${QUEUES.length} queues (self-hosted: ${env.SELF_HOSTED})`);

const shutdown = async () => {
  await boss.stop({ graceful: true });
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
