import { execSync } from "node:child_process";

// Tests change the demo account (saved jobs, profile skills, email approvals), so every run
// starts from a fresh seed, with only the seed's jobs (ingested ones would change the lists).
export default function globalSetup() {
  execSync("pnpm --filter @ge/db db:seed -- --reset-jobs", { stdio: "inherit" });
}
