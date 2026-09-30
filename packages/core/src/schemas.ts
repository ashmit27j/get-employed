import { z } from "zod";

/** Filter chips produced by the search parser. Types match the chips in prototype/Jobs.dc.html. */
export const ChipTypeSchema = z.enum(["role", "skill", "location", "salary", "experience", "type"]);
export const ChipSchema = z.object({
  type: ChipTypeSchema,
  icon: z.string(),
  label: z.string(),
  value: z.string(),
});
export type Chip = z.infer<typeof ChipSchema>;
export const SearchFiltersSchema = z.array(ChipSchema);
export type SearchFilters = z.infer<typeof SearchFiltersSchema>;

const DatedEntry = { dates: z.string().default("") };

/**
 * The resume content stored in profiles.doc (docs/decisions.md D18). Shape follows PROFILE in
 * prototype/ge-data.js. Optional fields are edited on the Job Profile page; the resume ignores them.
 */
export const ProfileSchema = z.object({
  contact: z.object({
    name: z.string(),
    email: z.string(),
    phone: z.string().default(""),
    loc: z.string().default(""),
    links: z.array(z.string()).default([]),
  }),
  summary: z.string().default(""),
  education: z
    .array(
      z.object({
        school: z.string(),
        degree: z.string(),
        field: z.string().optional(),
        score: z.string().default(""),
        ...DatedEntry,
      }),
    )
    .default([]),
  experience: z
    .array(
      z.object({
        role: z.string(),
        co: z.string(),
        /** Internship, Full-time… (Job Profile). */
        type: z.string().optional(),
        /** "What you did" in one paragraph (Job Profile); the resume uses bullets. */
        summary: z.string().optional(),
        bullets: z.array(z.string()).default([]),
        ...DatedEntry,
      }),
    )
    .default([]),
  projects: z
    .array(
      z.object({
        name: z.string(),
        stack: z.string().default(""),
        bullets: z.array(z.string()).default([]),
      }),
    )
    .default([]),
  /**
   * Skill groups in resume order. Stored as an array because jsonb objects don't keep key order;
   * the older `{ Group: [...] }` shape (prototype data) is still accepted.
   */
  skills: z
    .preprocess(
      (v) =>
        v && typeof v === "object" && !Array.isArray(v)
          ? Object.entries(v).map(([name, items]) => ({ name, items }))
          : v,
      z.array(z.object({ name: z.string(), items: z.array(z.string()).default([]) })),
    )
    .default([]),
  certifications: z
    .array(
      z.object({
        name: z.string(),
        issuer: z.string().default(""),
        date: z.string().default(""),
        expires: z.string().optional(),
        credentialId: z.string().optional(),
        url: z.string().optional(),
      }),
    )
    .default([]),
  achievements: z.array(z.string()).default([]),
  leadership: z
    .array(
      z.object({
        role: z.string(),
        org: z.string(),
        bullets: z.array(z.string()).default([]),
        ...DatedEntry,
      }),
    )
    .default([]),
});
export type Profile = z.infer<typeof ProfileSchema>;

export const LINK_KINDS = ["linkedin", "github", "portfolio", "leetcode", "other"] as const;
export type LinkKind = (typeof LINK_KINDS)[number];

/**
 * Job Profile facts that are not resume content (profiles.details): status, preferences,
 * languages, labelled links, documents to attach and voluntary disclosures.
 */
export const JobDetailsSchema = z.object({
  pronouns: z.string().default("Prefer not to say"),
  headline: z.string().default(""),
  dob: z.string().default(""),
  status: z.string().default(""),
  year: z.string().default(""),
  experience: z.string().default(""),
  availableFrom: z.string().default(""),
  roles: z.string().default(""),
  jobTypes: z.array(z.string()).default([]),
  workModes: z.array(z.string()).default([]),
  locations: z.string().default(""),
  workAuth: z.string().default("Indian citizen"),
  expectedSalary: z.string().default(""),
  currentSalary: z.string().default(""),
  relocate: z.boolean().default(false),
  languages: z.array(z.object({ name: z.string(), level: z.string() })).default([]),
  links: z.partialRecord(z.enum(LINK_KINDS), z.string()).default({}),
  documents: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        type: z.string(),
        meta: z.string().default(""),
        resumeId: z.string().optional(),
        key: z.string().optional(),
      }),
    )
    .default([]),
  gender: z.string().default("Prefer not to say"),
  disability: z.string().default("Prefer not to say"),
});
export type JobDetails = z.infer<typeof JobDetailsSchema>;

/** Action card attached to an assistant message (ChatAction in prototype/ge-app.js). */
export const ChatActionSchema = z.object({
  icon: z.string(),
  title: z.string(),
  detail: z.string().optional(),
  href: z.string().optional(),
  cta: z.string().optional(),
  status: z.enum(["running", "done", "error"]),
});
export type ChatAction = z.infer<typeof ChatActionSchema>;

export const RubricScoresSchema = z.object({
  communication: z.number().min(0).max(100),
  technical: z.number().min(0).max(100),
  structure: z.number().min(0).max(100),
  confidence: z.number().min(0).max(100),
});
export type RubricScores = z.infer<typeof RubricScoresSchema>;
