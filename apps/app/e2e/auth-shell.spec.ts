import { expect, test } from "@playwright/test";
import { shot, signIn } from "./helpers";

test("signed-out visitors are sent to sign in, keeping where they were going", async ({ page }) => {
  await page.goto("/tracker");
  await expect(page).toHaveURL(/\/signin\?next=%2Ftracker/);
  await shot(page, "signin");
});

test("a wrong password offers a reset", async ({ page }) => {
  await page.goto("/signin");
  await page.getByLabel("Username or email").fill("someone@example.com");
  await page.getByLabel("Password", { exact: true }).first().fill("not-the-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByText("That username or password didn't match.")).toBeVisible();
  await page.getByRole("link", { name: "Forgot password?" }).click();
  await expect(page).toHaveURL(/\/reset\?email=someone%40example.com/);
  await expect(page.getByRole("heading", { name: "Check your inbox." })).toBeVisible();
  await expect(page.getByText("som****@example.com")).toBeVisible();
  await shot(page, "reset");
});

test("the demo user signs in to the app shell", async ({ page }) => {
  await signIn(page);
  const nav = page.getByRole("navigation", { name: "Workspace" });
  await expect(nav.getByRole("link", { name: "Job board" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(nav.getByRole("link", { name: /Mailbox/ })).toContainText("4");
  await expect(page.getByRole("button", { name: "Ask assistant" })).toBeVisible();
  await shot(page, "shell");

  // AI tab lists chats: the seed's pinned one (other specs may add recents).
  await page.getByRole("tab", { name: "AI" }).click();
  await expect(page.getByRole("link", { name: "Job hunt, week of Sep 22" }).first()).toBeVisible();
  await page.getByRole("tab", { name: "Home" }).click();

  // Ctrl+B collapses and restores the sidebar.
  await page.keyboard.press("Control+b");
  await expect(page.getByRole("button", { name: "Show sidebar" })).toBeVisible();
  await page.getByRole("button", { name: "Show sidebar" }).click();
  await expect(page.getByRole("button", { name: "Collapse sidebar" })).toBeVisible();

  // The assistant dock opens from the top bar and closes again.
  await page.getByRole("button", { name: "Ask assistant" }).click();
  await expect(page.getByRole("complementary", { name: "Assistant" })).toBeVisible();
  await shot(page, "dock");
  await page.getByRole("button", { name: "Close assistant" }).click();
  // Opening the dock collapsed the sidebar to make room (prototype behaviour); bring it back.
  await page.getByRole("button", { name: "Show sidebar" }).click();

  // Log out from the account menu.
  await page.getByTitle("Account menu").click();
  await page.getByRole("menuitem", { name: "Log out" }).click();
  await page.waitForURL("**/signin");
});

test("a new account fills in its Job Profile to unlock the app", async ({ page }) => {
  const email = `e2e-${Date.now()}@example.com`;
  await page.goto("/signup");
  await page.getByLabel("Full name").fill("Test Candidate");
  await page.getByLabel("Email", { exact: true }).fill(email);
  const password = page.getByLabel("Password", { exact: true }).last();
  await password.fill("weakpass");
  await expect(page.getByText("An uppercase letter")).toBeVisible();
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText(/^Use at least 8 characters with an uppercase letter/)).toBeVisible();
  await password.fill("Str0ng!pass");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL("**/profile");

  // Welcome hint; the rest of the app is locked until the profile is saved at 30%.
  const welcome = page.getByRole("dialog", { name: /Welcome, Test/ });
  await expect(welcome).toBeVisible();
  await shot(page, "onboarding-welcome");
  await welcome.getByRole("button", { name: "Start filling it in" }).click();
  await expect(
    page.getByText("Finish your Job Profile to unlock the rest of the app."),
  ).toBeVisible();
  await page.goto("/jobs");
  await expect(page).toHaveURL(/\/profile$/);

  await page.getByLabel("Headline").fill("Final-year computer science student");
  await page.getByLabel("Phone").fill("+91 90000 00000");
  await page.getByLabel("Current city").fill("Pune");
  await page.getByLabel("Target roles").fill("Backend engineer");
  await page.getByLabel("Preferred locations").fill("Pune, Bengaluru");

  // Reaching the bottom with enough filled in offers to save and unlock.
  await page.getByText("Voluntary disclosures", { exact: true }).scrollIntoViewIfNeeded();
  await page.mouse.wheel(0, 4000);
  const ready = page.getByRole("dialog", { name: "Your profile is ready to save" });
  await expect(ready).toBeVisible();
  await ready.getByRole("button", { name: "Save profile" }).click();
  const done = page.getByRole("dialog", { name: "You're all set" });
  await expect(done).toBeVisible({ timeout: 10_000 });
  await done.getByRole("button", { name: "Go to the job board" }).click();
  await page.waitForURL("**/jobs");
  await expect(page.getByRole("heading", { name: "Find your next role" })).toBeVisible();
});

test("mobile uses the tab bar and drawer @mobile", async ({ page }) => {
  await signIn(page);
  const bar = page.getByRole("navigation", { name: "Primary" });
  await expect(bar.getByRole("link", { name: "Jobs" })).toHaveAttribute("aria-current", "page");
  await bar.getByRole("button", { name: "More" }).click();
  await expect(page.getByRole("complementary", { name: "Navigation" })).toBeVisible();
  await shot(page, "mobile-drawer");
  await page.getByRole("button", { name: "Close menu" }).click();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
