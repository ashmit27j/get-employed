import { expect, test } from "@playwright/test";
import { shot, signIn } from "./helpers";

test("Job Profile shows strength, saves edits and shares content with the resume", async ({
  page,
}) => {
  await signIn(page, "/profile");
  await expect(page.getByRole("heading", { level: 1, name: "Ashmit Jain" })).toBeVisible();
  await expect(
    page.getByText("Computer Engineering student · Backend (Go, Kafka) and iOS (SwiftUI)").first(),
  ).toBeVisible();
  await expect(page.getByText("Profile strength")).toBeVisible();
  await expect(page.getByRole("button", { name: "Undergraduate", pressed: true })).toBeVisible();
  await shot(page, "profile");

  // Experience comes from the resume and shows its summary.
  await expect(
    page.getByText("Built Nosh, a SwiftUI meal-planning app using MVVM; shipped onboarding", {
      exact: false,
    }),
  ).toBeVisible();

  // Add a skill here; it shows up on the main resume.
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await page.getByLabel("Add a skill").fill("Rust");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Remove Rust" })).toBeVisible();

  // A link here goes into the resume header.
  await page.getByLabel("Portfolio link").fill("ashmit.dev");
  await page.getByRole("button", { name: "Recent graduate" }).click();

  // Nothing is stored until Save; leaving asks first.
  await expect(page.getByText("You have unsaved changes.")).toBeVisible();
  await page.getByRole("link", { name: "Application Tracker" }).click();
  const leave = page.getByRole("dialog", { name: "Leave with unsaved changes?" });
  await expect(leave).toBeVisible();
  await leave.getByRole("button", { name: "Stay" }).click();
  await expect(page).toHaveURL(/\/profile/);
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("button", { name: "Saved", exact: true })).toBeVisible({
    timeout: 10_000,
  });

  await page.reload();
  await expect(page.getByRole("button", { name: "Recent graduate", pressed: true })).toBeVisible();
  await expect(page.getByLabel("Portfolio link")).toHaveValue("ashmit.dev");
  await page.goto("/documents");
  await expect(page.getByRole("button", { name: "Remove Rust" })).toBeVisible();
  await expect(page.locator("aside [data-resume-page]").getByText(/ashmit\.dev/)).toBeVisible();
});

test("Job Profile section navigation marks incomplete sections", async ({ page }) => {
  await signIn(page, "/profile");
  const nav = page.getByRole("navigation", { name: "Profile sections" }).last();
  await expect(nav.getByRole("link", { name: "Voluntary" })).toBeVisible();
  await nav.getByRole("link", { name: "Documents" }).click();
  await expect(page.getByText("Semester 5 transcript.pdf")).toBeInViewport();
});
