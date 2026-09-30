import { ProfileSchema, type Profile } from "./schemas";

/*
 * Rule-based resume parsing: plain text (from a PDF, DOCX or LaTeX file) → Profile.
 * resume.parse uses Gemini when configured; this keeps uploads working without it.
 */

const HEADINGS: [RegExp, string][] = [
  [/^(summary|profile|objective|about( me)?|professional summary)$/i, "summary"],
  [/^(education|academics?|academic (background|details|qualifications?))$/i, "education"],
  [
    /^((work |professional )?experience|internships?|employment( history)?|work history)$/i,
    "experience",
  ],
  [/^((academic |personal |key )?projects?)$/i, "projects"],
  [
    /^((technical |key |core )?skills|technologies|tech stack|tools)( ?& ?(tools|technologies))?$/i,
    "skills",
  ],
  [/^(certifications?|certificates|courses|licenses?( & certifications)?)$/i, "certifications"],
  [/^(achievements?|awards?( & achievements)?|honou?rs|accomplishments)$/i, "achievements"],
  [
    /^(leadership( & activities)?|positions? of responsibility|extra[- ]?curricular( activities)?|activities|volunteering)$/i,
    "leadership",
  ],
];

const BULLET = /^\s*([•●▪◦*·–-]|\d+[.)])\s+/;
const DATES =
  /((jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+)?\d{4}\s*(–|-|to)\s*(((jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+)?\d{4}|present|current|now)|((jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+)\d{4}/i;

const clean = (s: string) => s.replace(/\s+/g, " ").trim();

function headingOf(line: string): string | null {
  const t = clean(line.replace(/[:|_=*#]+$/g, "").replace(/^[#*\s]+/, ""));
  if (!t || t.length > 40) return null;
  return HEADINGS.find(([re]) => re.test(t))?.[1] ?? null;
}

function takeDates(line: string): { rest: string; dates: string } {
  const m = DATES.exec(line);
  if (!m) return { rest: clean(line), dates: "" };
  const dates = clean(m[0]).replace(/\s*(-|to)\s*/i, " – ");
  return { rest: clean(line.replace(m[0], " ").replace(/[|,–-]\s*$/, "")), dates };
}

/** Split "Role | Company" or "Company — Role" style lines. */
function splitPair(s: string): [string, string] {
  const parts = s
    .split(/\s+[|–—]\s+|\s+-\s+|,\s+|\s+at\s+|\s+@\s+/i)
    .map(clean)
    .filter(Boolean);
  return [parts[0] ?? s, parts.slice(1).join(", ")];
}

interface Block {
  head: string[];
  bullets: string[];
}

/** Group a section's lines into entries: header lines, then bullets. */
function blocks(lines: string[]): Block[] {
  const out: Block[] = [];
  let cur: Block | null = null;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      if (cur?.bullets.length) cur = null;
      continue;
    }
    if (BULLET.test(line)) {
      cur ??= { head: [], bullets: [] };
      if (!out.includes(cur)) out.push(cur);
      cur.bullets.push(clean(line.replace(BULLET, "")));
    } else if (cur && cur.bullets.length && /^[a-z(]/.test(line)) {
      // A wrapped bullet line.
      cur.bullets[cur.bullets.length - 1] += ` ${clean(line)}`;
    } else {
      if (!cur || cur.bullets.length) {
        cur = { head: [], bullets: [] };
        out.push(cur);
      }
      cur.head.push(line);
    }
  }
  return out.filter((b) => b.head.length || b.bullets.length);
}

export function parseResumeText(text: string, fallback: { name: string; email: string }): Profile {
  const lines = text.replace(/\r/g, "").split("\n");
  const sections: Record<string, string[]> = {};
  const top: string[] = [];
  let cur: string | null = null;
  for (const line of lines) {
    const h = headingOf(line);
    if (h) {
      cur = h;
      sections[h] ??= [];
      continue;
    }
    if (cur) sections[cur]!.push(line);
    else top.push(line);
  }

  const all = text;
  const email = /[\w.+-]+@[\w-]+\.[\w.-]+/.exec(all)?.[0] ?? fallback.email;
  const phone =
    /(\+?\d{1,3}[\s-]?)?\d{5}[\s-]?\d{5}|\+?\d[\d\s-]{8,14}\d/.exec(top.join(" "))?.[0]?.trim() ??
    "";
  const links = [
    ...all.matchAll(
      /(?:https?:\/\/)?(?:www\.)?(linkedin\.com\/in\/[\w-]+|github\.com\/[\w-]+|[\w-]+\.(?:dev|io|me)\b)/gi,
    ),
  ].map((m) => m[1]!);
  const name =
    top
      .map(clean)
      .find((l) => l && !/@|\d{5}|http|linkedin|github/i.test(l) && l.split(" ").length <= 5) ??
    fallback.name;
  const loc =
    top
      .join(" | ")
      .split(/[|•·]/)
      .map(clean)
      .find(
        (p) =>
          /,\s*(india|in)\b|bengaluru|bangalore|mumbai|pune|delhi|hyderabad|chennai|kolkata/i.test(
            p,
          ) && !/@/.test(p),
      ) ?? "";

  const education = blocks(sections.education ?? []).map((b) => {
    const joined = b.head.join(" | ");
    const { rest, dates } = takeDates(joined);
    const parts = rest
      .split(/\s*\|\s*|\s{2,}|,\s+(?=[A-Z])/)
      .map(clean)
      .filter(Boolean);
    const degreeIdx = parts.findIndex((p) =>
      /b\.?tech|b\.?e\b|bachelor|master|m\.?tech|mba|b\.?sc|m\.?sc|diploma|ph\.?d|12th|10th|hsc|ssc|class/i.test(
        p,
      ),
    );
    const scoreIdx = parts.findIndex((p) => /cgpa|gpa|%|percent/i.test(p));
    const degree = degreeIdx >= 0 ? parts[degreeIdx]! : (parts[1] ?? "");
    const school = parts.find((_, i) => i !== degreeIdx && i !== scoreIdx) ?? parts[0] ?? "";
    return { school, degree, score: scoreIdx >= 0 ? parts[scoreIdx]! : "", dates };
  });

  const experience = blocks(sections.experience ?? []).map((b) => {
    const { rest, dates } = takeDates(b.head.join(" | "));
    const [role, co] = splitPair(rest);
    return { role, co, bullets: b.bullets, dates };
  });

  const projects = blocks(sections.projects ?? []).map((b) => {
    const head = clean(b.head.join(" "));
    const { rest } = takeDates(head);
    const [name, stack] = rest.split(/\s+[|–—-]\s+|:\s+/).map(clean);
    return { name: name ?? rest, stack: stack ?? "", bullets: b.bullets };
  });

  const skills: { name: string; items: string[] }[] = [];
  for (const raw of sections.skills ?? []) {
    const line = clean(raw.replace(BULLET, ""));
    if (!line) continue;
    const m = /^([A-Za-z &/]{2,30}):\s*(.+)$/.exec(line);
    const items = (m ? m[2]! : line)
      .split(/[,;|•]/)
      .map(clean)
      .filter(Boolean);
    if (m) skills.push({ name: clean(m[1]!), items });
    else if (skills.at(-1)?.name === "Skills") skills.at(-1)!.items.push(...items);
    else skills.push({ name: "Skills", items });
  }

  const listOf = (key: string) =>
    (sections[key] ?? []).map((l) => clean(l.replace(BULLET, ""))).filter((l) => l.length > 2);

  return ProfileSchema.parse({
    contact: { name, email, phone, loc, links: [...new Set(links)] },
    summary: listOf("summary").join(" "),
    education,
    experience,
    projects,
    skills,
    certifications: listOf("certifications").map((l) => {
      const { rest, dates } = takeDates(l);
      const [n, issuer] = splitPair(rest);
      return { name: n, issuer, date: dates };
    }),
    achievements: listOf("achievements"),
    leadership: blocks(sections.leadership ?? []).map((b) => {
      const { rest, dates } = takeDates(b.head.join(" | "));
      const [role, org] = splitPair(rest);
      return { role, org, bullets: b.bullets, dates };
    }),
  });
}

/** LaTeX resume source → plain text the parser understands. */
export function latexToText(tex: string): string {
  return tex
    .replace(/(^|[^\\])%.*$/gm, "$1")
    .replace(/\\(section|subsection)\*?\{([^}]*)\}/g, "\n$2\n")
    .replace(/\\item\s*/g, "\n• ")
    .replace(
      /\\(textbf|textit|emph|underline|large|Large|small|scshape|bfseries)\{([^}]*)\}/g,
      "$2",
    )
    .replace(/\\href\{[^}]*\}\{([^}]*)\}/g, "$1")
    .replace(/\$\\cdot\$|\\cdot/g, " · ")
    .replace(/\\hfill/g, " | ")
    .replace(/\\\\/g, "\n")
    .replace(/--/g, "–")
    .replace(/\\(begin|end)\{[^}]*\}(\[[^\]]*\])?(\{[^}]*\})*/g, "\n")
    .replace(/\\[a-zA-Z]+\*?(\[[^\]]*\])?(\{[^}]*\})?/g, " ")
    .replace(/[{}]/g, "")
    .replace(/\\([&%$#_])/g, "$1")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n\n")
    .trim();
}
