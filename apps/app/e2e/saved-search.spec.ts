import { expect, test } from "@playwright/test";
import { shot, signIn } from "./helpers";

const QUERY = "Backend roles in Bengaluru, 12 LPA+, Go or Node";

test("A saved search lists its matches and polling settings", async ({ page }) => {
  await signIn(page, "/jobs?board=Saved");
  await page.getByText(QUERY).click();
  await expect(page).toHaveURL(/\/jobs\/searches\//);
  await expect(page.getByRole("heading", { level: 1, name: "Saved search" })).toBeVisible();
  await expect(page.getByLabel("Edit search")).toHaveValue(QUERY);
  await expect(page.getByText("6 jobs · 6 new")).toBeVisible();
  await expect(page.getByRole("link", { name: /Backend Engineer I/ })).toBeVisible();
  await expect(page.getByText(/Watching · next check in/)).toBeVisible();
  await shot(page, "saved-search");

  // Settings persist across a reload.
  await page.getByRole("tab", { name: "6 hours" }).click();
  await page.getByRole("radio", { name: /Local/ }).click();
  await page.getByRole("tab", { name: "Daily digest" }).click();
  await expect(page.getByText(/on this device/)).toBeVisible();
  await page.waitForTimeout(500);
  await page.reload();
  await expect(page.getByRole("tab", { name: "6 hours" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("radio", { name: /Local/ })).toHaveAttribute("aria-checked", "true");
  await expect(page.getByRole("tab", { name: "Daily digest" })).toHaveAttribute(
    "aria-selected",
    "true",
  );

  // Pausing hides the new badges.
  await page.getByRole("switch", { name: "Active" }).click();
  await expect(page.getByText("Turn the search back on to resume checks.")).toBeVisible();
  await expect(page.getByText("6 jobs", { exact: true })).toBeVisible();
  await page.getByRole("switch", { name: "Active" }).click();
  await expect(page.getByText("6 jobs · 6 new")).toBeVisible();
});

test("Deleting a saved search offers undo", async ({ page }) => {
  await signIn(page, "/jobs?board=Saved");
  await page.getByText("Security internships in Mumbai or Pune").click();
  await page.getByRole("button", { name: "Delete search" }).click();
  await expect(page).toHaveURL(/board=Saved&deleted=/);
  await expect(page.getByText("Deleted “Security internships in Mumbai or Pune”")).toBeVisible();
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(page.getByText("Security internships in Mumbai or Pune")).toBeVisible();
});
