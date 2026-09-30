import { describe, expect, it } from "vitest";
import { githubScore, newFileUrl, profileReadme, projectReadme, type GhRepo } from "./github";
import { ProfileSchema } from "./schemas";

const profile = ProfileSchema.parse({
  contact: { name: "Ashmit Jain", email: "a@example.com", links: ["linkedin.com/in/ashmitjain"] },
  education: [{ school: "MPSTME, NMIMS University", degree: "B.Tech in Computer Engineering" }],
  experience: [
    { role: "iOS Development Intern", co: "Digitas India", dates: "Jun 2025 – Jul 2025" },
  ],
  skills: [
    { name: "Languages", items: ["Go", "Swift"] },
    { name: "Tools", items: ["Kafka"] },
  ],
});
const repo: GhRepo = {
  id: "festflow",
  name: "festflow",
  lang: "Go",
  stars: 41,
  desc: "Event ticketing backend.",
  topics: ["Go", "Kafka"],
  readmeScore: 72,
  suggest: true,
  why: "",
  pinned: true,
};
const all = {
  about: true,
  now: true,
  stack: true,
  projects: true,
  experience: true,
  contact: true,
};

describe("profileReadme", () => {
  it("builds the sections that are on", () => {
    const md = profileReadme({
      profile,
      repos: [repo],
      login: "ashmit27j",
      role: "Backend engineer",
      detailed: false,
      sections: all,
    });
    expect(md).toContain(
      "Computer engineering student at MPSTME, NMIMS University. I build backend services in Go",
    );
    expect(md).toContain("**Languages:** Go · Swift");
    expect(md).toContain(
      "- **[festflow](https://github.com/ashmit27j/festflow)**: Event ticketing backend.",
    );
    expect(md).toContain("- **iOS Development Intern**, Digitas India (2025)");
    expect(md).toContain("[linkedin.com/in/ashmitjain](https://linkedin.com/in/ashmitjain)");
    const bare = profileReadme({
      profile,
      repos: [repo],
      login: "x",
      role: "Backend engineer",
      detailed: false,
      sections: { ...all, stack: false, contact: false },
    });
    expect(bare).not.toContain("Tech stack");
    expect(bare).not.toContain("## Contact");
  });
});

describe("projectReadme", () => {
  it("covers setup for the repo language", () => {
    expect(projectReadme(repo, "ashmit27j")).toContain(
      "docker compose up -d && go run ./cmd/server",
    );
    expect(newFileUrl("a", "a", "README.md", "# Hi")).toBe(
      "https://github.com/a/a/new/main?filename=README.md&value=%23%20Hi",
    );
  });
});

describe("githubScore", () => {
  it("rewards good pins with complete READMEs", () => {
    const r = (pinned: boolean, suggest: boolean, readmeScore: number) => ({
      pinned,
      suggest,
      readmeScore,
    });
    expect(
      githubScore([r(true, true, 72), r(true, true, 45), r(true, false, 60), r(true, false, 10)]),
    ).toBe(48);
    expect(
      githubScore([r(true, true, 92), r(true, true, 92), r(true, true, 92), r(true, true, 92)]),
    ).toBe(96);
    expect(githubScore([r(false, true, 90)])).toBe(0);
  });
});
