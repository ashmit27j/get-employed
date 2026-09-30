import "server-only";
import { PgBoss } from "pg-boss";
import type { QueueName } from "@ge/core";
import { env } from "./env";

let boss: Promise<PgBoss> | undefined;

/** Producer-only pg-boss client: sends jobs, never works or schedules them (apps/worker does). */
function producer(): Promise<PgBoss> {
  boss ??= (async () => {
    const b = new PgBoss({
      connectionString: env().DATABASE_URL,
      supervise: false,
      schedule: false,
    });
    b.on("error", (err) => console.error("[queue]", err));
    await b.start();
    return b;
  })().catch((err: unknown) => {
    boss = undefined;
    throw err;
  });
  return boss;
}

/** Enqueue a background job. `singletonKey` makes the call idempotent while a job is pending. */
export async function enqueue(
  queue: QueueName,
  data: object,
  options: { singletonKey?: string; startAfterSeconds?: number } = {},
) {
  const b = await producer();
  await b.createQueue(queue);
  return b.send(queue, data, {
    singletonKey: options.singletonKey,
    startAfter: options.startAfterSeconds,
    retryLimit: 5,
    retryBackoff: true,
  });
}
