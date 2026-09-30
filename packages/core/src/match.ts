import { experienceYears } from "./jobs";
import type { WorkMode } from "./domain";
import type { Profile } from "./schemas";

/**
 * Rule-based parts of matching (docs/architecture.md: match scoring lives in core).
 * The worker's match.compute stores the headline score, reason and missing skills; these helpers
 * explain a score on the job detail page and are always computed from the current profile.
 */

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9+#]+/g, " ")
    .trim();

/** Whole-word, case-insensitive mention of a skill ("Go" must not match "good"). */
export function mentions(text: string, skill: string): boolean {
  const t = ` ${norm(text)} `;
  const k = norm(skill);
  return k.length > 0 && t.includes(` ${k} `);
}

/** Every skill listed in the profile's skill groups. */
export function profileSkills(profile: Profile): string[] {
  return profile.skills.flatMap((g) => g.items);
}

export function hasSkill(profile: Profile, skill: string): boolean {
  return profileSkills(profile).some((s) => norm(s) === norm(skill));
}

/** Where a skill shows up in the profile, e.g. "FestFlow, Synoris" or "3 projects". */
export function skillEvidence(profile: Profile, skill: string): string | null {
  const sources = [
    ...profile.projects
      .filter((p) => mentions([p.stack, p.name, ...p.bullets].join(" "), skill))
      .map((p) => p.name),
    ...profile.experience
      .filter((e) => mentions([e.role, ...e.bullets].join(" "), skill))
      .map((e) => e.co.split(/\s+/)[0]!),
  ];
  if (sources.length === 0) return null;
  if (sources.length > 2) return `${sources.length} projects`;
  return sources.join(", ");
}

export interface MatchBreakdown {
  skills: { have: number; total: number; value: number };
  experience: number;
  location: number;
  projects: number;
  /** Points tailoring could add by surfacing skills a project uses but its bullets don't mention. */
  gain: number;
  gainNote: string | null;
}

/** Years a user's experience level covers ("Student or intern" → 0–1). */
function levelYears(level: string | null | undefined): [number, number] {
  if (!level) return [0, 2];
  if (/student|intern|fresher/i.test(level)) return [0, 1];
  return experienceYears(level) ?? [0, 2];
}

function experienceFit(jobExperience: string, level: string | null | undefined): number {
  if (/intern/i.test(jobExperience)) return /student|intern/i.test(level ?? "") ? 100 : 80;
  const job = experienceYears(jobExperience);
  if (!job) return 80;
  const [lo, hi] = levelYears(level);
  if (hi < job[0]) return Math.max(40, 95 - (job[0] - hi) * 20);
  if (lo > job[1]) return 70;
  return 95;
}

function locationFit(location: string, mode: WorkMode, preferred: string[]): number {
  if (preferred.length === 0) return 80;
  const wantsRemote = preferred.some((p) => /remote|anywhere/i.test(p));
  if (mode === "remote") return wantsRemote ? 100 : 85;
  if (preferred.some((p) => norm(location).includes(norm(p)) || norm(p).includes(norm(location))))
    return 100;
  return mode === "hybrid" ? 50 : 40;
}

const joinAnd = (xs: string[]) =>
  xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}`;

export function matchBreakdown(input: {
  profile: Profile;
  job: {
    skills: string[];
    missing: string[];
    experience: string;
    location: string;
    mode: WorkMode;
  };
  experienceLevel?: string | null;
  preferredLocations?: string[];
}): MatchBreakdown {
  const { profile, job } = input;
  const total = job.skills.length;
  const matched = job.skills.filter((s) => !job.missing.includes(s));
  const have = matched.length;

  // Project relevance: share of matched skills backed by a project or role, not just the skills list.
  const backed = matched.filter((s) => skillEvidence(profile, s));
  const projects = have === 0 ? 0 : Math.round(60 + (40 * backed.length) / have);

  // Tailoring gain: a project's stack names the skill but none of its bullets do.
  const surfacing = profile.projects.flatMap((p) =>
    matched
      .filter((s) => mentions(p.stack, s) && !p.bullets.some((b) => mentions(b, s)))
      .map((s) => ({ project: p.name, skill: s })),
  );
  const gain = Math.min(12, surfacing.length * 2);
  const first = surfacing[0];
  const gainNote = first
    ? `Tailoring can add ~${gain} by surfacing ${first.project}'s ${joinAnd(
        surfacing
          .filter((x) => x.project === first.project)
          .slice(0, 2)
          .map((x) => x.skill),
      )} work.`
    : null;

  return {
    skills: { have, total, value: total === 0 ? 100 : Math.round((100 * have) / total) },
    experience: experienceFit(job.experience, input.experienceLevel),
    location: locationFit(job.location, job.mode, input.preferredLocations ?? []),
    projects,
    gain,
    gainNote,
  };
}
