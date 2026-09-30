import { defineConfig, devices } from "@playwright/test";

// Needs Postgres + storage (`docker compose up -d`), migrations and the seed (`pnpm db:migrate && pnpm db:seed`).
// Uses a running dev server on :4000 locally, or starts `next start` after `pnpm build` in CI.
export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  timeout: 60_000,
  use: { baseURL: "http://localhost:4000", trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] }, grepInvert: /@mobile/ },
    { name: "mobile", use: { ...devices["Pixel 7"] }, grep: /@mobile/ },
    // The marketing pages run in full on a phone too.
    { name: "site-mobile", use: { ...devices["Pixel 7"] }, testMatch: /site\.spec\.ts/ },
  ],
  webServer: {
    command: process.env.CI ? "pnpm start" : "pnpm dev",
    url: "http://localhost:4000/api/health",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
