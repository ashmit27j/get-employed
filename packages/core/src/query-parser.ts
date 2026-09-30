import type { Chip } from "./schemas";

/**
 * Rule-based parser for plain-English job searches ("Backend roles in Pune, 12 LPA+, 2 years of Go").
 * Ported from the marketing hero (prototype/marketing/Home.jsx). The app uses it as the instant,
 * offline first pass; the LLM parser refines it when available (docs/architecture.md).
 */

type ChipType = Chip["type"];

const ICON: Record<ChipType, string> = {
  type: "globe",
  role: "briefcase",
  skill: "code",
  location: "map-pin",
  salary: "wallet",
  experience: "graduation-cap",
};

/** Display names for the chip categories, as the hero shows them ("Role Backend"). */
export const CHIP_TYPE_LABEL: Record<ChipType, string> = {
  type: "Type",
  role: "Role",
  skill: "Skill",
  location: "Location",
  salary: "Salary",
  experience: "Experience",
};

const RULES: [ChipType, [RegExp, string][]][] = [
  [
    "type",
    [
      [/\bintern(ship)?s?\b/, "Internship"],
      [/\bfull[- ]?time\b/, "Full-time"],
      [/\bcontract\b/, "Contract"],
    ],
  ],
  [
    "role",
    [
      [/\bback[- ]?end\b/, "Backend"],
      [/\bfront[- ]?end\b/, "Frontend"],
      [/\bfull[- ]?stack\b/, "Full stack"],
      [/\bdata analyst/, "Data analyst"],
      [/\bdata scien/, "Data science"],
      [/\b(ml|machine learning)\b/, "ML"],
      [/\bdevops\b/, "DevOps"],
      [/\bandroid\b/, "Android"],
      [/\bios\b/, "iOS"],
      [/\bsde\b/, "SDE"],
      [/\bproduct design/, "Product design"],
      [/\bsecurity\b/, "Security"],
    ],
  ],
  [
    "skill",
    [
      [/\breact\b/, "React"],
      [/\b(go|golang)\b/, "Go"],
      [/\bpython\b/, "Python"],
      [/\bjava\b/, "Java"],
      [/\bnode(\.js)?\b/, "Node.js"],
      [/\btypescript\b/, "TypeScript"],
      [/\bflutter\b/, "Flutter"],
      [/\bkotlin\b/, "Kotlin"],
    ],
  ],
  [
    "location",
    [
      [/\b(bengaluru|bangalore)\b/, "Bengaluru"],
      [/\bpune\b/, "Pune"],
      [/\bhyderabad\b/, "Hyderabad"],
      [/\bmumbai\b/, "Mumbai"],
      [/\bchennai\b/, "Chennai"],
      [/\b(delhi|ncr)\b/, "Delhi NCR"],
      [/\b(gurugram|gurgaon)\b/, "Gurugram"],
      [/\bnoida\b/, "Noida"],
      [/\bremote\b/, "Remote OK"],
    ],
  ],
];

const chip = (type: ChipType, label: string, value = label): Chip => ({
  type,
  icon: ICON[type],
  label,
  value,
});

export function parseSearchQuery(query: string): Chip[] {
  const s = query.toLowerCase();
  const out: Chip[] = [];
  for (const [type, rules] of RULES) {
    for (const [re, label] of rules) if (re.test(s)) out.push(chip(type, label));
  }
  const salary = /(\d+(?:\.\d+)?)\s*(?:lpa|lakhs?|l\b)/.exec(s);
  if (salary) out.push(chip("salary", `≥ ₹${salary[1]} LPA`, salary[1]));
  const years = /(\d+)\s*\+?\s*(?:years?|yrs?)/.exec(s);
  if (years) out.push(chip("experience", `${years[1]}+ yrs`, years[1]));
  else if (/\b(fresher|new grad|entry[- ]level)\b/.test(s))
    out.push(chip("experience", "0–1 yrs", "0"));
  return out;
}
