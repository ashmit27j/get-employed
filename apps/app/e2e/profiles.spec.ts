import { expect, test } from "@playwright/test";
import { shot, signIn } from "./helpers";

test("LinkedIn shows the rebuilt profile and copies accepted rewrites", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await signIn(page, "/profiles/linkedin");
  await expect(
    page.getByRole("heading", { level: 1, name: "Optimize your LinkedIn profile" }),
  ).toBeVisible();
  await expect(page.getByText("Your rebuilt profile")).toBeVisible();
  await expect(
    page.getByText("MPSTME, NMIMS — B.Tech, Computer Engineering, 2023–2027"),
  ).toBeVisible();
  await expect(page.getByText("How to export your LinkedIn PDF")).toBeVisible();
  await shot(page, "profiles-linkedin");

  const accept = page.getByRole("button", { name: "Accept" }).first();
  await accept.click();
  await expect(
    page.getByText("Copied the new headline text. Paste it into LinkedIn."),
  ).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    "Computer Engineering student · Backend (Go, Kafka) and iOS (SwiftUI)",
  );
});

test("GitHub tabs: README, pins, project READMEs and context", async ({ page }) => {
  await signIn(page, "/profiles/github");
  await expect(page.getByRole("link", { name: "@ashmit27j" })).toBeVisible();
  await expect(page.getByText("6 public repositories · 83 stars · active this week")).toBeVisible();
  await expect(page.getByLabel("Profile README")).toHaveValue(/# Ashmit Jain/);
  await expect(page.getByRole("link", { name: "Commit to GitHub" })).toHaveAttribute(
    "href",
    /github\.com\/ashmit27j\/ashmit27j\/new\/main\?filename=README\.md/,
  );
  await shot(page, "profiles-github");

  await page.getByRole("tab", { name: "Pinned repos" }).click();
  await expect(page.getByText("2 pinned repositories work against you.")).toBeVisible();
  await page.getByRole("button", { name: "Use suggestions" }).click();
  await expect(page.getByText("Your pins match the suggestions.")).toBeVisible();

  await page.getByRole("tab", { name: "Project READMEs" }).click();
  await page.getByRole("button", { name: "Generate README" }).click();
  await expect(page.getByText("6 of 6")).toBeVisible();

  await page.getByRole("tab", { name: "Profile context" }).click();
  await page.getByRole("button", { name: /Add \d+ to Projects/ }).click();
  await expect(page.getByText(/Added \d+ to your main resume\./)).toBeVisible();
  await page.goto("/documents");
  await expect(page.getByRole("textbox", { name: "Project", exact: true }).nth(1)).toHaveValue(
    "nosh-ios",
  );
});

test("LinkedIn imports from a profile link as well as the PDF", async ({ page }) => {
  await signIn(page, "/profiles/linkedin");
  // Remove the seeded PDF import to get back to the choice.
  await page
    .getByRole("button", { name: /remove/i })
    .first()
    .click();
  await expect(page.getByText("Drop your LinkedIn PDF here")).toBeVisible();
  const url = page.getByLabel("LinkedIn profile URL");
  await expect(url).toBeVisible();
  await url.fill("example.com/me");
  await page.getByRole("button", { name: "Import profile" }).click();
  await expect(
    page.getByText("Paste your profile link, like linkedin.com/in/your-name."),
  ).toBeVisible();
  await url.fill("https://in.linkedin.com/in/ashmit-jain/");
  await page.getByRole("button", { name: "Import profile" }).click();
  await expect(page.getByText("linkedin.com/in/ashmit-jain", { exact: true })).toBeVisible();
  await expect(page.getByText("Rebuilding your profile from the page…")).toBeVisible();
});
