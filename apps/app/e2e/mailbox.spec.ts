import { expect, test } from "@playwright/test";
import { shot, signIn } from "./helpers";

test("Inbox lists mail, opens a thread and sends a reply", async ({ page }) => {
  await signIn(page, "/mailbox");
  await expect(page.getByRole("heading", { level: 1, name: "Mailbox" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Unread 2/ })).toBeVisible();
  await shot(page, "mailbox-inbox");

  await page.getByRole("button", { name: /Interviews 1/ }).click();
  await page.getByRole("button", { name: /Ananya Krishnan/ }).click();
  const drawer = page.getByRole("dialog", { name: "Re: Backend Engineer I, payments team" });
  await expect(
    drawer.getByText("Could you do a 45-minute technical round", { exact: false }),
  ).toBeVisible();
  await drawer.getByRole("button", { name: "Draft reply" }).click();
  await expect(drawer.getByLabel("Reply")).toHaveValue(/Tuesday at 15:00 IST works for me/);
  await drawer.getByRole("button", { name: "Send reply" }).click();
  await expect(drawer.getByText("You", { exact: true })).toBeVisible();
  await expect(drawer.getByLabel("Reply")).toHaveValue("");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: /Unread 1/ })).toBeVisible();
});

test("Outbox drafts need approval before they queue", async ({ page }) => {
  await signIn(page, "/mailbox?box=outbox");
  await expect(
    page.getByText("Nothing is sent until you approve it.", { exact: false }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /Needs review 4/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Approve 3 emails" })).toBeVisible();
  await shot(page, "mailbox-outbox");

  // Open a draft, edit it, approve it.
  await page.getByRole("button", { name: /Karthik Rao/ }).click();
  const drawer = page.getByRole("dialog");
  await expect(drawer).toHaveAccessibleName("SDE-1 Platform: Node + Redis");
  await expect(drawer.getByText("Pattern match (first@domain), MX verified")).toBeVisible();
  await drawer.getByLabel("Subject").fill("SDE-1 Platform: Node, Redis and a 5x latency cut");
  await expect(drawer.getByText(/\d+ words · aim for under 120/)).toBeVisible();
  await drawer.getByRole("button", { name: "Approve and queue" }).click();
  await expect(page.getByRole("button", { name: /Needs review 3/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Queued 1/ })).toBeVisible();

  // Sent emails can be marked replied, which adds the reply to the inbox.
  await page.getByRole("button", { name: /Sent 2/ }).click();
  await page.getByRole("button", { name: /Sanjana Rao/ }).click();
  const sent = page.getByRole("dialog", { name: "Graduate Engineer, Maps" });
  await sent.getByRole("button", { name: "Mark as replied" }).click();
  await sent.getByLabel("Their reply (optional)").fill("Thanks Ashmit, let's talk on Friday.");
  await sent.getByRole("button", { name: "Save reply" }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: /Replied 2/ })).toBeVisible();
  await page.getByRole("tab", { name: "Inbox" }).click();
  await expect(
    page.getByRole("button", { name: /Sanjana Rao.*Re: Graduate Engineer, Maps/ }),
  ).toBeVisible();
});

test("Reach out on a job opens its draft", async ({ page }) => {
  await signIn(page);
  await page.getByRole("button", { name: /Backend Engineer I/ }).click();
  await page.getByRole("link", { name: "View job" }).click();
  await page.getByRole("link", { name: "Reach out" }).click();
  await expect(
    page.getByRole("dialog", { name: "Backend Engineer I: Go + Kafka projects" }),
  ).toBeVisible({ timeout: 15_000 });
});
