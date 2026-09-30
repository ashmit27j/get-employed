import { describe, expect, it } from "vitest";
import { contactLinks, linksFromContact, profileCompletion } from "./job-profile";
import { JobDetailsSchema, ProfileSchema } from "./schemas";

describe("links", () => {
  it("round-trips between the resume header and labelled links", () => {
    const labelled = linksFromContact([
      "github.com/ashmit27j",
      "linkedin.com/in/ashmitjain",
      "ashmit.dev",
    ]);
    expect(labelled).toEqual({
      github: "github.com/ashmit27j",
      linkedin: "linkedin.com/in/ashmitjain",
      portfolio: "ashmit.dev",
    });
    expect(contactLinks(labelled)).toEqual([
      "linkedin.com/in/ashmitjain",
      "github.com/ashmit27j",
      "ashmit.dev",
    ]);
  });
});

describe("profileCompletion", () => {
  it("scores an empty profile low and marks what is missing", () => {
    const doc = ProfileSchema.parse({ contact: { name: "A", email: "a@example.com" } });
    const r = profileCompletion(doc, JobDetailsSchema.parse({}));
    expect(r.tier).toBe("Basic");
    expect(r.done.basics).toBe(false);
    expect(r.done.voluntary).toBe(true);
    expect(r.doneCount).toBe(1);
  });

  it("needs five skills", () => {
    const doc = ProfileSchema.parse({
      contact: { name: "A", email: "a@example.com" },
      skills: [{ name: "Tools", items: ["Go", "Kafka", "SQL", "Git"] }],
    });
    expect(profileCompletion(doc, JobDetailsSchema.parse({})).done.skills).toBe(false);
  });
});
