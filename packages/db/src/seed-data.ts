// Loads the prototype's mock data (prototype/ge-data.js) and reshapes it into rows for the schema.
// The prototype stays the single source of truth for seed content.
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { runInNewContext } from "node:vm";
import {
  ProfileSchema,
  type GithubSnapshot,
  type LinkedinSnapshot,
  type LinkedinSuggestion,
  type Chip,
  type Profile,
  type RubricScores,
  type Stage,
  type WorkMode,
} from "@ge/core";

/* Shapes of window.GEData, as far as the seed reads them. */
interface GEJob {
  id: string;
  title: string;
  co: string;
  loc: string;
  mode: string;
  exp: string;
  score: number;
  why: string;
  missing: string[];
  skills: string[];
  salary: { type: "stated" | "est"; min: number; max: number; conf?: number; n?: number };
  posted: string;
  src: string;
  contact: {
    name?: string;
    role?: string;
    email?: string;
    conf?: number;
    status: "found" | "searching" | "none";
  };
}
interface GESearch {
  id: string;
  q: string;
  chips: [string, string][];
  freq: string;
  active: boolean;
  newCount: number;
  last: string;
}
interface GEEmail {
  id: string;
  job?: string;
  to: string;
  role: string;
  co: string;
  email: string;
  conf: number;
  how?: string;
  status: "draft" | "sent" | "opened" | "replied" | "bounced";
  subject: string;
  body?: string;
  sent?: string;
  reply?: string;
  err?: string;
}
interface GEApp {
  id: string;
  stage: Stage;
  title: string;
  co: string;
  score: number;
  meta: string;
  flags: string[];
}
interface GESession {
  id: string;
  date: string;
  job: string;
  type: string;
  dur: string;
  score: number;
  r: [number, number, number, number];
}
interface GEDiff {
  id: string;
  sec: string;
  old: string;
  neu: string;
  why: string;
}
export interface GEData {
  USER: {
    name: string;
    first: string;
    email: string;
    college: string;
    degree: string;
    grad: string;
  };
  JOBS: GEJob[];
  SEARCHES: GESearch[];
  EMAILS: GEEmail[];
  APPS: GEApp[];
  SESSIONS: GESession[];
  PROFILE: unknown;
  DIFFS: GEDiff[];
}

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

export function loadPrototypeData(file = resolve(REPO_ROOT, "prototype/ge-data.js")): GEData {
  const sandbox: { window: { GEData?: GEData } } = { window: {} };
  runInNewContext(readFileSync(file, "utf8"), sandbox);
  if (!sandbox.window.GEData) throw new Error(`${file} did not define window.GEData`);
  return sandbox.window.GEData;
}

/* ---------- Field parsers ---------- */

/** The prototype's "today" (its data is dated late September 2026). */
export const SEED_NOW = new Date("2026-09-26T10:00:00+05:30");

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2h" / "1d" / "30m" relative to SEED_NOW. */
export function parseAgo(s: string, now = SEED_NOW): Date {
  const m = /^(\d+)\s*([mhd])$/.exec(s.trim());
  if (!m) return now;
  const n = Number(m[1]);
  const ms = { m: 60_000, h: 3_600_000, d: 86_400_000 }[m[2] as "m" | "h" | "d"];
  return new Date(now.getTime() - n * ms);
}

/** "Sep 21" → 2026-09-21 (IST noon). */
export function parseDay(s: string, year = 2026): Date {
  const m = /([A-Z][a-z]{2})\s+(\d{1,2})/.exec(s);
  if (!m) return SEED_NOW;
  const month = MONTHS.indexOf(m[1]!);
  return new Date(Date.UTC(year, month, Number(m[2]), 6, 30));
}

export function parseMode(s: string): WorkMode {
  const v = s.toLowerCase();
  if (v.startsWith("remote")) return "remote";
  if (v.startsWith("hybrid")) return "hybrid";
  return "on-site";
}

/** "0–2 yrs" → [0, 2]; "Fresher" → [0, 0]; "Internship" → [null, null]. */
export function parseExperience(s: string): [number | null, number | null] {
  const m = /(\d+)\s*[–-]\s*(\d+)/.exec(s);
  if (m) return [Number(m[1]), Number(m[2])];
  if (/fresher/i.test(s)) return [0, 0];
  return [null, null];
}

const CHIP_TYPES: Record<string, Chip["type"]> = {
  "map-pin": "location",
  wallet: "salary",
  code: "skill",
  briefcase: "role",
  globe: "type",
  "graduation-cap": "experience",
};
export function toChips(chips: [string, string][]): Chip[] {
  return chips.map(([icon, label]) => ({
    type: CHIP_TYPES[icon] ?? "role",
    icon,
    label,
    value: label,
  }));
}

export function dedupeHash(company: string, title: string, location: string): string {
  const norm = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  return createHash("sha256").update([company, title, location].map(norm).join("|")).digest("hex");
}

export function rubricFrom(r: [number, number, number, number]): RubricScores {
  return { communication: r[0], technical: r[1], structure: r[2], confidence: r[3] };
}

export function parseProfile(data: GEData): Profile {
  return ProfileSchema.parse(data.PROFILE);
}

/**
 * The job description shown on prototype/Job Detail.dc.html, which uses one text for every job.
 * "## " lines start sections; "- " lines are list items (the job detail page renders both).
 */
export function jobDescription(company: string): string {
  return [
    "## About the team",
    `${company}'s platform team owns the services that sit between merchants and banks: payment routing, retries, reconciliation and the event pipeline that feeds every downstream product. You'll join a group of eight engineers and ship to production in your first two weeks.`,
    "",
    "## What you'll do",
    "- Build and operate high-throughput services that process millions of events a day.",
    "- Design idempotent APIs for payment retries and webhooks.",
    "- Write design docs, review code, and take part in a lightweight on-call rotation.",
    "- Work with product and SRE to improve p99 latency and error budgets.",
    "",
    "## Benefits",
    "Health cover for you and your family, a learning budget, relocation support for Bengaluru, and a hybrid schedule with three office days a week.",
  ].join("\n");
}

/** Title patterns prototype/Saved Search.dc.html uses to pick each search's matches. */
const SEARCH_MATCH: Record<string, RegExp> = {
  s1: /backend|platform|api/i,
  s2: /frontend|react/i,
  s3: /security|intern/i,
};

/**
 * A saved search's results as the prototype shows them: matching titles first, padded with other
 * jobs to at least four (or its new count); the first `newCount` are unseen.
 */
export function searchResults(search: GESearch, jobs: GEJob[]): { jobId: string; seen: boolean }[] {
  const re = SEARCH_MATCH[search.id];
  let list = re ? jobs.filter((j) => re.test(j.title)) : [];
  const want = Math.max(4, search.newCount);
  if (list.length < want) list = [...list, ...jobs.filter((j) => !list.includes(j))].slice(0, want);
  const fresh = search.active ? Math.min(search.newCount, list.length) : 0;
  return list.map((j, i) => ({ jobId: j.id, seen: i >= fresh }));
}

/** The alerts hard-coded in prototype/Tracker.dc.html, keyed to their application. */
export const TRACKER_ALERTS: { day: string; action: string; title: string; co: string }[] = [
  { day: "Sep 27", action: "Submit take-home", title: "Frontend Engineer", co: "CRED" },
  { day: "Sep 28", action: "Follow up with Neha Gupta", title: "SDE-1, Consumer", co: "Swiggy" },
  { day: "Sep 29", action: "Round 1 interview, 11:00", title: "Graduate SWE", co: "Atlassian" },
  { day: "Oct 3", action: "Respond to offer", title: "SWE Intern → PPO", co: "Digitas India" },
];

/** The inbox in prototype/Outbox.dc.html (it is not in ge-data.js). `at` is IST. */
export const INBOX: {
  from: string;
  role: string;
  co: string;
  email: string;
  kind: "interview" | "reply" | "recruiter" | "update";
  subject: string;
  at: string;
  unread: boolean;
  text: string;
}[] = [
  {
    from: "Ananya Krishnan",
    role: "Engineering Manager, Payments",
    co: "Razorpay",
    email: "ananya.k@razorpay.com",
    kind: "interview",
    subject: "Re: Backend Engineer I, payments team",
    at: "2026-09-26T10:42:00+05:30",
    unread: true,
    text: "Hi Ashmit, thanks for reaching out. Your Kafka retry work lines up well with what we're building. Could you do a 45-minute technical round on Tuesday or Wednesday afternoon? I'll send an invite once you pick a slot.",
  },
  {
    from: "Karthik Rao",
    role: "Senior Engineer, Platform",
    co: "Zepto",
    email: "karthik.rao@zepto.co",
    kind: "reply",
    subject: "Re: SDE-1, Platform",
    at: "2026-09-26T09:15:00+05:30",
    unread: true,
    text: "Happy to refer you. Send me the tailored resume as a PDF and I'll put it in with a note to the hiring manager this week.",
  },
  {
    from: "Meera Iyer",
    role: "Talent Partner",
    co: "Atlassian",
    email: "miyer@atlassian.com",
    kind: "recruiter",
    subject: "Graduate engineer roles, Bengaluru",
    at: "2026-09-25T17:30:00+05:30",
    unread: false,
    text: "Hi Ashmit, I came across your profile and think you'd suit our 2027 graduate engineer intake. Are you open to a 20-minute call this week to talk through the process?",
  },
  {
    from: "Priya Menon",
    role: "Engineering Lead",
    co: "Freshworks",
    email: "priya.menon@freshworks.com",
    kind: "reply",
    subject: "Re: Frontend Engineer, Freddy AI",
    at: "2026-09-25T11:00:00+05:30",
    unread: false,
    text: "Thanks for the note. We've filled this role, but the Customer Service Suite team is hiring in November. I'll forward your details to their lead.",
  },
  {
    from: "Careers team",
    role: "Recruiting",
    co: "CRED",
    email: "careers@cred.club",
    kind: "update",
    subject: "Your take-home assignment",
    at: "2026-09-24T12:00:00+05:30",
    unread: false,
    text: "Your take-home is due by Sep 30, 23:59 IST. Submit the repository link using the form in the original email.",
  },
];

/**
 * Job Profile facts from prototype/Profile.dc.html's initial state that are not resume content.
 * Education, experience, skills and certifications come from the resume (docs/decisions.md D18).
 */
export const JOB_DETAILS = {
  pronouns: "he/him",
  headline: "Computer Engineering student · Backend (Go, Kafka) and iOS (SwiftUI)",
  dob: "",
  status: "Undergraduate",
  year: "2027",
  experience: "Under 1 year",
  availableFrom: "After graduation",
  roles: "Backend engineer, iOS developer, Full-stack engineer",
  jobTypes: ["Internship", "Full-time"],
  workModes: ["Remote", "Hybrid"],
  locations: "Bengaluru, Pune, Mumbai",
  workAuth: "Indian citizen",
  expectedSalary: "10 LPA",
  currentSalary: "",
  relocate: true,
  languages: [
    { name: "English", level: "Fluent" },
    { name: "Hindi", level: "Native" },
  ],
  links: { linkedin: "linkedin.com/in/ashmitjain", github: "github.com/ashmit27j" },
  gender: "Prefer not to say",
  disability: "Prefer not to say",
};

/** LinkedIn as rebuilt from the PDF export in prototype/Profiles.dc.html. */
export const LINKEDIN: { snapshot: LinkedinSnapshot; suggestions: LinkedinSuggestion[] } = {
  snapshot: {
    strength: 58,
    sections: [
      {
        icon: "user",
        title: "Headline",
        body: "Computer Engineering student · Backend (Go, Kafka) and iOS (SwiftUI)",
      },
      {
        icon: "align-left",
        title: "About",
        body: "I build backend services and iOS apps. Most recently: a Go ticketing backend that handled 900 scans a minute at a college fest.",
      },
      {
        icon: "graduation-cap",
        title: "Education",
        body: "MPSTME, NMIMS — B.Tech, Computer Engineering, 2023–2027",
      },
      {
        icon: "briefcase",
        title: "Experience",
        body: "iOS Development Intern, Digitas India (2025)\nWeb & UI/UX Development Intern, Synoris Information Systems (2024)",
      },
      {
        icon: "folder-git-2",
        title: "Projects",
        body: "festflow — Event ticketing backend with a Kafka scan queue\nnosh-ios — SwiftUI meal-planning app built with MVVM",
      },
      {
        icon: "code",
        title: "Skills",
        body: "Go · TypeScript · Swift · React · PostgreSQL · Kafka · Docker",
      },
    ],
  },
  suggestions: [
    {
      section: "Headline",
      old: "Student at NMIMS",
      new: "Computer Engineering student · Backend (Go, Kafka) and iOS (SwiftUI)",
      alts: [
        "Backend and iOS developer · Go, Kafka, SwiftUI · Computer Engineering at NMIMS",
        "Building backend services in Go and iOS apps in SwiftUI · NMIMS '27",
      ],
      reason: "Recruiters search headlines. This matches your main resume's skills.",
    },
    {
      section: "About",
      old: "Passionate about technology and learning new things.",
      new: "I build backend services and iOS apps. Most recently: a Go ticketing backend that handled 900 scans a minute at a college fest.",
      alts: [
        "Computer Engineering student who ships. I built a Go ticketing backend that scanned 900 tickets a minute at a college fest, and Nosh, a SwiftUI meal-planning app.",
        "I work across backend (Go, Kafka) and iOS (SwiftUI). My latest project handled 900 ticket scans a minute during a live college fest.",
      ],
      reason: "Leads with a concrete result instead of a general statement.",
    },
    {
      section: "Experience · Digitas India",
      old: "iOS intern.",
      new: "Built Nosh, a SwiftUI meal-planning app using MVVM; shipped onboarding and settings with the design team.",
      alts: [
        "Shipped onboarding and settings for Nosh, a SwiftUI meal-planning app, working with the design team on an MVVM codebase.",
        "Built core screens for Nosh (SwiftUI, MVVM), including onboarding and settings, alongside the design team.",
      ],
      reason: "Copies the stronger wording from your resume.",
    },
  ],
};

/** GitHub as read for the prototype's user (prototype/Profiles.dc.html). */
export const GITHUB: GithubSnapshot = {
  login: "ashmit27j",
  activity: "active this week",
  languages: [
    { name: "Go", pct: 38 },
    { name: "TypeScript", pct: 24 },
    { name: "Swift", pct: 18 },
    { name: "Python", pct: 12 },
    { name: "Shell", pct: 8 },
  ],
  repos: [
    {
      id: "festflow",
      name: "festflow",
      lang: "Go",
      stars: 41,
      desc: "Event ticketing backend with a Kafka scan queue.",
      topics: ["Go", "Kafka", "PostgreSQL", "Redis", "Docker"],
      readmeScore: 72,
      suggest: true,
      why: "Your strongest backend project. Go and Kafka appear in 9 of your saved jobs.",
      pinned: true,
    },
    {
      id: "nosh",
      name: "nosh-ios",
      lang: "Swift",
      stars: 18,
      desc: "SwiftUI meal-planning app built with MVVM.",
      topics: ["Swift", "SwiftUI"],
      readmeScore: 45,
      suggest: true,
      why: "Your only iOS project. Shows SwiftUI and MVVM from the Digitas internship.",
      pinned: true,
    },
    {
      id: "shipeasy",
      name: "shipeasy-web",
      lang: "TypeScript",
      stars: 7,
      desc: "Responsive storefront and prototypes for ShipEasy.",
      topics: ["TypeScript", "React", "Next.js"],
      readmeScore: 30,
      suggest: true,
      why: "Real client work in React. Lead with it for full-stack roles.",
      pinned: false,
    },
    {
      id: "limiter",
      name: "rate-limiter",
      lang: "Go",
      stars: 12,
      desc: "Token-bucket rate limiter with a Redis backend.",
      topics: ["Go", "Redis"],
      readmeScore: 20,
      suggest: true,
      why: "Small but on-topic. Rate limiting comes up in backend interviews.",
      pinned: false,
    },
    {
      id: "dotfiles",
      name: "dotfiles",
      lang: "Shell",
      stars: 2,
      desc: "Personal shell and editor config.",
      topics: ["Git"],
      readmeScore: 60,
      suggest: false,
      why: "Config repos rarely help recruiters. Unpin it.",
      pinned: true,
    },
    {
      id: "dsa",
      name: "dsa-practice",
      lang: "Python",
      stars: 3,
      desc: "Solutions to practice problems.",
      topics: ["Python"],
      readmeScore: 10,
      suggest: false,
      why: "Practice solutions read as coursework. Keep it public, but don't pin it.",
      pinned: true,
    },
  ],
};

/** The feedback report in prototype/Interview.dc.html, for the latest session (i5, Sep 24). */
export const LATEST_REPORT = {
  summary:
    "Clear answers on idempotency and queues. Structure dropped on the system-design question; lead with the approach before details.",
  answers: [
    {
      q: "Walk me through a project you're proud of.",
      score: 82,
      note: "Clear context and outcome. You named the 12k users and the queue design without being asked.",
      tip: "end with what you'd change next time.",
    },
    {
      q: "What happened when a Kafka consumer crashed mid-batch?",
      score: 80,
      note: "Correct on offset commits and upserts. Could name at-least-once delivery explicitly.",
      tip: "say the delivery guarantee out loud.",
    },
    {
      q: "How would you make a payment-retry endpoint idempotent?",
      score: 78,
      note: "Idempotency key and transaction boundary were right. Missed key expiry and what happens across regions.",
      tip: "mention a TTL on stored keys.",
    },
    {
      q: "Design a rate limiter for a public API.",
      score: 61,
      note: "Jumped into Redis commands before stating the algorithm.",
      tip: "state token bucket vs sliding window first, then trade-offs.",
    },
  ],
  metrics: { wpm: 142, fillers: 9 },
};
