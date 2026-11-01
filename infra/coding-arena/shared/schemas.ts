import { z } from "zod";
import { ARENAS, DIFFICULTIES, LANGUAGES } from "./types";

const slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "lowercase words joined by dashes")
  .max(64);
const tag = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  .max(40);
const md = (max: number) => z.string().max(max);

export const ResourceSchema = z.object({
  title: z.string().min(1).max(120),
  url: z.url().refine((u) => u.startsWith("https://"), "https links only"),
  kind: z.enum(["article", "video", "practice", "visualizer", "reference"]),
});

export const ProblemMetaSchema = z.object({
  slug,
  arena: z.enum(ARENAS),
  title: z.string().min(3).max(80),
  difficulty: z.enum(DIFFICULTIES),
  topics: z.array(tag).min(1).max(8),
  companyTags: z.array(tag).max(20).default([]),
  roleTags: z.array(tag).max(10).default([]),
  statementMd: md(20_000),
  inputFormatMd: md(4_000),
  outputFormatMd: md(4_000),
  constraintsMd: md(4_000),
  examples: z
    .array(z.object({ input: md(4_000), output: md(4_000), explanation: md(4_000).optional() }))
    .min(1)
    .max(5),
  timeLimitMs: z.number().int().min(250).max(5_000).default(2_000),
  pythonTimeLimitMs: z.number().int().min(250).max(12_500).default(5_000),
  memoryLimitMb: z.number().int().min(32).max(512).default(256),
  checker: z.enum(["tokens", "float-1e-6"]).default("tokens"),
  starter: z.object({ cpp: md(8_000), python: md(8_000) }),
  resources: z.array(ResourceSchema).max(12).default([]),
  order: z.number().int().min(0).max(9999).default(100),
});

export const EditorialSchema = z.object({
  hints: z.array(md(2_000)).min(1).max(5),
  editorialMd: md(40_000),
  complexity: z.object({ time: z.string().max(80), space: z.string().max(80) }),
  solutions: z.object({ cpp: md(20_000), python: md(20_000) }),
});

export const ProblemUpsertSchema = z.object({
  meta: ProblemMetaSchema,
  editorial: EditorialSchema,
});

export const McqQuestionSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]{1,40}$/),
    prompt: md(4_000),
    options: z.array(md(500)).min(2).max(6),
    answer: z.number().int().min(0),
    explanation: md(6_000),
  })
  .refine((q) => q.answer < q.options.length, "answer must index an option");

export const McqSetSchema = z.object({
  setId: slug,
  arena: z.enum(ARENAS),
  title: z.string().min(3).max(80),
  topic: tag,
  difficulty: z.enum(DIFFICULTIES),
  minutes: z.number().int().min(1).max(120),
  description: md(2_000),
  companyTags: z.array(tag).max(20).default([]),
  roleTags: z.array(tag).max(10).default([]),
  resources: z.array(ResourceSchema).max(12).default([]),
  order: z.number().int().min(0).max(9999).default(100),
  questions: z.array(McqQuestionSchema).min(1).max(50),
});

export const SubmitSchema = z.object({
  slug,
  language: z.enum(LANGUAGES),
  code: z
    .string()
    .min(1)
    .refine((c) => Buffer.byteLength(c, "utf8") <= 64 * 1024, "Code must be 64 KB or less."),
});

export const McqAttemptSchema = z.object({
  answers: z.array(z.number().int().min(-1).max(5)).max(50),
  seconds: z
    .number()
    .int()
    .min(0)
    .max(24 * 3600)
    .optional(),
});

export const TestUploadSchema = z.object({ count: z.number().int().min(1).max(100) });
export const ValidateSchema = z.object({
  languages: z.array(z.enum(LANGUAGES)).min(1).default(["cpp", "python"]),
});
