import { describe, expect, it } from "vitest";
import { hasSkill, matchBreakdown, mentions, skillEvidence } from "./match";
import { ProfileSchema } from "./schemas";

const profile = ProfileSchema.parse({
  contact: { name: "Ashmit Jain", email: "a@example.com" },
  experience: [
    {
      role: "Web & UI/UX Development Intern",
      co: "Synoris Information Systems",
      bullets: ["Built React screens.", "Worked on Node.js APIs."],
    },
  ],
  projects: [
    { name: "FestFlow", stack: "Go, Kafka, PostgreSQL", bullets: ["Event ticketing backend."] },
  ],
  skills: [
    { name: "Languages", items: ["Go", "TypeScript"] },
    { name: "Tools", items: ["Kafka", "PostgreSQL", "React", "Node.js"] },
  ],
});

describe("mentions", () => {
  it("matches whole words only", () => {
    expect(mentions("Go, Kafka", "Go")).toBe(true);
    expect(mentions("A good backend", "Go")).toBe(false);
    expect(mentions("Worked on Node.js APIs", "Node.js")).toBe(true);
  });
});

describe("skillEvidence", () => {
  it("names the projects and roles that use a skill", () => {
    expect(skillEvidence(profile, "Kafka")).toBe("FestFlow");
    expect(skillEvidence(profile, "React")).toBe("Synoris");
    expect(skillEvidence(profile, "Rust")).toBeNull();
    expect(hasSkill(profile, "node.js")).toBe(true);
  });
});

describe("matchBreakdown", () => {
  const job = {
    skills: ["Go", "Kafka", "PostgreSQL", "gRPC", "Kubernetes"],
    missing: ["Kubernetes"],
    experience: "0–2 yrs",
    location: "Bengaluru",
    mode: "hybrid" as const,
  };

  it("scores skills, experience, location and projects", () => {
    const b = matchBreakdown({
      profile,
      job,
      experienceLevel: "Student or intern",
      preferredLocations: ["Bengaluru", "Remote"],
    });
    expect(b.skills).toEqual({ have: 4, total: 5, value: 80 });
    expect(b.experience).toBe(95);
    expect(b.location).toBe(100);
    expect(b.projects).toBe(90); // 3 of 4 matched skills backed by FestFlow
  });

  it("estimates the tailoring gain from project stacks the bullets don't mention", () => {
    const b = matchBreakdown({ profile, job });
    expect(b.gain).toBe(6);
    expect(b.gainNote).toBe("Tailoring can add ~6 by surfacing FestFlow's Go and Kafka work.");
  });

  it("ranks a city outside the preferences lower", () => {
    expect(matchBreakdown({ profile, job, preferredLocations: ["Pune"] }).location).toBe(50);
    expect(
      matchBreakdown({ profile, job: { ...job, mode: "remote" }, preferredLocations: ["Remote"] })
        .location,
    ).toBe(100);
  });
});
