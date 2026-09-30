import { z } from "zod";
import { ServerEnvSchema, blankToUndefined } from "@ge/core";

const optional = z.preprocess(blankToUndefined, z.string().optional());
const num = (d: number) => z.preprocess(blankToUndefined, z.coerce.number().default(d));

/** Everything apps/worker reads from the environment (see .env.example). */
export const WorkerEnvSchema = ServerEnvSchema.extend({
  BETTER_AUTH_SECRET: optional,
  MAILBOX_ENCRYPTION_KEY: optional,
  GOOGLE_GENERATIVE_AI_API_KEY: optional,
  LLM_MODEL: z.preprocess(blankToUndefined, z.string().default("gemini-flash-latest")),
  INTERVIEW_MODEL: z.preprocess(blankToUndefined, z.string().default("gemini-flash-latest")),
  GOOGLE_CLIENT_ID: optional,
  GOOGLE_CLIENT_SECRET: optional,
  SMTP_HOST: optional,
  SMTP_PORT: num(587),
  SMTP_USER: optional,
  SMTP_PASSWORD: optional,
  S3_ENDPOINT: optional,
  S3_REGION: z.string().default("us-east-1"),
  S3_BUCKET: z.string().default("getemployed"),
  S3_ACCESS_KEY_ID: optional,
  S3_SECRET_ACCESS_KEY: optional,
  S3_FORCE_PATH_STYLE: z
    .enum(["true", "false"])
    .default("true")
    .transform((v) => v === "true"),
  ADZUNA_APP_ID: optional,
  ADZUNA_APP_KEY: optional,
  GITHUB_TOKEN: optional,
  SEARCH_FRESHNESS_MINUTES: num(60),
  /** Days without being seen before an open job is closed. */
  JOB_STALE_DAYS: num(21),
  /** Path to the Tectonic binary for resume.compile; unset means "tectonic" on PATH. */
  TECTONIC_BIN: optional,
});
export type WorkerEnv = z.infer<typeof WorkerEnvSchema>;

export function parseWorkerEnv(
  source: Record<string, string | undefined> = process.env,
): WorkerEnv {
  const r = WorkerEnvSchema.safeParse(source);
  if (!r.success) {
    const issues = r.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Invalid environment for apps/worker:\n${issues}`);
  }
  return r.data;
}
