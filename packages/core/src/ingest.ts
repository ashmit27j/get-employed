import type { WorkMode } from "./domain";

/*
 * Normalising raw postings from every source into the jobs row shape (docs/job-ingestion.md).
 * Pure functions, shared by the worker and its tests.
 */

/** What a source adapter returns before normalising. */
export interface RawJob {
  sourceKey: string;
  sourceLabel: string;
  externalId: string;
  title: string;
  company: string;
  location: string;
  url: string | null;
  description: string;
  postedAt: string | null;
  /** From the source when it says so explicitly. */
  remote?: boolean;
  workplace?: string | null;
  /** Stated pay, in rupees per year. */
  salaryMin?: number | null;
  salaryMax?: number | null;
}

const CITY_ALIASES: [RegExp, string][] = [
  [/\b(bengaluru|bangalore|blr)\b/i, "Bengaluru"],
  [/\b(mumbai|bombay|navi mumbai|thane)\b/i, "Mumbai"],
  [/\b(pune)\b/i, "Pune"],
  [/\b(hyderabad|secunderabad)\b/i, "Hyderabad"],
  [/\b(chennai|madras)\b/i, "Chennai"],
  [/\b(delhi|new delhi|gurgaon|gurugram|noida|ncr|faridabad|ghaziabad)\b/i, "Delhi NCR"],
  [/\b(kolkata|calcutta)\b/i, "Kolkata"],
  [/\b(ahmedabad)\b/i, "Ahmedabad"],
  [/\b(jaipur)\b/i, "Jaipur"],
  [/\b(kochi|cochin|trivandrum|thiruvananthapuram)\b/i, "Kerala"],
  [/\b(chandigarh|mohali)\b/i, "Chandigarh"],
  [/\b(indore)\b/i, "Indore"],
  [/\b(coimbatore)\b/i, "Coimbatore"],
];

/** "Bengaluru-VTP, India" → "Bengaluru"; unknown Indian places keep their first part. */
export function normaliseLocation(raw: string): string {
  const s = raw.trim();
  for (const [re, city] of CITY_ALIASES) if (re.test(s)) return city;
  if (/remote/i.test(s)) return "Remote";
  const first = s.split(/[,;/|-]/)[0]?.trim() ?? s;
  return first ? first.replace(/\b\w/g, (c) => c.toUpperCase()) : "India";
}

/** Keeps postings based in India, or remote ones open to India. */
export function isIndia(raw: {
  location: string;
  description?: string;
  remote?: boolean;
}): boolean {
  const loc = raw.location;
  if (/\bindia\b|\bIN\b/.test(loc)) return true;
  if (CITY_ALIASES.some(([re]) => re.test(loc))) return true;
  if (
    (raw.remote || /remote/i.test(loc)) &&
    /\b(india|apac|asia)\b/i.test(`${loc} ${raw.description ?? ""}`)
  )
    return true;
  return false;
}

export function normaliseMode(raw: {
  location: string;
  description: string;
  remote?: boolean;
  workplace?: string | null;
}): WorkMode {
  const w = (raw.workplace ?? "").toLowerCase();
  if (w.includes("remote") || raw.remote) return "remote";
  if (w.includes("hybrid")) return "hybrid";
  if (w.includes("onsite") || w.includes("on-site")) return "on-site";
  const t = `${raw.location} ${raw.description.slice(0, 3000)}`;
  if (/\bremote\b/i.test(raw.location)) return "remote";
  if (/\bhybrid\b/i.test(t)) return "hybrid";
  if (/\b(fully remote|remote[- ]first|work from home|wfh)\b/i.test(t)) return "remote";
  return "on-site";
}

/** Titles this product is for: software, data, ML, QA, security, infra and product/UX roles. */
export function isTechRole(title: string): boolean {
  const t = title.toLowerCase();
  if (
    /\b(sales|account executive|account manager|recruit|talent|legal|counsel|accountant|audit|finance|payable|receivable|hr\b|human resources|risk|compliance|marketing|content|creative|communications?|video|graphic|customer (support|success|service)|operations specialist|business development|collections|procurement)\b/.test(
      t,
    )
  )
    return /\b(engineer|developer|sde)\b/.test(t) && !/\b(sales|customer success)\b/.test(t);
  return /\b(engineer|engineering|developer|sde|swe|software|programmer|devops|sre|site reliability|data (scientist|engineer|analyst)|analytics engineer|machine learning|\bml\b|\bai\b|scientist|architect|qa|sdet|test automation|security|frontend|front-end|backend|back-end|full[- ]?stack|mobile|android|ios|product manager|product designer|ux designer|cloud|platform|infrastructure|firmware|embedded|technical program manager)\b/.test(
    t,
  );
}

/** "0–2 yrs", "3–5 yrs", "5+ yrs", "Internship" from the title and description. */
export function normaliseExperience(
  title: string,
  description: string,
): { label: string; min: number | null; max: number | null } {
  if (/\bintern(ship)?\b/i.test(title)) return { label: "Internship", min: 0, max: 0 };
  // Seniority in the title outranks a number in the text ("1–2 years" of some tool).
  const senior = /\b(senior|sr\.?|staff|principal|lead|manager|head|director|architect)\b/i.test(
    title,
  );
  const text = description.slice(0, 6000);
  const range = /(\d{1,2})\s*(?:\+\s*)?(?:-|–|to)\s*(\d{1,2})\s*\+?\s*(?:years|yrs)/i.exec(text);
  if (range) {
    const a = Number(range[1]);
    const b = Number(range[2]);
    if (a <= b && b <= 30 && (!senior || a >= 3)) return { label: `${a}–${b} yrs`, min: a, max: b };
  }
  const plus =
    /(\d{1,2})\s*\+\s*(?:years|yrs)|(?:minimum|at least|min\.?)\s*(?:of\s*)?(\d{1,2})\s*(?:years|yrs)/i.exec(
      text,
    );
  if (plus) {
    const n = Number(plus[1] ?? plus[2]);
    if (n <= 30 && (!senior || n >= 3)) return { label: `${n}+ yrs`, min: n, max: null };
  }
  if (senior) return { label: "5+ yrs", min: 5, max: null };
  if (
    /\b(graduate|fresher|new grad|entry|junior|jr\.?|trainee|associate|sde[- ]?1|sde i\b|engineer i\b|level 1)\b/i.test(
      title,
    )
  )
    return { label: "0–2 yrs", min: 0, max: 2 };
  if (/\b(sde[- ]?2|sde ii|engineer ii)\b/i.test(title))
    return { label: "2–5 yrs", min: 2, max: 5 };
  return { label: "1–3 yrs", min: 1, max: 3 };
}

/** Rupees per year → LPA, one decimal. Monthly stipends (under ₹2 L) are annualised. */
export function toLpa(
  rupees: number | null | undefined,
  period: "year" | "month" = "year",
): number | null {
  if (!rupees || rupees <= 0) return null;
  const yearly = period === "month" ? rupees * 12 : rupees;
  return Math.round((yearly / 100_000) * 10) / 10;
}

/** Salary stated in the text: "₹12–18 LPA", "12 - 18 lakhs", "₹40,000/month". */
export function statedSalary(text: string): { min: number; max: number } | null {
  const lpa =
    /(?:₹|rs\.?|inr)?\s*(\d{1,3}(?:\.\d)?)\s*(?:-|–|to)\s*(\d{1,3}(?:\.\d)?)\s*(?:lpa|lakhs?|l\b)/i.exec(
      text,
    );
  if (lpa) {
    const a = Number(lpa[1]);
    const b = Number(lpa[2]);
    if (a > 0 && a <= b && b < 500) return { min: a, max: b };
  }
  const month =
    /(?:₹|rs\.?|inr)\s*(\d{1,3}(?:,\d{3})+|\d{4,6})\s*(?:\/|per)\s*(?:month|mo)\b/i.exec(text);
  if (month) {
    const v = toLpa(Number(month[1]!.replace(/,/g, "")), "month");
    if (v) return { min: v, max: v };
  }
  return null;
}

const HTML_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  "#39": "'",
  nbsp: " ",
};

/** Greenhouse and friends send escaped HTML: unescape, drop tags, keep paragraphs as newlines. */
export function htmlToText(html: string): string {
  const unescaped = html.replace(
    /&(amp|lt|gt|quot|#39|nbsp);/g,
    (_, e: string) => HTML_ENTITIES[e] ?? "",
  );
  return unescaped
    .replace(/<\s*(br|\/p|\/div|\/li|\/h\d)\s*\/?>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, "")
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (_, e: string) => HTML_ENTITIES[e] ?? "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .trim();
}

const normKey = (s: string) =>
  s
    .toLowerCase()
    .replace(
      /\b(pvt|private|ltd|limited|inc|llp|technologies|technology|software|labs|india)\b/g,
      "",
    )
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/** Same company + title + city from any source is one job (FNV-1a, hex). */
export function dedupeHash(company: string, title: string, city: string): string {
  const s = `${normKey(company)}|${normKey(title)}|${normKey(city)}`;
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < s.length; i++) {
    h1 = Math.imul(h1 ^ s.charCodeAt(i), 16777619) >>> 0;
    h2 = Math.imul(h2 ^ s.charCodeAt(i), 2246822519) >>> 0;
  }
  return h1.toString(16).padStart(8, "0") + h2.toString(16).padStart(8, "0");
}

/** Skills dictionary: display name → patterns. Order is the display order. */
const SKILLS: [string, RegExp][] = [
  ["Go", /\b(golang|go(?= (?:lang|developer|engineer|services|microservices))|in go\b|go,)/i],
  ["Java", /\bjava\b(?!script)/i],
  ["Python", /\bpython\b/i],
  ["TypeScript", /\btypescript\b|\bts\b(?=[,/ ]+(?:node|react))/i],
  ["JavaScript", /\bjavascript\b|\bjs\b/i],
  ["Kotlin", /\bkotlin\b/i],
  ["Swift", /\bswift(ui)?\b/i],
  ["C++", /\bc\+\+|\bcpp\b/i],
  ["C#", /\bc#|\.net\b/i],
  ["Rust", /\brust\b/i],
  ["Scala", /\bscala\b/i],
  ["Ruby", /\bruby\b|\brails\b/i],
  ["PHP", /\bphp\b/i],
  ["React", /\breact(\.js|js)?\b(?! native)/i],
  ["React Native", /\breact native\b/i],
  ["Next.js", /\bnext\.?js\b/i],
  ["Angular", /\bangular\b/i],
  ["Vue", /\bvue(\.js)?\b/i],
  ["Node.js", /\bnode(\.js|js)?\b/i],
  ["Spring", /\bspring( boot)?\b/i],
  ["Django", /\bdjango\b/i],
  ["Flask", /\bflask\b/i],
  ["FastAPI", /\bfastapi\b/i],
  ["gRPC", /\bgrpc\b/i],
  ["GraphQL", /\bgraphql\b/i],
  ["Kafka", /\bkafka\b/i],
  ["RabbitMQ", /\brabbitmq\b/i],
  ["Redis", /\bredis\b/i],
  ["PostgreSQL", /\bpostgres(ql)?\b/i],
  ["MySQL", /\bmysql\b/i],
  ["MongoDB", /\bmongo(db)?\b/i],
  ["Cassandra", /\bcassandra\b/i],
  ["Elasticsearch", /\belastic ?search\b/i],
  ["SQL", /\bsql\b/i],
  ["Spark", /\b(apache )?spark\b/i],
  ["Airflow", /\bairflow\b/i],
  ["Snowflake", /\bsnowflake\b/i],
  ["Pandas", /\bpandas\b/i],
  ["PyTorch", /\bpytorch\b/i],
  ["TensorFlow", /\btensorflow\b/i],
  ["LLMs", /\bllms?\b|large language model/i],
  ["AWS", /\baws\b|amazon web services/i],
  ["GCP", /\bgcp\b|google cloud/i],
  ["Azure", /\bazure\b/i],
  ["Docker", /\bdocker\b/i],
  ["Kubernetes", /\bkubernetes\b|\bk8s\b/i],
  ["Terraform", /\bterraform\b/i],
  ["Linux", /\blinux\b/i],
  ["Git", /\bgit\b(?!hub)/i],
  ["CI/CD", /\bci\/cd\b|continuous integration/i],
  ["Microservices", /\bmicro-?services\b/i],
  ["System design", /\bsystem design\b|distributed systems/i],
  ["Android", /\bandroid\b/i],
  ["iOS", /\bios\b/i],
  ["Figma", /\bfigma\b/i],
  ["Selenium", /\bselenium\b/i],
  ["Tableau", /\btableau\b/i],
  ["Power BI", /\bpower ?bi\b/i],
  ["Excel", /\bexcel\b/i],
];

/** Skills a posting mentions, from the dictionary, in dictionary order, at most 12. */
export function dictionarySkills(text: string): string[] {
  return SKILLS.filter(([, re]) => re.test(text))
    .map(([name]) => name)
    .slice(0, 12);
}

/** A title family for salary comparisons: "Senior Backend Engineer" → "backend". */
export function titleFamily(title: string): string {
  const t = title.toLowerCase();
  const fams: [RegExp, string][] = [
    [/\bintern/, "intern"],
    [/data (scien|analy)|analyst/, "data"],
    [/machine learning|\bml\b|\bai\b/, "ml"],
    [/devops|sre|site reliability|platform|infra|cloud/, "platform"],
    [/front[- ]?end|\bui\b/, "frontend"],
    [/android|ios|mobile/, "mobile"],
    [/full[- ]?stack/, "fullstack"],
    [/back[- ]?end|api|server/, "backend"],
    [/qa|test|quality/, "qa"],
    [/security/, "security"],
    [/product manager/, "product"],
    [/design/, "design"],
  ];
  return fams.find(([re]) => re.test(t))?.[1] ?? "software";
}

/**
 * Rough market bands (LPA) by family and experience, used only when no comparable job states a
 * salary. Confidence stays low; comparable-job estimates replace these as data comes in.
 */
export function priorSalaryBand(
  family: string,
  minYears: number | null,
): { min: number; max: number } {
  if (family === "intern") return { min: 2.4, max: 6 };
  const y = minYears ?? 1;
  const base = y >= 5 ? [28, 50] : y >= 3 ? [16, 30] : y >= 1 ? [10, 20] : [6, 14];
  const bump = family === "ml" || family === "platform" ? 1.15 : family === "qa" ? 0.8 : 1;
  return { min: Math.round(base[0]! * bump), max: Math.round(base[1]! * bump) };
}
