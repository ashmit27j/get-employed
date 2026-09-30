import type { LinkedinSnapshot, LinkedinSuggestion } from "./github";
import { profileSkills } from "./match";
import type { Profile } from "./schemas";

/*
 * Rule-based LinkedIn review (profile.import-linkedin): the text of the PDF export or the public
 * page → sections, a strength score and rewrites taken from the main resume. Gemini does this
 * better when configured; this keeps the page useful without it.
 */

/** What the import reads, from either source. */
export interface LinkedinText {
  name: string;
  headline: string;
  about: string;
  experience: string[];
  education: string[];
  skills: string[];
}

const HEADINGS: [RegExp, keyof LinkedinText][] = [
  [/^(summary|about)$/i, "about"],
  [/^experience$/i, "experience"],
  [/^education$/i, "education"],
  [/^(top skills|skills)$/i, "skills"],
];
const SKIP =
  /^(contact|languages|certifications|honors-awards|page \d+ of \d+|www\.linkedin\.com.*)$/i;

/** The LinkedIn "Save to PDF" export as text → its parts. */
export function parseLinkedinPdf(text: string): LinkedinText {
  const lines = text
    .replace(/\r/g, "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const out: LinkedinText = {
    name: "",
    headline: "",
    about: "",
    experience: [],
    education: [],
    skills: [],
  };
  let cur: keyof LinkedinText | null = null;
  const loose: string[] = [];
  for (const line of lines) {
    const h = HEADINGS.find(([re]) => re.test(line))?.[1];
    if (h) {
      cur = h;
      continue;
    }
    if (SKIP.test(line)) {
      cur = null;
      continue;
    }
    if (cur === "about") out.about = `${out.about} ${line}`.trim();
    else if (cur === "experience" || cur === "education" || cur === "skills") out[cur].push(line);
    else loose.push(line);
  }
  // The name and headline sit at the top of the main column, outside any section.
  const main = loose.filter((l) => !/@|\+?\d{5}|linkedin\.com|http/i.test(l));
  out.name = main[0] ?? "";
  out.headline = main[1] ?? "";
  return out;
}

const words = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0);

export function linkedinReviewRules(
  li: LinkedinText,
  profile: Profile,
): LinkedinSnapshot & { suggestions: LinkedinSuggestion[] } {
  const skills = profileSkills(profile);
  const sections = [
    { icon: "user-round", title: "Headline", body: li.headline },
    { icon: "align-left", title: "About", body: li.about },
    { icon: "graduation-cap", title: "Education", body: li.education.slice(0, 4).join("\n") },
    { icon: "briefcase", title: "Experience", body: li.experience.slice(0, 6).join("\n") },
    { icon: "code", title: "Skills", body: li.skills.slice(0, 12).join(" · ") },
  ].filter((s) => s.body.trim());

  const suggestions: LinkedinSuggestion[] = [];
  const topSkills = skills.slice(0, 4);
  const headlineHasSkill = topSkills.some((s) =>
    li.headline.toLowerCase().includes(s.toLowerCase()),
  );
  if (topSkills.length && (!li.headline || !headlineHasSkill)) {
    const role = profile.experience[0]?.role ?? "Engineering student";
    const next = `${role} · ${topSkills.slice(0, 3).join(", ")}`;
    suggestions.push({
      section: "Headline",
      old: li.headline || "(empty)",
      new: next,
      alts: [`${topSkills.slice(0, 3).join(" · ")} · open to roles`],
      reason: "Recruiters search headlines. This names the skills your resume shows.",
    });
  }
  if (profile.summary && words(li.about) < 25) {
    suggestions.push({
      section: "About",
      old: li.about || "(empty)",
      new: profile.summary,
      alts: [],
      reason: "A short About reads as unfinished. This uses your resume summary.",
    });
  }
  const bullet = profile.projects
    .flatMap((p) => p.bullets.map((b) => ({ p: p.name, b })))
    .find((x) => words(x.b) > 8);
  if (bullet && !li.experience.join(" ").includes(bullet.b.slice(0, 30))) {
    suggestions.push({
      section: `Projects · ${bullet.p}`,
      old: "(not on LinkedIn)",
      new: bullet.b,
      alts: [],
      reason: "Add this project; it backs the skills in your headline.",
    });
  }
  const missingSkills = skills
    .filter((s) => !li.skills.some((x) => x.toLowerCase() === s.toLowerCase()))
    .slice(0, 6);
  if (missingSkills.length && li.skills.length < 5) {
    suggestions.push({
      section: "Skills",
      old: li.skills.join(", ") || "(empty)",
      new: [...li.skills, ...missingSkills].join(", "),
      alts: [],
      reason: "Skills on your resume that your LinkedIn doesn't list.",
    });
  }

  const strength = Math.round(
    (li.headline ? 15 : 0) +
      (headlineHasSkill ? 10 : 0) +
      Math.min(20, words(li.about)) +
      Math.min(25, li.experience.length * 6) +
      (li.education.length ? 10 : 0) +
      Math.min(20, li.skills.length * 4),
  );
  return { sections, strength: Math.min(100, strength), suggestions };
}
