import "server-only";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { ServerEnvSchema, blankToUndefined } from "@ge/core";

const optional = z.preprocess(blankToUndefined, z.string().optional());

/** Everything apps/app reads from the environment. Parsed once, on first use. */
const AppEnvSchema = ServerEnvSchema.extend({
  BETTER_AUTH_SECRET: z.preprocess(blankToUndefined, z.string().min(32).optional()),
  BETTER_AUTH_URL: z.preprocess(blankToUndefined, z.string().url().optional()),
  GOOGLE_CLIENT_ID: optional,
  GOOGLE_CLIENT_SECRET: optional,
  RESEND_API_KEY: optional,
  EMAIL_FROM: z.string().default("GetEmployed <no-reply@example.com>"),
  SMTP_HOST: optional,
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: optional,
  SMTP_PASSWORD: optional,
  S3_ENDPOINT: optional,
  S3_REGION: z.string().default("us-east-1"),
  S3_BUCKET: z.string().default("getemployed"),
  S3_ACCESS_KEY_ID: optional,
  S3_SECRET_ACCESS_KEY: optional,
  MAILBOX_ENCRYPTION_KEY: optional,
  /** Live interview sessions per user per month; empty means no cap (docs/interviews.md). */
  INTERVIEW_MONTHLY_SESSION_CAP: z.preprocess(
    blankToUndefined,
    z.coerce.number().int().positive().optional(),
  ),
  GOOGLE_GENERATIVE_AI_API_KEY: optional,
  LLM_MODEL: z.preprocess(blankToUndefined, z.string().default("gemini-flash-latest")),
  INTERVIEW_MODEL: z.preprocess(blankToUndefined, z.string().default("gemini-flash-latest")),
  GOOGLE_TTS_CREDENTIALS: optional,
  TTS_WAVENET_VOICE: z.string().default("en-IN-Wavenet-A"),
  TTS_STANDARD_VOICE: z.string().default("en-IN-Standard-A"),
  TTS_WAVENET_MONTHLY_LIMIT: z.preprocess(blankToUndefined, z.coerce.number().default(1_000_000)),
  TTS_STANDARD_MONTHLY_LIMIT: z.preprocess(blankToUndefined, z.coerce.number().default(4_000_000)),
  TTS_SAFETY_RATIO: z.preprocess(blankToUndefined, z.coerce.number().min(0).max(1).default(0.9)),
  SEARCH_FRESHNESS_MINUTES: z.preprocess(blankToUndefined, z.coerce.number().default(60)),
  S3_FORCE_PATH_STYLE: z
    .enum(["true", "false"])
    .default("true")
    .transform((v) => v === "true"),
});
export type AppEnv = z.infer<typeof AppEnvSchema>;

/**
 * The repo-root .env (instrumentation.ts loads it at boot). `next dev` resets process.env whenever
 * the route list changes (it force-reloads env files from apps/app only), so load it again if the
 * variables have gone. Existing variables win, so hosted environments are unaffected.
 */
function ensureRootEnv() {
  if (process.env.DATABASE_URL !== undefined) return;
  const file = join(process.cwd(), "../../.env");
  if (existsSync(file)) process.loadEnvFile(file);
}

let cached: AppEnv | undefined;
export function env(): AppEnv {
  if (cached) return cached;
  ensureRootEnv();
  const parsed = AppEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Invalid environment for apps/app:\n${issues}`);
  }
  if (parsed.data.NODE_ENV === "production" && !parsed.data.BETTER_AUTH_SECRET) {
    throw new Error("BETTER_AUTH_SECRET is required in production.");
  }
  cached = parsed.data;
  return cached;
}

export const googleEnabled = () => !!(env().GOOGLE_CLIENT_ID && env().GOOGLE_CLIENT_SECRET);
