import { mentions } from "./match";
import type { Profile } from "./schemas";

/**
 * Rule-based ATS scoring (docs/architecture.md: ATS scoring lives in core). It rewards what
 * applicant tracking systems parse and recruiters skim: the posting's keywords (anywhere, and
 * used in the summary or bullets rather than only listed under Skills), numbers in bullets,
 * complete sections and bullets of a readable length.
 */

export interface AtsResult {
  score: number;
  keywords: { found: string[]; missing: string[] };
  /** 0–100 per factor. */
  parts: { keywords: number; context: number; numbers: number; sections: number; bullets: number };
  /** The weakest factor, as one sentence ("Few bullets have numbers yet."). */
  tip: string | null;
}

const WEIGHTS = { keywords: 0.35, context: 0.2, numbers: 0.2, sections: 0.1, bullets: 0.15 };

export function allBullets(doc: Profile): string[] {
  return [
    ...doc.experience.flatMap((x) => x.bullets),
    ...doc.projects.flatMap((x) => x.bullets),
    ...doc.leadership.flatMap((x) => x.bullets),
    ...doc.achievements,
  ].filter((b) => b.trim());
}

/** Every piece of text on the resume, for keyword matching. */
export function resumeText(doc: Profile): string {
  return [
    doc.summary,
    ...doc.experience.flatMap((x) => [x.role, x.co]),
    ...doc.projects.flatMap((x) => [x.name, x.stack]),
    ...doc.leadership.flatMap((x) => [x.role, x.org]),
    ...doc.certifications.map((c) => c.name),
    ...doc.skills.flatMap((g) => g.items),
    ...allBullets(doc),
  ].join("\n");
}

/**
 * Score a resume against keywords. Pass one posting's skills, or the combined skills of many
 * postings (repeat a keyword to weight it).
 */
export function atsScore(doc: Profile, keywords: string[]): AtsResult {
  const text = resumeText(doc);
  const weight = new Map<string, number>();
  for (const k of keywords) if (k.trim()) weight.set(k, (weight.get(k) ?? 0) + 1);
  const found = [...weight.keys()].filter((k) => mentions(text, k));
  const missing = [...weight.keys()].filter((k) => !found.includes(k));
  const total = [...weight.values()].reduce((a, b) => a + b, 0);
  const hit = found.reduce((a, k) => a + weight.get(k)!, 0);
  const keywordsPart = total === 0 ? 100 : (100 * hit) / total;

  const bullets = allBullets(doc);
  // Keywords shown in use: in the summary or a bullet, not just a skills list or a stack line.
  const prose = [doc.summary, ...bullets].join("\n");
  const inUse = found.filter((k) => mentions(prose, k)).reduce((a, k) => a + weight.get(k)!, 0);
  const context = total === 0 ? 100 : (100 * inUse) / total;

  const withNumbers = bullets.filter((b) => /\d/.test(b)).length;
  // Numbers in 60% of bullets is full marks.
  const numbers =
    bullets.length === 0 ? 0 : Math.min(100, (100 * withNumbers) / (bullets.length * 0.6));

  const sectionChecks = [
    !!doc.contact.email && !!doc.contact.phone,
    doc.summary.trim().length > 0,
    doc.education.length > 0,
    doc.experience.length + doc.projects.length > 0,
    doc.skills.some((g) => g.items.length > 0),
  ];
  const sections = (100 * sectionChecks.filter(Boolean).length) / sectionChecks.length;

  const words = (b: string) => b.trim().split(/\s+/).length;
  const readable = bullets.filter((b) => words(b) >= 8 && words(b) <= 32).length;
  const bulletPart = bullets.length === 0 ? 0 : (100 * readable) / bullets.length;

  const parts = {
    keywords: Math.round(keywordsPart),
    context: Math.round(context),
    numbers: Math.round(numbers),
    sections: Math.round(sections),
    bullets: Math.round(bulletPart),
  };
  const score = Math.round(
    parts.keywords * WEIGHTS.keywords +
      parts.context * WEIGHTS.context +
      parts.numbers * WEIGHTS.numbers +
      parts.sections * WEIGHTS.sections +
      parts.bullets * WEIGHTS.bullets,
  );
  const TIPS: Record<keyof typeof parts, string> = {
    keywords: missing.length
      ? `Missing keywords: ${missing.slice(0, 3).join(", ")}.`
      : "Keywords are covered.",
    context: "Key skills are listed but not shown in your bullets.",
    numbers: "Few bullets have numbers yet.",
    sections: "Some sections are empty.",
    bullets: "Some bullets are too short or too long to skim.",
  };
  // The tip names the factor that costs the most points.
  const shortfall = (k: keyof typeof parts) => (100 - parts[k]) * WEIGHTS[k];
  const weakest = (Object.keys(parts) as (keyof typeof parts)[])
    .filter((k) => parts[k] < 80)
    .sort((a, b) => shortfall(b) - shortfall(a))[0];
  return { score, keywords: { found, missing }, parts, tip: weakest ? TIPS[weakest] : null };
}

export interface ResumeDiff {
  id: string;
  section: string;
  old: string;
  new: string;
  reason: string;
  status: "pending" | "accepted" | "rejected";
}

/**
 * The resume with accepted rewrites applied. A diff replaces the bullet (or skills line, as
 * "Group: a, b, c") whose text equals `old`.
 */
export function applyDiffs(
  doc: Profile,
  diffs: Pick<ResumeDiff, "old" | "new" | "status">[],
): Profile {
  const accepted = new Map(
    diffs.filter((d) => d.status === "accepted").map((d) => [d.old.trim(), d.new]),
  );
  if (accepted.size === 0) return doc;
  const swap = (t: string) => accepted.get(t.trim()) ?? t;
  const skills = doc.skills.map((g) => {
    const line = accepted.get(`${g.name}: ${g.items.join(", ")}`);
    if (!line) return g;
    const [name, list = ""] = line.split(/:\s*/, 2) as [string, string?];
    return {
      name: name.trim() || g.name,
      items: list
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };
  });
  return {
    ...doc,
    summary: swap(doc.summary),
    experience: doc.experience.map((x) => ({ ...x, bullets: x.bullets.map(swap) })),
    projects: doc.projects.map((x) => ({ ...x, bullets: x.bullets.map(swap) })),
    leadership: doc.leadership.map((x) => ({ ...x, bullets: x.bullets.map(swap) })),
    achievements: doc.achievements.map(swap),
    skills,
  };
}

const tex = (t: string) =>
  String(t ?? "")
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/([&%$#_{}])/g, "\\$1")
    .replace(/~/g, "\\textasciitilde{}");

/** The LaTeX source for a resume (prototype/Resume.dc.html `toLatex`). */
export function toLatex(d: Profile, templateName: string): string {
  const c = d.contact;
  const L: string[] = [
    `% ${templateName} template · generated by GetEmployed`,
    "\\documentclass[10pt,a4paper]{article}",
    "\\usepackage[margin=0.6in]{geometry}",
    "\\usepackage{titlesec,enumitem}",
    "\\titleformat{\\section}{\\bfseries\\uppercase}{}{0em}{}[\\titlerule]",
    "\\setlist{nosep,leftmargin=1.2em}",
    "\\pagestyle{empty}",
    "",
    "\\begin{document}",
    "\\begin{center}",
    `  {\\Large\\bfseries ${tex(c.name)}}\\\\`,
    `  ${[c.email, c.phone, c.loc, ...c.links].filter(Boolean).map(tex).join(" $\\cdot$ ")}`,
    "\\end{center}",
    "",
  ];
  const items = (bs: string[]) => {
    L.push("\\begin{itemize}");
    bs.filter((b) => b.trim()).forEach((b) => L.push(`  \\item ${tex(b)}`));
    L.push("\\end{itemize}");
  };
  if (d.summary.trim()) L.push("\\section{Summary}", tex(d.summary), "");
  L.push("\\section{Education}");
  d.education.forEach((x) =>
    L.push(
      `\\textbf{${tex(x.school)}} -- ${tex(x.degree)}${x.score ? `, ${tex(x.score)}` : ""} \\hfill ${tex(x.dates)}\\\\`,
    ),
  );
  L.push("", "\\section{Experience}");
  d.experience.forEach((x) => {
    L.push(`\\textbf{${tex(x.role)}}, ${tex(x.co)} \\hfill ${tex(x.dates)}`);
    items(x.bullets);
  });
  L.push("", "\\section{Projects}");
  d.projects.forEach((x) => {
    L.push(`\\textbf{${tex(x.name)}}${x.stack ? ` -- ${tex(x.stack)}` : ""}`);
    items(x.bullets);
  });
  L.push("", "\\section{Skills}");
  d.skills.forEach((g) => L.push(`\\textbf{${tex(g.name)}:} ${tex(g.items.join(", "))}\\\\`));
  const certs = d.certifications.filter((x) => x.name);
  if (certs.length) {
    L.push("", "\\section{Certifications}");
    certs.forEach((x) =>
      L.push(
        `\\textbf{${tex(x.name)}}${x.issuer ? ` -- ${tex(x.issuer)}` : ""} \\hfill ${tex(x.date)}\\\\`,
      ),
    );
  }
  const ach = d.achievements.filter((a) => a.trim());
  if (ach.length) {
    L.push("", "\\section{Achievements}");
    items(ach);
  }
  if (d.leadership.length) L.push("", "\\section{Leadership \\& Activities}");
  d.leadership.forEach((x) => {
    L.push(`\\textbf{${tex(x.role)}}, ${tex(x.org)} \\hfill ${tex(x.dates)}`);
    items(x.bullets);
  });
  L.push("", "\\end{document}");
  return L.join("\n");
}
