import { describe, expect, it } from "vitest";
import { applyDiffs, atsScore, toLatex } from "./ats";
import { ProfileSchema } from "./schemas";

const doc = ProfileSchema.parse({
  contact: { name: "Ashmit Jain", email: "a@example.com", phone: "+91 98200 12345" },
  summary: "Computer engineering student building backend services.",
  education: [{ school: "NMIMS", degree: "B.Tech" }],
  experience: [
    { role: "Intern", co: "Synoris", bullets: ["Worked on backend APIs for college fest app."] },
  ],
  projects: [
    {
      name: "FestFlow",
      stack: "Go, Kafka",
      bullets: ["Implemented a queue so ticket scans don't drop during peak entry."],
    },
  ],
  skills: [{ name: "Tools", items: ["Kafka", "PostgreSQL", "Figma"] }],
});

describe("atsScore", () => {
  it("rewards keywords and numbers", () => {
    const before = atsScore(doc, ["Go", "Kafka", "gRPC"]);
    expect(before.keywords).toEqual({ found: ["Go", "Kafka"], missing: ["gRPC"] });
    expect(before.parts.numbers).toBe(0);
    // Go and Kafka are only in the skills list and the stack line, never in a bullet.
    expect(before.parts.context).toBe(0);
    expect(before.tip).toBe("Key skills are listed but not shown in your bullets.");

    const after = atsScore(
      applyDiffs(doc, [
        {
          old: "Implemented a queue so ticket scans don't drop during peak entry.",
          new: "Designed a Kafka-backed queue that absorbed 900 scans/min at peak entry with zero dropped events.",
          status: "accepted",
        },
        {
          old: "Tools: Kafka, PostgreSQL, Figma",
          new: "Tools: Kafka, PostgreSQL, gRPC",
          status: "accepted",
        },
      ]),
      ["Go", "Kafka", "gRPC"],
    );
    expect(after.keywords.missing).toEqual([]);
    expect(after.parts.context).toBeGreaterThan(0);
    expect(after.score).toBeGreaterThan(before.score);
  });
});

describe("applyDiffs", () => {
  it("only applies accepted rewrites", () => {
    const out = applyDiffs(doc, [
      {
        old: "Worked on backend APIs for college fest app.",
        new: "Built a Go REST API.",
        status: "rejected",
      },
      { old: "Tools: Kafka, PostgreSQL, Figma", new: "Tools: Kafka, gRPC", status: "accepted" },
    ]);
    expect(out.experience[0]!.bullets).toEqual(["Worked on backend APIs for college fest app."]);
    expect(out.skills).toEqual([{ name: "Tools", items: ["Kafka", "gRPC"] }]);
  });
});

describe("toLatex", () => {
  it("escapes special characters", () => {
    const src = toLatex({ ...doc, summary: "50% faster & 2x cheaper" }, "Classic");
    expect(src).toContain(String.raw`50\% faster \& 2x cheaper`);
    expect(src).toContain(String.raw`\begin{document}`);
    expect(src.trim().endsWith(String.raw`\end{document}`)).toBe(true);
  });
});
