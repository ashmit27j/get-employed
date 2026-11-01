export const LANGUAGES = ["cpp", "python"] as const;
export type Language = (typeof LANGUAGES)[number];

export const ARENAS = ["dsa", "logic", "aptitude", "cs"] as const;
export type ArenaId = (typeof ARENAS)[number];
/** Judged arenas run code; the others are multiple choice. */
export const JUDGED_ARENAS: readonly ArenaId[] = ["dsa", "logic"];

export const DIFFICULTIES = ["easy", "medium", "hard"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

/** Final verdicts shown to the user. */
export type Verdict =
  | "Accepted"
  | "Wrong Answer"
  | "Time Limit Exceeded"
  | "Memory Limit Exceeded"
  | "Runtime Error"
  | "Compile Error"
  | "Internal Error";

/** Per-test resource status reported by the sandbox (correctness is decided outside it). */
export type SandboxStatus = "OK" | "TLE" | "MLE" | "RE" | "OLE";

export interface SandboxRequest {
  language: Language;
  code: string;
  inputs: string[];
  timeLimitMs: number;
  memoryLimitMb: number;
  compileOnly?: boolean;
  stopOnFailure?: boolean;
}

export interface SandboxRun {
  status: SandboxStatus;
  stdout: string;
  stdoutBytes: number;
  stdoutTruncated: boolean;
  stderr: string;
  exitCode: number | null;
  signal: string | null;
  timeMs: number;
  wallMs: number;
  memKb: number;
}

export interface SandboxResponse {
  ok: boolean;
  error?: string;
  compile?: { ok: boolean; output: string; timeMs: number };
  results?: SandboxRun[];
  cleaned?: number;
}

export type Checker = "tokens" | "float-1e-6";

export interface TestResult {
  n: number;
  verdict: Exclude<Verdict, "Compile Error" | "Internal Error">;
  timeMs: number;
  memKb: number;
}

export interface BatchResult {
  batchId: number;
  skipped?: boolean;
  tests: TestResult[];
}

export interface CompileStepResult {
  ok: boolean;
  compileOutput?: string;
  batchIds: number[];
  totalTests: number;
}

export type SubmissionStatus = "QUEUED" | "RUNNING" | "DONE" | "FAILED";

export interface ExampleCase {
  input: string;
  output: string;
  explanation?: string;
}

export interface Resource {
  title: string;
  url: string;
  kind: "article" | "video" | "practice" | "visualizer" | "reference";
}

export interface ProblemMeta {
  slug: string;
  arena: ArenaId;
  title: string;
  difficulty: Difficulty;
  topics: string[];
  companyTags: string[];
  roleTags: string[];
  statementMd: string;
  inputFormatMd: string;
  outputFormatMd: string;
  constraintsMd: string;
  examples: ExampleCase[];
  timeLimitMs: number;
  pythonTimeLimitMs: number;
  memoryLimitMb: number;
  checker: Checker;
  starter: Record<Language, string>;
  resources: Resource[];
  order: number;
  updatedAt: string;
}

export interface Editorial {
  hints: string[];
  editorialMd: string;
  complexity: { time: string; space: string };
  solutions: Record<Language, string>;
}

export interface TestManifest {
  count: number;
  /** Test numbers grouped into batches (each well under the 6 MB Lambda payload). */
  batches: number[][];
  version: number;
  updatedAt: string;
}

export interface McqQuestion {
  id: string;
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
}

export interface McqSet {
  setId: string;
  arena: ArenaId;
  title: string;
  topic: string;
  difficulty: Difficulty;
  minutes: number;
  description: string;
  companyTags: string[];
  roleTags: string[];
  resources: Resource[];
  order: number;
  questions: McqQuestion[];
}
