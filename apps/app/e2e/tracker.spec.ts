import { expect, test } from "@playwright/test";
import { shot, signIn } from "./helpers";

test("Tracker groups applications by stage and moves them", async ({ page }) => {
  await signIn(page, "/tracker");
  await expect(page.getByRole("heading", { level: 1, name: "Application tracker" })).toBeVisible();
  await expect(page.getByText("Round 1 · Sep 29, 11:00", { exact: true })).toBeVisible();
  // Active hides the rejected Juspay application; Closed shows only it.
  await expect(page.getByText("Backend Engineer", { exact: true })).toHaveCount(0);
  await page.getByRole("tab", { name: "Closed" }).click();
  await expect(page.getByText("Backend Engineer", { exact: true })).toBeVisible();
  await expect(page.getByText("Closed", { exact: true }).last()).toBeAttached();
  await page.getByRole("tab", { name: "Active" }).click();
  await shot(page, "tracker");

  // Move Postman from Saved to Applied; it survives a reload.
  await page.getByRole("button", { name: /Stage for Software Engineer, API/ }).click();
  await page.getByRole("option", { name: "Applied" }).click();
  await expect(page.getByText("Postman · Moved just now")).toBeVisible();
  await page.waitForTimeout(500);
  await page.reload();
  await expect(
    page.getByRole("button", { name: /Stage for Software Engineer, API/ }),
  ).toContainText("Applied");
});

test("Alerts can be added and marked done", async ({ page }) => {
  await signIn(page, "/tracker");
  await expect(page.getByText("Submit take-home")).toBeVisible();
  await expect(page.getByText("Respond to offer")).toBeVisible();

  await page.getByRole("button", { name: "Add alert" }).click();
  const dialog = page.getByRole("dialog", { name: "Add a custom alert" });
  await expect(dialog.getByRole("button", { name: "Add alert" })).toBeDisabled();
  await dialog.getByLabel("Alert").fill("Follow up with recruiter at CRED");
  await dialog.getByRole("button", { name: "Add alert" }).click();
  await expect(page.getByText("Follow up with recruiter at CRED")).toBeVisible();
  await expect(page.getByText("Just added")).toBeVisible();

  await page.getByRole("button", { name: "Mark “Follow up with recruiter at CRED” done" }).click();
  await expect(page.getByText("Follow up with recruiter at CRED")).toHaveCount(0);
  await page.waitForTimeout(500);
  await page.reload();
  await expect(page.getByText("Submit take-home")).toBeVisible();
  await expect(page.getByText("Follow up with recruiter at CRED")).toHaveCount(0);
});
