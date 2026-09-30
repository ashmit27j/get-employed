import { expect, test } from "@playwright/test";
import { shot, signIn } from "./helpers";

test("A saved chat shows its messages, actions and jobs", async ({ page }) => {
  await signIn(page);
  await page.getByRole("tab", { name: "AI" }).click();
  await page.getByRole("link", { name: "Job hunt, week of Sep 22" }).first().click();
  await expect(page).toHaveURL(/\/assistant\?thread=/);
  await expect(
    page.getByText("Find backend roles in Bengaluru that would take a 2027 grad.", {
      exact: false,
    }),
  ).toBeVisible();
  await expect(page.getByText("Drafted outreach to Ananya Krishnan")).toBeVisible();
  await expect(page.getByRole("link", { name: /Backend Engineer I · Razorpay/ })).toBeVisible();
  await shot(page, "assistant-thread");
});

test("A new chat searches jobs and keeps the thread", async ({ page }) => {
  await signIn(page, "/assistant?new=1");
  await expect(page.getByRole("heading", { name: "What should we work on?" })).toBeVisible();
  await shot(page, "assistant-new");
  await page.getByLabel("Message").fill("Find backend roles in Bengaluru, Go or Kafka");
  await page.keyboard.press("Enter");
  await expect(page.getByText("Searched jobs")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("link", { name: /Backend Engineer I · Razorpay/ })).toBeVisible();
  await expect(page).toHaveURL(/thread=/);

  // Follow-up refers to the listed job.
  await page
    .getByLabel("Message")
    .fill("Tailor my resume for the first one and draft an email to the hiring manager");
  await page.keyboard.press("Enter");
  await expect(page.getByText("Tailored resume for Backend Engineer I · Razorpay")).toBeVisible({
    timeout: 15_000,
  });
  await expect(
    page.getByText("nothing is sent until you approve it", { exact: false }),
  ).toBeVisible();

  // It shows up in the sidebar and survives a reload.
  await page.reload();
  await expect(page.getByText("Tailored resume for Backend Engineer I · Razorpay")).toBeVisible();
  await page.getByRole("tab", { name: "AI" }).click();
  await expect(
    page.getByRole("link", { name: /^Find backend roles in Bengaluru, Go or…/ }).first(),
  ).toBeVisible();
});

test("The dock answers from any page", async ({ page }) => {
  await signIn(page, "/tracker");
  const dock = page.getByRole("complementary", { name: "Assistant" });
  // The shortcut works once the page has hydrated.
  await expect(async () => {
    if (!(await dock.isVisible())) await page.keyboard.press("Control+j");
    await expect(dock.getByLabel("Message")).toBeVisible({ timeout: 1000 });
  }).toPass();
  await dock.getByLabel("Message").fill("How is my tracker looking?");
  await page.keyboard.press("Enter");
  await expect(dock.getByText(/You have \d+ saved/)).toBeVisible({ timeout: 15_000 });
});
