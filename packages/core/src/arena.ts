// Coding Arena shapes as the app sees them (the judge's HTTP API in infra/coding-arena/lambdas/api.ts).
// Client-safe: no secrets and no Node APIs. Token minting lives in ./arena-token (server only).

export const ARENA_IDS = ["dsa", "logic", "aptitude", "cs"] as const;
export type ArenaId = (typeof ARENA_IDS)[number];
export type ArenaLanguage = "cpp" | "python";
export type ArenaDifficulty = "easy" | "medium" | "hard";

export interface ArenaInfo {
  id: ArenaId;
  label: string;
  description: string;
  /** Judged arenas run code against hidden tests; the others are multiple choice. */
  kind: "judged" | "mcq";
  /** A key of the @ge/ui icon registry. */
  icon: "code-xml" | "puzzle" | "brain" | "cpu";
}

export const ARENAS: Record<ArenaId, ArenaInfo> = {
  dsa: {
    id: "dsa",
    label: "Data structures and algorithms",
    description:
      "Interview-style problems in C++ or Python, judged against hidden tests in a sandbox.",
    kind: "judged",
    icon: "code-xml",
  },
  logic: {
    id: "logic",
    label: "Logic building",
    description:
      "Loops, conditions, strings and arrays. The fundamentals that campus coding rounds start with.",
    kind: "judged",
    icon: "puzzle",
  },
  aptitude: {
    id: "aptitude",
    label: "Aptitude",
    description:
      "Timed multiple-choice sets on percentages, work and speed, reasoning and probability.",
    kind: "mcq",
    icon: "brain",
  },
  cs: {
    id: "cs",
    label: "CS fundamentals",
    description:
      "Operating systems, databases, networks and OOP, as asked in technical interviews.",
    kind: "mcq",
    icon: "cpu",
  },
};

export const LANGUAGE_LABEL: Record<ArenaLanguage, string> = { cpp: "C++17", python: "Python 3" };
export const DIFFICULTY_LABEL: Record<ArenaDifficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

export function isArenaId(v: unknown): v is ArenaId {
  return typeof v === "string" && (ARENA_IDS as readonly string[]).includes(v);
}

export type ArenaVerdict =
  | "Accepted"
  | "Wrong Answer"
  | "Time Limit Exceeded"
  | "Memory Limit Exceeded"
  | "Runtime Error"
  | "Compile Error"
  | "Internal Error";

export interface ArenaResource {
  title: string;
  url: string;
  kind: "article" | "video" | "practice" | "visualizer" | "reference";
}

export interface ArenaProblemSummary {
  slug: string;
  title: string;
  arena: ArenaId;
  difficulty: ArenaDifficulty;
  topics: string[];
  companyTags: string[];
  roleTags: string[];
  order: number;
  solved: boolean;
}

export interface ArenaProblem extends ArenaProblemSummary {
  statementMd: string;
  inputFormatMd: string;
  outputFormatMd: string;
  constraintsMd: string;
  examples: { input: string; output: string; explanation?: string }[];
  timeLimitMs: number;
  pythonTimeLimitMs: number;
  memoryLimitMb: number;
  checker: "tokens" | "float-1e-6";
  starter: Record<ArenaLanguage, string>;
  resources: ArenaResource[];
  updatedAt: string;
}

export interface ArenaEditorial {
  hints: string[];
  editorialMd: string;
  complexity: { time: string; space: string };
  solutions: Record<ArenaLanguage, string>;
}

export interface ArenaTestResult {
  n: number;
  verdict: Exclude<ArenaVerdict, "Compile Error" | "Internal Error">;
  timeMs: number;
  memKb: number;
}

export interface ArenaSubmission {
  submissionId: string;
  slug: string;
  language: ArenaLanguage;
  status: "QUEUED" | "RUNNING" | "DONE" | "FAILED";
  verdict?: ArenaVerdict;
  tests?: ArenaTestResult[];
  passed?: number;
  totalTests?: number;
  failedTest?: number;
  maxTimeMs?: number;
  maxMemKb?: number;
  compileOutput?: string;
  message?: string;
  kind?: "submit" | "validate";
  createdAt: string;
  finishedAt?: string;
  code?: string;
  progress?: { done: number; total: number };
}

export interface ArenaMcqSetSummary {
  setId: string;
  arena: ArenaId;
  title: string;
  topic: string;
  difficulty: ArenaDifficulty;
  minutes: number;
  description: string;
  companyTags: string[];
  roleTags: string[];
  resources: ArenaResource[];
  order: number;
  questionCount: number;
}

export interface ArenaMcqSet extends Omit<ArenaMcqSetSummary, "questionCount"> {
  /** Answers and explanations only come back with an attempt's result. */
  questions: { id: string; prompt: string; options: string[] }[];
}

export interface ArenaMcqResult {
  score: number;
  total: number;
  review: { id: string; chosen: number; answer: number; correct: boolean; explanation: string }[];
}

export interface ArenaProgress {
  solved: { slug: string; solvedAt: string; language: ArenaLanguage }[];
  mcq: { setId: string; best: number; total: number; attempts: number; lastAt: string }[];
}

/** Messages on the live-verdict WebSocket. */
export type ArenaPush =
  | { type: "progress"; submissionId: string; done: number; total: number; label: string }
  | { type: "verdict"; submissionId: string; submission: ArenaSubmission }
  | { type: "pong" };

export function isFinished(s: Pick<ArenaSubmission, "status">): boolean {
  return s.status === "DONE" || s.status === "FAILED";
}

export function verdictTone(
  v: ArenaVerdict | undefined,
): "success" | "danger" | "warning" | "neutral" {
  if (!v) return "neutral";
  if (v === "Accepted") return "success";
  if (v === "Compile Error" || v === "Internal Error") return "warning";
  return "danger";
}

export const DIFFICULTY_TONE: Record<ArenaDifficulty, "success" | "warning" | "danger"> = {
  easy: "success",
  medium: "warning",
  hard: "danger",
};

/** "binary-search" → "Binary search"; short acronyms stay upper case ("sde" → "SDE", "bfs" → "BFS"). */
export function tagLabel(tag: string): string {
  const ACRONYMS = new Set(["sde", "bfs", "dfs", "dp", "dsu", "oop", "os", "dbms", "ml", "ppo"]);
  return tag
    .split("-")
    .map((w, i) =>
      ACRONYMS.has(w) ? w.toUpperCase() : i === 0 ? w[0]!.toUpperCase() + w.slice(1) : w,
    )
    .join(" ");
}

const ROLE_RULES: [RegExp, string][] = [
  [/\b(machine learning|ml|ai|deep learning|nlp|computer vision)\b/, "ml"],
  [/\b(data (engineer|scien\w*)|analytics engineer)\b/, "data"],
  [/\b(analyst|business intelligence|bi)\b/, "analyst"],
  [/\b(devops|sre|site reliability|cloud|platform|infrastructure)\b/, "devops"],
  [/\b(front[- ]?end|ui|react|web developer)\b/, "frontend"],
  [/\b(back[- ]?end|api|server|node|java|golang|go developer)\b/, "backend"],
  [/\b(software|sde|developer|engineer|programmer|full[- ]?stack)\b/, "sde"],
];

/** The Arena role tag that best fits a job title, for "Practice for this role". */
export function roleTagForTitle(title: string): string | undefined {
  const t = title.toLowerCase();
  return ROLE_RULES.find(([re]) => re.test(t))?.[1];
}
