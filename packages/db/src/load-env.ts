import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** Loads the repo-root .env into process.env for scripts run outside Next.js. Existing vars win. */
export function loadRootEnv(): void {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
  const file = resolve(root, ".env");
  if (existsSync(file)) process.loadEnvFile(file);
}
