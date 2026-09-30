import { expect, test } from "@playwright/test";

test("home has one stable headline and the main calls to action", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveAccessibleName(
    "Unemployed? Get employed and skip the legwork.",
  );
  await expect(page.getByRole("link", { name: "Get started" }).first()).toHaveAttribute(
    "href",
    "/signup",
  );
  await expect(page.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/signin");
  await expect(page).toHaveTitle(/GetEmployed/);
});

test("the hero search parses what you type into filters", async ({ page }) => {
  await page.goto("/");
  const input = page.getByRole("textbox", { name: "Describe the job you want" });
  await input.click();
  await input.fill("Backend roles in Pune, 12 LPA+, 2 years of Go");
  const filters = page.locator("[aria-live=polite]").filter({ hasText: "FILTERS" });
  // Each chip is "<category> <value>", e.g. "Role Backend".
  for (const [category, value] of [
    ["Role", "Backend"],
    ["Skill", "Go"],
    ["Location", "Pune"],
    ["Salary", "≥ ₹12 LPA"],
    ["Experience", "2+ yrs"],
  ]) {
    await expect(filters.getByText(`${category}${value}`, { exact: true })).toBeVisible();
  }
});

test("pricing switches between monthly and yearly", async ({ page }) => {
  await page.goto("/");
  // The top nav's Pricing link scrolls to the section on the home page (no separate page).
  await expect(page.locator('a[href="/#pricing"]').first()).toBeAttached();
  await page.goto("/#pricing");
  await expect(page.getByText("₹299")).toBeVisible();
  await page.getByRole("tab", { name: "Monthly" }).click();
  await expect(page.getByText("₹399")).toBeVisible();
  await expect(page.getByText("Billed monthly · cancel any time")).toBeVisible();
});

test("FAQ rows expand one at a time", async ({ page }) => {
  await page.goto("/");
  const q = page.getByRole("button", { name: "Will it send emails without asking me?" });
  await q.click();
  await expect(q).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("button", { name: "Is it free?" })).toHaveAttribute(
    "aria-expanded",
    "false",
  );
});

test("anchors and pages exist", async ({ page, request }) => {
  await page.goto("/");
  await expect(page.locator("#how")).toHaveCount(1);
  await expect(page.locator("#selfhost")).toHaveCount(1);
  await expect(page.locator("#pricing")).toHaveCount(1);
  await expect(page.locator('a[href="/changelog"]')).toHaveCount(0);
  expect((await request.get("/sitemap.xml")).ok()).toBe(true);
  expect((await request.get("/robots.txt")).ok()).toBe(true);
});

test("no horizontal scroll, and nav links collapse on small screens", async ({
  page,
  isMobile,
}) => {
  await page.goto("/");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  const nav = page.getByRole("navigation", { name: "Main" });
  if (isMobile) await expect(nav).toBeHidden();
  else await expect(nav).toBeVisible();
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });
  test("the hero shows an example without typing it out", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("textbox", { name: "Describe the job you want" })).toHaveValue(
      "React internships in Bengaluru, remote-friendly",
    );
  });
});
