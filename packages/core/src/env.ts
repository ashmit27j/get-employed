import { z } from "zod";

/** `KEY=` in .env means "not set". */
export const blankToUndefined = (v: unknown) => (v === "" ? undefined : v);
const optionalString = (schema: z.ZodString) => z.preprocess(blankToUndefined, schema.optional());

const bool = z
  .enum(["true", "false"])
  .default("false")
  .transform((v) => v === "true");

/** Server-side env shared by apps/app and apps/worker. Each app validates only what it reads. */
export const ServerEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  SELF_HOSTED: bool,
  DATABASE_URL: z.string().url(),
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:4000"),
  SCRAPER_URL: z.string().url().default("http://localhost:8000"),
  SCRAPER_SHARED_SECRET: optionalString(z.string().min(16)),
  LINKEDIN_SCRAPING_ENABLED: bool,
});
export type ServerEnv = z.infer<typeof ServerEnvSchema>;

export function parseServerEnv(
  source: Record<string, string | undefined> = process.env,
): ServerEnv {
  const result = ServerEnvSchema.safeParse(source);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Invalid environment:\n${issues}`);
  }
  return result.data;
}
