import { eq } from "drizzle-orm";
import type { PgBoss } from "pg-boss";
import type { LanguageModel } from "ai";
import { languageModel } from "@ge/ai";
import type { QueueName } from "@ge/core";
import { keyFrom, open } from "@ge/core/secret-box";
import { createDb, schema, type Database } from "@ge/db";
import { createStorage, type Storage } from "@ge/db/storage";
import type { WorkerEnv } from "./env";

/** What every handler needs. Built once in index.ts; tests pass their own. */
export interface Ctx {
  env: WorkerEnv;
  db: Database;
  storage: Storage;
  /** Key that seals mailbox credentials and users' own LLM keys. */
  secretKey: Buffer;
  /** Queue another job (idempotent by singletonKey), optionally not before `startAfter`. */
  send: (
    queue: QueueName,
    data: object,
    singletonKey?: string,
    startAfter?: Date,
  ) => Promise<unknown>;
  /** The LLM for a user's work: their own key when saved, else the deployment's; null without either. */
  llm: (userId: string | null, which?: "default" | "interview") => Promise<LanguageModel | null>;
  log: (...args: unknown[]) => void;
}

export function createCtx(env: WorkerEnv, boss: PgBoss): Ctx {
  const db = createDb(env.DATABASE_URL);
  const secretKey = keyFrom(
    env.MAILBOX_ENCRYPTION_KEY,
    env.NODE_ENV === "production" ? undefined : (env.BETTER_AUTH_SECRET ?? "dev-only"),
  );
  return {
    env,
    db,
    storage: createStorage({
      endpoint: env.S3_ENDPOINT,
      region: env.S3_REGION,
      bucket: env.S3_BUCKET,
      accessKeyId: env.S3_ACCESS_KEY_ID,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY,
      forcePathStyle: env.S3_FORCE_PATH_STYLE,
    }),
    secretKey,
    send: (queue, data, singletonKey, startAfter) =>
      boss.send(queue, data, { singletonKey, startAfter, retryLimit: 5, retryBackoff: true }),
    llm: async (userId, which = "default") => {
      let apiKey = env.GOOGLE_GENERATIVE_AI_API_KEY;
      if (userId) {
        const [row] = await db
          .select({ llmKey: schema.userSettings.llmKey })
          .from(schema.userSettings)
          .where(eq(schema.userSettings.userId, userId));
        if (row?.llmKey) apiKey = open(row.llmKey, secretKey);
      }
      return languageModel({
        apiKey,
        model: which === "interview" ? env.INTERVIEW_MODEL : env.LLM_MODEL,
      });
    },
    log: (...args) => console.log("[worker]", ...args),
  };
}

/** Run an LLM step; on any failure log it and use the rule-based value instead. */
export async function withFallback<T>(
  ctx: Ctx,
  label: string,
  model: LanguageModel | null,
  ai: (m: LanguageModel) => Promise<T>,
  rules: () => T | Promise<T>,
): Promise<T> {
  if (model) {
    try {
      return await ai(model);
    } catch (err) {
      ctx.log(`${label}: LLM failed, using rules`, err instanceof Error ? err.message : err);
    }
  }
  return rules();
}
