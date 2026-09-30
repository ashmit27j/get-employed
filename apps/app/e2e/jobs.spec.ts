import { expect, test } from "@playwright/test";
import { shot, signIn } from "./helpers";

test("Discover lists scored jobs that expand, filter and save", async ({ page }) => {
  await signIn(page);
  const razorpay = page.getByRole("button", { name: /Backend Engineer I/ });
  await expect(razorpay.getByRole("img", { name: "Match 92 of 100" })).toBeVisible();
  await shot(page, "jobs-discover");

  await razorpay.click();
  await expect(
    page.getByText("Your Go and Kafka projects cover 4 of 5 listed requirements."),
  ).toBeVisible();
  await expect(page.getByText("Ananya Krishnan · Engineering Manager, Payments")).toBeVisible();
  await shot(page, "jobs-expanded");

  await page.getByLabel("Search jobs").fill("zepto");
  await expect(page.getByText("1 role", { exact: true })).toBeVisible();
  await page.getByLabel("Search jobs").fill("");

  // Save toggles the bookmark (Razorpay is already saved in the seed data).
  const zepto = page.getByRole("button", { name: /SDE-1, Platform/ });
  const bookmark = zepto.getByRole("button", { name: /Save to tracker|Saved to tracker/ });
  const before = await bookmark.getAttribute("aria-label");
  await bookmark.click();
  await expect(bookmark).not.toHaveAttribute("aria-label", before!);
  await bookmark.click();
  await expect(bookmark).toHaveAttribute("aria-label", before!);
});

test("Deep Search turns a sentence into filters and a preview", async ({ page }) => {
  await signIn(page);
  await page.getByRole("tab", { name: /Deep Search/ }).click();
  await page.getByLabel("Deep search").fill("Backend roles in Bengaluru, Go or Kafka, 15 LPA");
  await page.keyboard.press("Enter");
  const filters = page.getByText(/jobs? match(es)? right now/);
  await expect(page.getByText("15–30 LPA").first()).toBeVisible({ timeout: 10_000 });
  await expect(filters).toBeVisible();
  await expect(page.getByRole("link", { name: /Backend Engineer I/ })).toBeVisible();
  await shot(page, "jobs-deep");
});

test("Saved lists the seeded searches", async ({ page }) => {
  await signIn(page);
  await page.getByRole("tab", { name: /Saved/ }).click();
  await expect(page).toHaveURL(/board=Saved/);
  await expect(page.getByText("Backend roles in Bengaluru, 12 LPA+, Go or Node")).toBeVisible();
  await expect(page.getByText("6 new")).toBeVisible();
  await shot(page, "jobs-saved");
});
