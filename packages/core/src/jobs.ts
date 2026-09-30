import type { Chip } from "./schemas";
import type { ContactStatus, WorkMode } from "./domain";

/** A job as the job board shows it, joined with the user's match and save state. */
export interface JobCard {
  id: string;
  title: string;
  company: string;
  location: string;
  mode: WorkMode;
  experience: string;
  skills: string[];
  missing: string[];
  score: number | null;
  reason: string | null;
  salary:
    | { type: "stated"; min: number; max: number }
    | { type: "est"; min: number; max: number; confidence: number; samples: number }
    | null;
  /** ISO timestamp. */
  postedAt: string;
  sourceLabel: string;
  url: string | null;
  contact: { status: ContactStatus; name: string | null; role: string | null };
  saved: boolean;
  hidden: boolean;
}

/** Structured filters behind the Deep Search panel and saved searches. */
export interface JobFilters {
  type: "any" | "job" | "internship";
  roles: string[];
  locations: string[];
  modes: string[];
  experience: string[];
  /** LPA; 1–30 means "any". */
  salaryMin: number;
  salaryMax: number;
  skills: string[];
}

export const SALARY_RANGE = { min: 1, max: 30 } as const;

export const EMPTY_FILTERS: JobFilters = {
  type: "any",
  roles: [],
  locations: [],
  modes: [],
  experience: [],
  salaryMin: SALARY_RANGE.min,
  salaryMax: SALARY_RANGE.max,
  skills: [],
};

/** Options offered in the Deep Search filter groups (prototype/Jobs.dc.html). */
export const FILTER_OPTIONS = {
  roles: [
    "Backend",
    "Frontend",
    "Full-stack",
    "Platform",
    "Data",
    "Security",
    "iOS",
    "Mobile",
    "ML",
  ],
  locations: [
    "Bengaluru",
    "Mumbai",
    "Pune",
    "Hyderabad",
    "Chennai",
    "Delhi NCR",
    "Anywhere in India",
  ],
  modes: ["Remote", "Hybrid", "On-site"],
  experience: ["Internship", "0–1 yrs", "0–2 yrs", "1–3 yrs"],
  skills: [
    "Go",
    "Java",
    "Python",
    "TypeScript",
    "React",
    "Node.js",
    "Kafka",
    "SQL",
    "Swift",
    "Docker",
    "Kubernetes",
  ],
} as const;

const ROLE_PATTERNS: Record<string, RegExp> = {
  Backend: /backend|back-end|\bapi\b|platform/i,
  Frontend: /frontend|front-end/i,
  "Full-stack": /full[- ]?stack/i,
  Platform: /platform/i,
  Data: /\bdata\b/i,
  Security: /security/i,
  iOS: /\bios\b/i,
  Mobile: /\bios\b|android|mobile/i,
  ML: /\bml\b|machine learning/i,
  Graduate: /graduate|trainee|intern/i,
};

const lc = (s: string) => s.toLowerCase();

/** Years covered by an experience label: "0–2 yrs" → [0, 2], "Internship" → null. */
export function experienceYears(label: string): [number, number] | null {
  const range = /(\d+)\s*[–-]\s*(\d+)/.exec(label);
  if (range) return [Number(range[1]), Number(range[2])];
  const plus = /(\d+)\s*\+/.exec(label);
  if (plus) return [Number(plus[1]), 50];
  if (/fresher/i.test(label)) return [0, 0];
  return null;
}

const isInternship = (job: Pick<JobCard, "title" | "experience">) =>
  /intern/i.test(job.experience) || /\bintern(ship)?\b/i.test(job.title);

export function matchesFilters(job: JobCard, f: JobFilters): boolean {
  if (f.type === "internship" && !isInternship(job)) return false;
  if (f.type === "job" && isInternship(job)) return false;
  if (
    f.roles.length &&
    !f.roles.some((r) => (ROLE_PATTERNS[r] ?? new RegExp(escape(r), "i")).test(job.title))
  )
    return false;
  if (f.locations.length && !f.locations.includes("Anywhere in India")) {
    const ok = f.locations.some((l) =>
      /^remote/i.test(l)
        ? job.mode === "remote"
        : lc(job.location) === lc(l) || lc(job.location).includes(lc(l)),
    );
    if (!ok) return false;
  }
  if (f.modes.length && !f.modes.some((m) => lc(m).replace(/\s+/g, "-") === job.mode)) return false;
  if (f.experience.length) {
    const jobYears = experienceYears(job.experience);
    const ok = f.experience.some((e) => {
      if (/intern/i.test(e)) return isInternship(job);
      const want = experienceYears(e);
      if (!want) return lc(job.experience) === lc(e);
      if (!jobYears) return false;
      return jobYears[0] <= want[1] && want[0] <= jobYears[1];
    });
    if (!ok) return false;
  }
  if (job.salary) {
    if (f.salaryMin > SALARY_RANGE.min && job.salary.max < f.salaryMin) return false;
    if (f.salaryMax < SALARY_RANGE.max && job.salary.min > f.salaryMax) return false;
  } else if (f.salaryMin > SALARY_RANGE.min) return false;
  if (f.skills.length) {
    const have = new Set(job.skills.map(lc));
    if (!f.skills.some((s) => have.has(lc(s)))) return false;
  }
  return true;
}

function escape(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Number of active filter selections (salary counts once). */
export function countFilters(f: JobFilters): number {
  const salary = f.salaryMin > SALARY_RANGE.min || f.salaryMax < SALARY_RANGE.max ? 1 : 0;
  return (
    f.roles.length +
    f.locations.length +
    f.modes.length +
    f.experience.length +
    f.skills.length +
    salary +
    (f.type === "any" ? 0 : 1)
  );
}

/**
 * Deep Search's rule-based parse of a plain-English query into filters.
 * The LLM parser refines this when configured (docs/architecture.md).
 */
export function parseFilters(query: string): JobFilters {
  const t = lc(query);
  const has = (w: string) => t.includes(lc(w));
  const word = (w: string) => new RegExp(`\\b${escape(lc(w))}\\b`, "i").test(query);
  const salary = Number((/(\d+)\s*(?:lpa|lakh)/i.exec(query) ?? [])[1] ?? 0);
  return {
    type: /\bintern/.test(t) ? "internship" : "any",
    roles: FILTER_OPTIONS.roles.filter(word),
    locations: FILTER_OPTIONS.locations.filter((l) => l !== "Anywhere in India" && has(l)),
    modes: FILTER_OPTIONS.modes.filter((m) => has(m)),
    experience: /\bintern/.test(t) ? ["Internship"] : has("fresher") ? ["0–1 yrs"] : [],
    salaryMin:
      salary > 0
        ? Math.min(SALARY_RANGE.max, Math.max(SALARY_RANGE.min, salary))
        : SALARY_RANGE.min,
    salaryMax: SALARY_RANGE.max,
    skills: FILTER_OPTIONS.skills.filter(word),
  };
}

const CHIP_ICONS = {
  role: "briefcase",
  location: "map-pin",
  type: "globe",
  experience: "graduation-cap",
  salary: "wallet",
  skill: "code",
} as const;

/** Filters → the chip list stored on saved searches (saved_searches.filters). */
export function filtersToChips(f: JobFilters): Chip[] {
  const chips: Chip[] = [];
  const add = (type: Chip["type"], label: string, value = label) =>
    chips.push({ type, icon: CHIP_ICONS[type], label, value });
  if (f.type !== "any") add("type", f.type === "internship" ? "Internship" : "Job", f.type);
  f.locations.forEach((l) => add("location", l));
  f.modes.forEach((m) => add("type", m, `mode:${m}`));
  f.experience.forEach((e) => add("experience", e));
  if (f.salaryMin > SALARY_RANGE.min) add("salary", `≥ ₹${f.salaryMin} LPA`, String(f.salaryMin));
  f.skills.forEach((s) => add("skill", s));
  f.roles.forEach((r) => add("role", r));
  return chips;
}

/** Chip list → filters (inverse of filtersToChips; also accepts the hero/seed chip shapes). */
export function chipsToFilters(chips: Chip[]): JobFilters {
  const f: JobFilters = structuredClone(EMPTY_FILTERS);
  for (const c of chips) {
    if (c.type === "role") f.roles.push(c.value);
    else if (c.type === "skill") f.skills.push(c.value);
    else if (c.type === "location") f.locations.push(c.value === "Remote OK" ? "Remote" : c.value);
    else if (c.type === "experience")
      f.experience.push(/intern/i.test(c.value) ? "Internship" : c.label);
    else if (c.type === "salary") {
      const n = Number(/(\d+(?:\.\d+)?)/.exec(c.value)?.[1] ?? 0);
      if (n) f.salaryMin = Math.min(SALARY_RANGE.max, n);
    } else if (c.type === "type") {
      if (c.value.startsWith("mode:")) f.modes.push(c.value.slice(5));
      else if (/^remote$/i.test(c.value) || /^remote$/i.test(c.label)) f.locations.push("Remote");
      else if (/intern/i.test(c.value)) f.type = "internship";
      else if (c.value === "job") f.type = "job";
    }
  }
  return f;
}

/** "2h", "3d", "5w" relative to `now`. */
export function timeAgo(iso: string | Date, now: Date = new Date()): string {
  const s = Math.max(0, (now.getTime() - new Date(iso).getTime()) / 1000);
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))}m`;
  if (s < 86400) return `${Math.round(s / 3600)}h`;
  if (s < 86400 * 14) return `${Math.round(s / 86400)}d`;
  return `${Math.round(s / (86400 * 7))}w`;
}
