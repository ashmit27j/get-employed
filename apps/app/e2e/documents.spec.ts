import { expect, test } from "@playwright/test";
import { shot, signIn } from "./helpers";

test("Main resume edits autosave and update the preview", async ({ page }) => {
  await signIn(page, "/documents");
  await expect(page.getByRole("heading", { level: 1, name: "Main resume" })).toBeVisible();
  await expect(page.getByText(/^ATS score · \d+ \/ 100$/)).toBeVisible();
  await expect(page.getByLabel("Project").first()).toHaveValue("FestFlow");
  await shot(page, "documents-main");

  const summary = page.getByLabel("Summary");
  await summary.fill("Backend engineer who ships Go services.");
  await expect(page.getByText("Saving…")).toBeVisible();
  await expect(page.getByText("All changes saved")).toBeVisible({ timeout: 10_000 });
  // The preview paper shows the new summary.
  await expect(
    page.locator("aside [data-resume-page]").getByText("Backend engineer who ships Go services."),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Summary")).toHaveValue("Backend engineer who ships Go services.");

  // Code view shows generated LaTeX.
  await page.getByRole("tab", { name: "Code" }).click();
  await expect(page.getByLabel("LaTeX source")).toHaveValue(/\\section\{Summary\}/);
  await expect(
    page.getByText("Generated from your main resume. Compiles to the PDF on download."),
  ).toBeVisible();

  // Template picker.
  await page.getByRole("button", { name: /Template: Classic/ }).click();
  const picker = page.getByRole("dialog", { name: "Choose a template" });
  await picker.getByRole("button", { name: /Modern/ }).click();
  await picker.getByRole("button", { name: "Use template" }).click();
  await expect(page.getByRole("button", { name: /Template: Modern/ })).toBeVisible();
});

test("Tailored resumes list and the tailor view", async ({ page }) => {
  await signIn(page, "/documents?view=list");
  await expect(page.getByRole("heading", { level: 1, name: "Tailored resumes" })).toBeVisible();
  const card = page.getByRole("link", { name: /SDE-1, Platform, Zepto/ });
  await expect(card).toBeVisible();
  await shot(page, "documents-list");
  await card.click();

  await expect(page).toHaveURL(/view=tailor&job=/);
  await expect(page.getByText("Tailoring for")).toBeVisible();
  await expect(
    page.getByText("4 waiting for review. Only wording changes; no new claims are added."),
  ).toBeVisible();
  const after = page.getByText("ATS score, tailored");
  await page.getByRole("button", { name: "Accept all" }).click();
  await expect(
    page.getByText("All reviewed. Only wording changes; no new claims are added."),
  ).toBeVisible();
  await expect(page.getByText("Highlighted lines are accepted rewrites.")).toBeVisible();
  await expect(
    page.locator("aside [data-resume-page]").getByText(/absorbed 900 scans\/min/),
  ).toBeVisible();
  await shot(page, "documents-tailor");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText(/^Saved at \d+:\d{2} · 4 of 4 accepted$/)).toBeVisible();
  await expect(after).toBeVisible();
});

test("Tailoring a new job creates a tailored copy", async ({ page }) => {
  await signIn(page);
  await page.getByRole("button", { name: /Graduate Engineer Trainee/ }).click();
  await page.getByRole("link", { name: "Tailor resume" }).click();
  await expect(page.getByText("Tailoring for")).toBeVisible({ timeout: 15_000 });
  await expect(
    page.getByText("Writing suggestions for this role.", { exact: false }),
  ).toBeVisible();
  await page.goto("/documents?view=list");
  await expect(
    page.getByRole("link", { name: /Graduate Engineer Trainee, Freshworks/ }),
  ).toBeVisible();
});

test("Upload view enables Fit resume once LaTeX is pasted", async ({ page }) => {
  await signIn(page, "/documents?view=upload");
  await expect(page.getByRole("heading", { level: 1, name: "Upload your resume" })).toBeVisible();
  const fit = page.getByRole("button", { name: "Fit resume" });
  await expect(fit).toBeDisabled();
  await page
    .getByLabel("LaTeX source")
    .fill("\\documentclass{article}\\begin{document}Hi\\end{document}");
  await expect(fit).toBeEnabled();
  await page.getByRole("tab", { name: "Upload file" }).click();
  await expect(fit).toBeDisabled();
  await shot(page, "documents-upload");
});
