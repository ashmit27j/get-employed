import { LINK_KINDS, type JobDetails, type LinkKind, type Profile } from "./schemas";

/** Which labelled link a URL belongs to ("github.com/…" → github). */
export function linkKindOf(url: string): LinkKind {
  const u = url.toLowerCase();
  if (u.includes("linkedin.com")) return "linkedin";
  if (u.includes("github.com")) return "github";
  if (u.includes("leetcode.com")) return "leetcode";
  return "portfolio";
}

/** Labelled links from the resume header's plain list. The first unlabelled one is the portfolio. */
export function linksFromContact(links: string[]): JobDetails["links"] {
  const out: JobDetails["links"] = {};
  for (const url of links) {
    const kind = linkKindOf(url);
    if (!out[kind]) out[kind] = url;
    else if (!out.other) out.other = url;
  }
  return out;
}

/** The resume header's links, in a fixed order, from the labelled ones. */
export function contactLinks(links: JobDetails["links"]): string[] {
  return LINK_KINDS.map((k) => links[k]?.trim() ?? "").filter(Boolean);
}

export const PROFILE_SECTIONS = [
  ["basics", "Basics"],
  ["status", "Current status"],
  ["prefs", "Job preferences"],
  ["education", "Education"],
  ["experience", "Experience"],
  ["skills", "Skills and languages"],
  ["certs", "Certifications"],
  ["links", "Links"],
  ["documents", "Documents"],
  ["voluntary", "Voluntary"],
] as const;
export type ProfileSection = (typeof PROFILE_SECTIONS)[number][0];

export const MIN_SKILLS = 5;

/** Profile strength a new account needs, saved, before the rest of the app unlocks. */
export const UNLOCK_PCT = 30;

/**
 * Profile strength (0–100) and per-section completion (prototype/Profile.dc.html). Certifications
 * are optional and never block completion; voluntary disclosures always count as done.
 */
export function profileCompletion(doc: Profile, d: JobDetails) {
  const c = doc.contact;
  const skills = doc.skills.reduce((n, g) => n + g.items.length, 0);
  const filled = [
    c.name,
    d.headline,
    c.email,
    c.phone,
    c.loc,
    d.status,
    d.year,
    d.roles,
    d.locations,
    d.expectedSalary,
    doc.education.length,
    doc.experience.length,
    skills >= MIN_SKILLS,
    doc.certifications.length,
    d.links.linkedin,
    d.links.github,
    d.links.portfolio,
    d.documents.length,
    d.languages.length,
    d.dob,
  ];
  const pct = Math.round((filled.filter(Boolean).length / filled.length) * 100);
  const done: Record<ProfileSection, boolean> = {
    basics: !!(c.name && c.email && c.phone && c.loc && d.dob),
    status: !!d.status,
    prefs: !!(d.roles && d.locations),
    education: doc.education.length > 0,
    experience: doc.experience.length > 0,
    skills: skills >= MIN_SKILLS,
    certs: doc.certifications.length > 0,
    links: !!(d.links.linkedin && d.links.github && d.links.portfolio),
    documents: d.documents.length > 0,
    voluntary: true,
  };
  const tier = pct >= 85 ? ("Strong" as const) : pct >= 60 ? ("Good" as const) : ("Basic" as const);
  return { pct, done, tier, skills, doneCount: PROFILE_SECTIONS.filter(([id]) => done[id]).length };
}
