import { expect, test } from "@playwright/test";
import { shot, signIn } from "./helpers";

// Settings open as a dialog over the current page, addressed by #settings/<section>.
const dialog = (page: import("@playwright/test").Page) => page.getByRole("dialog").first();

test("Settings saves preferences and filters the feed by minimum match", async ({ page }) => {
  await signIn(page, "/jobs");
  await page.goto("/jobs#settings/general");
  await expect(dialog(page).getByText("Minimum match score", { exact: true })).toBeVisible();
  await shot(page, "settings-general");

  await page.getByRole("button", { name: /Minimum match/ }).click();
  await page.getByRole("option", { name: "80 and above" }).click();
  await page.getByRole("switch", { name: "Weekly summary" }).click();
  await page.waitForTimeout(500);
  await page.reload();
  // The dialog reopens from the hash and loads its data again.
  await expect(page.getByRole("button", { name: /Minimum match/ })).toContainText("80 and above", {
    timeout: 15_000,
  });
  await expect(page.getByRole("switch", { name: "Weekly summary" })).toHaveAttribute(
    "aria-checked",
    "true",
  );

  // Close with Escape; roles scoring under 80 are hidden from Discover.
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.goto("/jobs");
  await expect(page.getByRole("button", { name: /Backend Engineer I/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Data Engineer I/ })).toHaveCount(0);

  // Put it back for the other tests.
  await page.goto("/jobs#settings/general");
  await page.getByRole("button", { name: /Minimum match/ }).click();
  await page.getByRole("option", { name: "60 and above" }).click();
  await page.waitForTimeout(500);
});

test("Settings opens from the menu and shortcut, searches, and switches theme", async ({
  page,
}) => {
  await signIn(page, "/tracker");
  await page.keyboard.press("Control+,");
  await expect(dialog(page).getByRole("heading", { level: 1, name: "General" })).toBeVisible();
  await dialog(page).getByRole("tab", { name: "Light" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await dialog(page).getByRole("tab", { name: "Dark" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  await dialog(page).getByLabel("Search settings").fill("smtp");
  await expect(dialog(page).getByRole("link", { name: "Mailbox" })).toBeVisible();
  await expect(dialog(page).getByRole("link", { name: "General" })).toHaveCount(0);
  await dialog(page).getByRole("link", { name: "Mailbox" }).click();
  await expect(page).toHaveURL(/\/tracker#settings\/mailbox$/);
  await expect(page.getByText("No mailbox connected.", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Connect with SMTP" }).click();
  await expect(page.getByLabel("SMTP server")).toBeVisible();
  await page.getByRole("button", { name: "Close settings" }).click();
  await expect(page).toHaveURL(/\/tracker$/);

  await page.goto("/settings?tab=usage");
  await expect(page).toHaveURL(/\/jobs#settings\/usage$/);
  await expect(page.getByRole("heading", { name: "Usage" })).toBeVisible();
  await expect(page.getByText("Saved searches")).toBeVisible();

  await page.goto("/jobs#settings/feedback");
  const fb = page.getByRole("dialog", { name: "Send feedback" });
  await fb.getByRole("tab", { name: "Bug" }).click();
  await fb.getByLabel("What happened?").fill("The digest arrived twice.");
  await fb.getByRole("button", { name: "Send feedback" }).click();
  await expect(page.getByRole("dialog", { name: "Feedback sent" })).toBeVisible();
});

test("Account shows sessions, saves the name and exports data", async ({ page }) => {
  await signIn(page, "/jobs");
  await page.goto("/jobs#settings/account");
  await expect(dialog(page).getByRole("heading", { level: 1, name: "Account" })).toBeVisible();
  await expect(page.getByText("This device")).toBeVisible();
  await shot(page, "account");

  await page.getByLabel("What should we call you?").fill("Ash");
  await page.waitForTimeout(1000);
  await page.reload();
  await expect(page.getByLabel("What should we call you?")).toHaveValue("Ash", { timeout: 15_000 });

  const download = page.waitForEvent("download");
  await page.getByRole("link", { name: "Export" }).click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/^getemployed-export-\d{4}-\d{2}-\d{2}\.json$/);
});

test("A new account can delete itself", async ({ page }) => {
  await page.goto("/signup");
  await page.getByLabel("Full name").fill("Delete Me");
  await page.getByLabel("Email", { exact: true }).fill(`e2e-delete-${Date.now()}@example.com`);
  await page.getByLabel("Password", { exact: true }).last().fill("Str0ng!pass");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL("**/profile");
  await page.getByRole("button", { name: "Start filling it in" }).click();

  // Settings work while the rest of the app is still locked.
  await page.goto("/profile#settings/account");
  await page.getByRole("button", { name: "Delete account" }).click();
  const confirmDialog = page.getByRole("dialog", { name: "Delete your account?" });
  const confirm = confirmDialog.getByRole("button", { name: "Delete account" });
  await confirmDialog.getByLabel("Password", { exact: true }).fill("Str0ng!pass");
  await expect(confirm).toBeDisabled();
  await confirmDialog.getByLabel("Type DELETE to confirm").fill("DELETE");
  await confirm.click();
  await page.waitForURL("**/signin");
  await page.goto("/jobs");
  await expect(page).toHaveURL(/\/signin/);
});
