// Run one handler once, outside the queue: `pnpm --filter @ge/worker run-job ingest.search '{"force":true}'`.
import { PgBoss } from "pg-boss";
import type { QueueName } from "@ge/core";
import { loadRootEnv } from "@ge/db/load-env";
import { createCtx } from "../src/ctx";
import { parseWorkerEnv } from "../src/env";
import { handlers } from "../src/handlers";

loadRootEnv();
const env = parseWorkerEnv();
const boss = new PgBoss(env.DATABASE_URL);
await boss.start();
const [queue, json] = process.argv.slice(2);
const started = Date.now();
await handlers[queue as QueueName](createCtx(env, boss), JSON.parse(json ?? "{}"));
console.log(`[run] ${queue} done in ${((Date.now() - started) / 1000).toFixed(1)}s`);
await boss.stop({ graceful: false });
process.exit(0);
