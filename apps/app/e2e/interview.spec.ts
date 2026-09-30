import { expect, test } from "@playwright/test";
import { shot, signIn } from "./helpers";

test("The latest seeded session shows its feedback", async ({ page }) => {
  await signIn(page, "/interview");
  await expect(page.getByRole("heading", { name: "Mock interview" })).toBeVisible();
  await shot(page, "interview-setup");
  await page.getByRole("link", { name: "Last feedback" }).click();
  await expect(page).toHaveURL(/session=/);
  await expect(page.getByRole("heading", { name: "Backend Engineer I · Razorpay" })).toBeVisible();
  await expect(
    page.getByText("Clear answers on idempotency and queues.", { exact: false }),
  ).toBeVisible();
  await expect(page.getByText("Design a rate limiter for a public API.")).toBeVisible();
  await expect(page.getByText("Overall score across your last five sessions")).toBeVisible();
  await shot(page, "interview-feedback");
});

test("A typed interview is graded and saved", async ({ page }) => {
  await signIn(page, "/interview");
  await page.getByRole("radio", { name: /Typed/ }).click();
  await expect(page.getByText("How the typed interview works")).toBeVisible();
  await page.getByRole("button", { name: "Start session" }).click();
  await expect(page.getByText("I'll ask six questions", { exact: false })).toBeVisible();

  const answer = page.getByLabel("Your answer");
  await answer.fill(
    "First I built FestFlow, a ticketing system for our college fest. The problem was that 12k users hit it at once, so I decided on a queue. The result was no dropped orders, and I learned to load test early.",
  );
  await page.getByRole("button", { name: "Submit answer" }).click();
  // Without an LLM the rules acknowledge and ask the next planned question.
  await expect(page.getByText("Question 2 of 6")).toBeVisible();
  for (let i = 0; i < 5; i++) {
    await expect(page.getByRole("button", { name: "Skip" })).toBeEnabled({ timeout: 5000 });
    await page.getByRole("button", { name: "Skip" }).click();
  }
  await expect(page.getByText("All 6 questions answered.")).toBeVisible({ timeout: 5000 });
  await page.getByRole("button", { name: "See feedback" }).click();
  await expect(page).toHaveURL(/session=/, { timeout: 15_000 });
  await expect(page.getByText("Answer by answer")).toBeVisible();
  await expect(page.getByText("Not answered.").first()).toBeVisible();
});

test("A multiple-choice test marks answers and shows results", async ({ page }) => {
  await signIn(page, "/interview");
  await page.getByRole("radio", { name: /Multiple choice/ }).click();
  await page.getByRole("button", { name: "Start test" }).click();
  await expect(page.getByText("Question 1 of 8")).toBeVisible();

  await page.getByRole("button", { name: /409 Conflict/ }).click();
  await expect(page.getByText("Correct", { exact: true })).toBeVisible();
  for (let i = 1; i < 8; i++) {
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.getByRole("group", { name: "Options" }).getByRole("button").first().click();
  }
  await page.getByRole("button", { name: "See results" }).click();
  await expect(page.getByRole("heading", { name: "Test results" })).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByText(/of 8 correct/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Retake" })).toHaveAttribute(
    "href",
    "/interview?start=mcq",
  );
});

test("The live setup lists its requirements", async ({ page }) => {
  await signIn(page, "/interview");
  await expect(page.getByRole("radio", { name: /Live interview/ })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  await expect(page.getByText("Requirements")).toBeVisible();
  await expect(page.getByText("Camera not connected (optional)")).toBeVisible();
  await expect(page.getByText("Live sessions this month")).toBeVisible();
});

test("A live session falls back from Web Speech to Whisper to typing", async ({ page }) => {
  // Brave and Firefox expose the API and then fail with "network" (docs/interviews.md).
  await page.addInitScript(() => {
    class FailingRecognition {
      onerror: ((e: { error: string }) => void) | null = null;
      onend: (() => void) | null = null;
      start() {
        setTimeout(() => {
          this.onerror?.({ error: "network" });
          this.onend?.();
        }, 50);
      }
      stop() {}
      abort() {}
    }
    Object.assign(window, {
      webkitSpeechRecognition: FailingRecognition,
      SpeechRecognition: FailingRecognition,
    });
    // No microphone in the test browser, so Whisper can't record either: typing is last.
    navigator.mediaDevices.getUserMedia = () =>
      Promise.reject(new DOMException("denied", "NotAllowedError"));
    window.speechSynthesis.speak = (u: SpeechSynthesisUtterance) =>
      setTimeout(() => u.onend?.(new Event("end") as SpeechSynthesisEvent), 20);
  });
  await signIn(page, "/interview");
  await page.getByRole("button", { name: "Start session" }).click();
  await expect(page.getByText("Question 1 of 6", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Answer" }).click();
  await expect(
    page.getByText("Switched to on-device transcription; answer again.", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Answer" }).click();
  await expect(page.getByText("Microphone access is blocked.", { exact: false })).toBeVisible();
  await page
    .getByLabel("Your answer")
    .fill("I built FestFlow, a ticketing app for our college fest used by 12k students.");
  await page.getByRole("button", { name: "Submit answer" }).click();
  await expect(page.getByText("Question 2 of 6", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "End and review" }).click();
  await expect(page).toHaveURL(/session=/, { timeout: 15_000 });
  await expect(page.getByText("Answer by answer")).toBeVisible();
  // The session collapsed the sidebar; leaving restores it.
  await expect(page.getByRole("button", { name: "Collapse sidebar" })).toBeVisible();
});
