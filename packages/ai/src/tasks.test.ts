import { describe, expect, it } from "vitest";
import { MockLanguageModelV4 } from "ai/test";
import { EMPTY_FILTERS, ProfileSchema } from "@ge/core";
import { languageModel } from "./model";
import { parseQuery, tailorResume } from "./tasks";

const reply = (json: unknown) =>
  new MockLanguageModelV4({
    doGenerate: async () => ({
      content: [{ type: "text", text: JSON.stringify(json) }],
      finishReason: { unified: "stop", raw: undefined },
      usage: {
        inputTokens: { total: 1, noCache: 1, cacheRead: undefined, cacheWrite: undefined },
        outputTokens: { total: 1, text: 1, reasoning: undefined },
      },
      warnings: [],
    }),
  });

const profile = ProfileSchema.parse({
  contact: { name: "Asha Rao", email: "asha@example.com" },
  summary: "Backend student.",
  projects: [{ name: "FestFlow", stack: "Go, Kafka", bullets: ["Built a ticketing backend."] }],
});

describe("@ge/ai", () => {
  it("has no model without a key", () => {
    expect(languageModel({ apiKey: "" })).toBeNull();
    expect(languageModel({ apiKey: "k" })).not.toBeNull();
  });

  it("refines parsed filters and converts salary", async () => {
    const f = await parseQuery(
      reply({
        type: "internship",
        roles: ["Backend", "Backend"],
        locations: ["Pune"],
        modes: ["Remote"],
        experience: ["Internship"],
        salaryMinLpa: 4.8,
        skills: ["Go"],
      }),
      "backend internship in pune, remote, 40k a month, go",
      EMPTY_FILTERS,
    );
    expect(f).toMatchObject({
      type: "internship",
      roles: ["Backend"],
      salaryMin: 5,
      skills: ["Go"],
    });
  });

  it("keeps only rewrites of real lines", async () => {
    const diffs = await tailorResume(
      reply({
        diffs: [
          { index: 1, new: "Built a Go and Kafka ticketing backend.", reason: "Surfaces Kafka." },
          { index: 9, new: "Invented line", reason: "x" },
          { index: 0, new: "Backend student.", reason: "unchanged" },
        ],
      }),
      {
        profile,
        job: { title: "Backend Engineer", company: "Acme", skills: ["Kafka"], description: "" },
      },
    );
    expect(diffs).toEqual([
      {
        section: "Projects · FestFlow",
        old: "Built a ticketing backend.",
        new: "Built a Go and Kafka ticketing backend.",
        reason: "Surfaces Kafka.",
      },
    ]);
  });
});
