import { expect, test } from "@playwright/test";
import { shot, signIn } from "./helpers";

test("Job detail explains the match and claims a missing skill", async ({ page }) => {
  await signIn(page);
  await page.getByRole("button", { name: /Backend Engineer I/ }).click();
  await page.getByRole("link", { name: "View job" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Backend Engineer I" })).toBeVisible();
  await expect(page.getByText("Posted", { exact: false }).first()).toContainText(
    "via Careers page",
  );

  // Description sections from the careers page, with requirements before Benefits.
  await expect(page.getByRole("heading", { name: "What you'll do" })).toBeVisible();
  await expect(
    page.getByText("Design idempotent APIs for payment retries and webhooks."),
  ).toBeVisible();
  await expect(page.getByText("Kubernetes (missing)")).toBeAttached();
  await expect(page.getByText("4 of 5", { exact: true })).toBeVisible();
  await expect(page.getByText(/Tailoring can add ~\d+ by surfacing FestFlow's/)).toBeVisible();

  await expect(page.getByText("Stated in the posting.", { exact: false })).toBeVisible();
  await expect(page.getByText("Ananya Krishnan")).toBeVisible();
  await expect(page.getByText("Email verified by SMTP handshake")).toBeVisible();
  await shot(page, "job-detail");

  await page.getByRole("button", { name: "I have this" }).click();
  await expect(page.getByText("5 of 5", { exact: true })).toBeVisible();
  await expect(page.getByText("Missing skills")).toHaveCount(0);
  await page.reload();
  await expect(page.getByText("Kubernetes (matched)")).toBeAttached();

  await expect(page.getByRole("link", { name: "Tailor resume" })).toHaveAttribute(
    "href",
    /\/documents\?view=tailor&job=/,
  );
});

test("Unknown job ids show the not-found page", async ({ page }) => {
  await signIn(page);
  const res = await page.goto("/jobs/not-a-job");
  expect(res?.status()).toBe(404);
});
