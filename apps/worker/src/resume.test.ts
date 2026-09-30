import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { ProfileSchema, parseResumeText } from "@ge/core";
import { fileText, ruleDiffs } from "./resume";

describe("resume.parse", () => {
  it("reads a PDF and parses it without an LLM", async () => {
    const bytes = new Uint8Array(
      await readFile(new URL("../test/fixtures/resume.pdf", import.meta.url)),
    );
    const text = await fileText(bytes, "pdf");
    expect(text).toContain("Riya Kapoor");
    const p = parseResumeText(text, { name: "x", email: "x@x.com" });
    expect(p.contact.email).toBe("riya@example.com");
    expect(p.experience[0]).toMatchObject({ role: "Backend Intern", co: "Acme Payments" });
    expect(p.skills.flatMap((g) => g.items)).toEqual(expect.arrayContaining(["Go", "Docker"]));
  });
});

describe("resume.tailor rules", () => {
  const doc = ProfileSchema.parse({
    contact: { name: "A", email: "a@x.com" },
    projects: [
      { name: "QueueCat", stack: "Go, Kafka", bullets: ["Event pipeline for a college fest app."] },
    ],
    skills: [{ name: "Tools", items: ["Docker"] }],
  });
  it("only surfaces skills the resume already backs", () => {
    const diffs = ruleDiffs(doc, ["Kafka", "Kubernetes"]);
    expect(diffs).toEqual([
      expect.objectContaining({
        section: "Projects · QueueCat",
        new: "Event pipeline for a college fest app, using Kafka.",
      }),
      expect.objectContaining({
        section: "Skills",
        old: "Tools: Docker",
        new: "Tools: Docker, Kafka",
      }),
    ]);
  });
});
