import type { Page } from "@playwright/test";

// Demo account from packages/db/src/seed.ts (password: SEED_PASSWORD, default below).
const DEMO = {
  username: "ashmit",
  password: process.env.SEED_PASSWORD ?? "getemployed-demo",
};

/** Optional screenshots for reviewing layouts: set E2E_SHOTS to a folder. */
export async function shot(page: Page, name: string) {
  if (!process.env.E2E_SHOTS) return;
  await page.waitForTimeout(Number(process.env.E2E_SHOT_WAIT ?? 1500)); // let transitions finish
  await page.screenshot({
    path: `${process.env.E2E_SHOTS}/${name}.png`,
    fullPage: !!process.env.E2E_FULL,
  });
}

export async function signIn(page: Page, next = "/jobs") {
  await page.goto(`/signin?next=${encodeURIComponent(next)}`);
  await page.getByLabel("Username or email").fill(DEMO.username);
  await page.getByLabel("Password", { exact: true }).first().fill(DEMO.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL(`**${next}`);
}
