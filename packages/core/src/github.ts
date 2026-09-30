import type { Profile } from "./schemas";

/** A public repository as profile.import-github stores it (linked_profiles.snapshot). */
export interface GhRepo {
  id: string;
  name: string;
  lang: string;
  stars: number;
  desc: string;
  topics: string[];
  /** 0–100: how complete its README is against README_CHECKS. */
  readmeScore: number;
  /** Worth pinning for the user's target role. */
  suggest: boolean;
  why: string;
  pinned: boolean;
}

export interface GithubSnapshot {
  login: string;
  repos: GhRepo[];
  languages: { name: string; pct: number }[];
  activity: string;
}

/** LinkedIn rebuilt from its PDF export (profile.import-linkedin). */
export interface LinkedinSnapshot {
  sections: { icon: string; title: string; body: string }[];
  strength: number;
}
export interface LinkedinSuggestion {
  section: string;
  old: string;
  new: string;
  alts: string[];
  reason: string;
}

export const README_CHECKS = [
  "One-line description",
  "What it does and why",
  "Tech stack",
  "Setup and run steps",
  "Screenshots or demo",
  "Results or metrics",
] as const;

export const README_SECTIONS = [
  ["about", "About", "user"],
  ["now", "Currently", "clock"],
  ["stack", "Tech stack", "code"],
  ["projects", "Featured projects", "folder-git-2"],
  ["experience", "Experience", "briefcase"],
  ["contact", "Contact", "at-sign"],
] as const;
export type ReadmeSection = (typeof README_SECTIONS)[number][0];

export const GITHUB_ROLES = [
  "Backend engineer",
  "Full-stack engineer",
  "iOS engineer",
  "Frontend engineer",
] as const;
export type GithubRole = (typeof GITHUB_ROLES)[number];

const INTRO: Record<GithubRole, string> = {
  "Backend engineer":
    "I build backend services in Go: queues, APIs and the parts that have to stay up at peak load.",
  "Full-stack engineer":
    "I build full-stack products with Go and React, from the database to the last screen.",
  "iOS engineer": "I build iOS apps in SwiftUI and the Go services behind them.",
  "Frontend engineer":
    "I build responsive interfaces in React and TypeScript, backed by a design-system mindset.",
};

/** "B.Tech in Computer Engineering" → "Computer engineering". */
function studyLine(profile: Profile): string | null {
  const e = profile.education[0];
  if (!e) return null;
  const field = e.field || /\bin\s+(.+)$/i.exec(e.degree)?.[1] || e.degree;
  const f = field.trim();
  return `${f.charAt(0).toUpperCase()}${f.slice(1).toLowerCase()} student at ${e.school}.`;
}

const yearOf = (dates: string) =>
  /(\d{4})\s*$/.exec(dates.trim())?.[1] ?? /(\d{4})/.exec(dates)?.[1] ?? "";

/** The profile README (github.com/<login>/<login>), in the prototype's structure. */
export function profileReadme(input: {
  profile: Profile;
  repos: GhRepo[];
  login: string;
  role: GithubRole;
  detailed: boolean;
  sections: Record<ReadmeSection, boolean>;
}): string {
  const { profile: p, repos, login, role, detailed, sections: on } = input;
  const L: string[] = [`# ${p.contact.name}`, ""];
  if (on.about) L.push([studyLine(p), INTRO[role]].filter(Boolean).join(" "), "");
  if (on.now) {
    L.push("## Currently", `- Looking for ${role.toLowerCase()} roles`);
    const top = repos.find((r) => r.suggest);
    if (detailed && top) L.push(`- Improving **${top.name}**`);
    L.push("");
  }
  if (on.stack) {
    const group = (re: RegExp) => p.skills.find((g) => re.test(g.name))?.items ?? [];
    const langs = group(/lang/i);
    const tools = group(/tool/i);
    if (langs.length) L.push("## Tech stack", `**Languages:** ${langs.join(" · ")}`, "");
    if (tools.length) {
      if (!langs.length) L.push("## Tech stack");
      L.push(`**Tools:** ${tools.join(" · ")}`, "");
    }
  }
  if (on.projects) {
    L.push("## Featured projects");
    repos
      .filter((r) => r.suggest)
      .slice(0, detailed ? 4 : 3)
      .forEach((r) =>
        L.push(
          `- **[${r.name}](https://github.com/${login}/${r.name})**: ${r.desc}${detailed ? ` \`${r.lang}\`` : ""}`,
        ),
      );
    L.push("");
  }
  if (on.experience && p.experience.length) {
    L.push("## Experience");
    p.experience.forEach((x) =>
      L.push(`- **${x.role}**, ${x.co}${yearOf(x.dates) ? ` (${yearOf(x.dates)})` : ""}`),
    );
    L.push("");
  }
  if (on.contact) {
    L.push("## Contact", `- [${p.contact.email}](mailto:${p.contact.email})`);
    const li = p.contact.links.find((l) => /linkedin\.com/i.test(l));
    if (li) L.push(`- [${li}](https://${li.replace(/^https?:\/\//, "")})`);
  }
  return L.join("\n").trim();
}

/** A project README with every section in README_CHECKS. */
export function projectReadme(r: GhRepo, login: string): string {
  const run =
    r.lang === "Go"
      ? "docker compose up -d && go run ./cmd/server"
      : r.lang === "Swift"
        ? `open ${r.name}.xcodeproj`
        : r.lang === "TypeScript" || r.lang === "JavaScript"
          ? "npm install && npm run dev"
          : "make";
  return [
    `# ${r.name}`,
    "",
    r.desc,
    "",
    "## Why it exists",
    `Built to solve a real problem and to learn ${r.topics.join(", ")}.`,
    "",
    "## Tech stack",
    ...r.topics.map((t) => `- ${t}`),
    "",
    "## Getting started",
    "```",
    `git clone https://github.com/${login}/${r.name}`,
    `cd ${r.name}`,
    run,
    "```",
    "",
    "## Results",
    "- Add one measurable result here",
    "",
    "## License",
    "MIT",
  ].join("\n");
}

/** GitHub's own editor with the profile README prefilled (no OAuth app needed; docs/decisions.md D20). */
export function newFileUrl(login: string, repo: string, filename: string, value: string) {
  return `https://github.com/${login}/${repo}/new/main?filename=${encodeURIComponent(filename)}&value=${encodeURIComponent(value)}`;
}

/**
 * GitHub profile score: half pin quality (share of pins worth pinning, docked when fewer than 4
 * or more than 6), half the README completeness of the pinned repositories.
 */
export function githubScore(repos: Pick<GhRepo, "pinned" | "suggest" | "readmeScore">[]): number {
  const pinned = repos.filter((r) => r.pinned);
  if (pinned.length === 0) return 0;
  const good = pinned.filter((r) => r.suggest).length / pinned.length;
  const count = pinned.length >= 4 && pinned.length <= 6 ? 1 : 0.8;
  const readme = pinned.reduce((a, r) => a + r.readmeScore, 0) / pinned.length;
  return Math.round(50 * good * count + 0.5 * readme);
}
