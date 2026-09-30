import { mentions } from "./match";
import type { RubricScores } from "./schemas";

/**
 * Rule-based interview content and grading (docs/decisions.md D19). Gemini writes follow-ups and
 * grades in Phase 6 (interview.grade); these keep every format working without an LLM and give the
 * worker a baseline.
 */

export interface InterviewQuestion {
  q: string;
  kind: "technical" | "behavioural";
  /** Words a strong answer tends to use; drives the technical score. */
  keywords: string[];
}

export type InterviewType = "Mixed" | "Technical" | "Behavioural" | "Aptitude";

/** Skill-specific technical questions (prototype/Interview.dc.html asks about Kafka and idempotency). */
const SKILL_QUESTIONS: Record<string, InterviewQuestion> = {
  kafka: {
    q: "Your project used Kafka. What happens when a consumer crashes mid-batch, and how do you avoid losing or double-processing messages?",
    kind: "technical",
    keywords: ["offset", "commit", "at-least-once", "idempotent", "retry", "partition"],
  },
  go: {
    q: "How do you handle concurrency in Go? Walk me through goroutines, channels and how you'd avoid a race condition.",
    kind: "technical",
    keywords: ["goroutine", "channel", "mutex", "race", "context", "waitgroup"],
  },
  redis: {
    q: "When would you put Redis in front of a database, and how do you keep the cache from serving stale data?",
    kind: "technical",
    keywords: ["cache", "ttl", "invalidate", "latency", "eviction", "write-through"],
  },
  postgresql: {
    q: "A query on a large Postgres table got slow. How do you find out why and fix it?",
    kind: "technical",
    keywords: ["index", "explain", "query plan", "scan", "join", "vacuum"],
  },
  sql: {
    q: "Explain the difference between an inner join and a left join, and when you'd use each.",
    kind: "technical",
    keywords: ["join", "null", "rows", "match", "left", "inner"],
  },
  react: {
    q: "How do you keep a React app fast as it grows? Talk about rendering and state.",
    kind: "technical",
    keywords: ["render", "memo", "state", "props", "key", "virtual"],
  },
  typescript: {
    q: "What does TypeScript catch that plain JavaScript doesn't, and where do types still leave gaps?",
    kind: "technical",
    keywords: ["type", "compile", "runtime", "any", "generic", "inference"],
  },
  "node.js": {
    q: "Node.js is single-threaded. How does it handle many concurrent requests, and what blocks it?",
    kind: "technical",
    keywords: ["event loop", "async", "non-blocking", "callback", "worker", "cpu"],
  },
  swift: {
    q: "How do you manage state in a SwiftUI app, and when do you reach for an ObservableObject?",
    kind: "technical",
    keywords: ["state", "binding", "observable", "view", "mvvm", "published"],
  },
  docker: {
    q: "What problem does Docker solve for you, and what goes into a small, secure image?",
    kind: "technical",
    keywords: ["image", "container", "layer", "multi-stage", "base", "environment"],
  },
};

const GENERAL_TECHNICAL: InterviewQuestion[] = [
  {
    q: "How would you make a payment-retry endpoint idempotent if the client times out and retries?",
    kind: "technical",
    keywords: ["idempotency key", "transaction", "duplicate", "409", "retry", "store"],
  },
  {
    q: "Design a rate limiter for a public API.",
    kind: "technical",
    keywords: ["token bucket", "sliding window", "redis", "burst", "per user", "429"],
  },
];

const BEHAVIOURAL: InterviewQuestion[] = [
  {
    q: "Tell me about a time you disagreed with a teammate on a technical decision.",
    kind: "behavioural",
    keywords: ["situation", "listened", "data", "agreed", "outcome", "learned"],
  },
  {
    q: "Tell me about something that went wrong on a project and what you did about it.",
    kind: "behavioural",
    keywords: ["problem", "owned", "fixed", "result", "learned", "next time"],
  },
  {
    q: "What would you want to learn in your first 90 days here?",
    kind: "behavioural",
    keywords: ["team", "codebase", "ship", "mentor", "users", "goals"],
  },
];

const OPENER: InterviewQuestion = {
  q: "Walk me through a project you're proud of.",
  kind: "behavioural",
  keywords: ["built", "problem", "users", "result", "decided", "learned"],
};

const APTITUDE: InterviewQuestion[] = [
  {
    q: "A train covers 120 km in 1.5 hours. How long does it take to cover 200 km at the same speed? Talk through your working.",
    kind: "technical",
    keywords: ["80", "speed", "divide", "2.5", "hours", "km"],
  },
  {
    q: "You have 8 balls and one is heavier. With a balance, what's the fewest weighings to find it? Explain.",
    kind: "technical",
    keywords: ["2", "groups", "three", "weigh", "split", "remaining"],
  },
];

/** Six questions for a role: an opener, skill questions from the job, then behavioural ones. */
export function interviewQuestions(input: {
  skills: string[];
  type: InterviewType;
  count?: number;
}): InterviewQuestion[] {
  const count = input.count ?? 6;
  const fromSkills = input.skills
    .map((s) => SKILL_QUESTIONS[s.toLowerCase()])
    .filter((q): q is InterviewQuestion => !!q);
  const technical = [...fromSkills, ...GENERAL_TECHNICAL];
  let list: InterviewQuestion[];
  if (input.type === "Behavioural") list = [OPENER, ...BEHAVIOURAL, ...technical];
  else if (input.type === "Technical") list = [OPENER, ...technical, ...BEHAVIOURAL];
  else if (input.type === "Aptitude") list = [...APTITUDE, OPENER, ...technical];
  else {
    // Mixed: opener, technical first, behavioural to close (as in the prototype).
    const tech = technical.slice(0, Math.max(2, count - 3));
    list = [OPENER, ...tech, ...BEHAVIOURAL];
  }
  const seen = new Set<string>();
  return list.filter((q) => !seen.has(q.q) && seen.add(q.q)).slice(0, count);
}

/** The interviewer's short acknowledgement before the next question. */
export function acknowledge(answer: string, i: number): string {
  const words = answer.trim().split(/\s+/).filter(Boolean).length;
  if (!answer.trim() || answer === "(Skipped)") return "No problem, let's move on.";
  if (words < 25) return "Thanks. Next time, add a detail or a result.";
  return [
    "Thanks. That gives me good context.",
    "Clear, thanks.",
    "Good. You covered the main points.",
    "Thanks for being specific.",
  ][i % 4]!;
}

export const FILLERS = [
  "um",
  "uh",
  "like",
  "basically",
  "actually",
  "you know",
  "sort of",
  "kind of",
];
const HEDGES = ["maybe", "i think", "not sure", "i guess", "probably", "i don't know"];
const STRUCTURE = [
  "first",
  "then",
  "because",
  "so",
  "finally",
  "for example",
  "the result",
  "trade-off",
  "approach",
  "i would",
];

const count = (text: string, words: string[]) =>
  words.reduce((n, w) => n + (text.match(new RegExp(`\\b${w}\\b`, "gi"))?.length ?? 0), 0);
const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

export interface GradedAnswer {
  q: string;
  score: number;
  note: string;
  tip: string;
}

/** Score one answer on the four rubric parts. */
export function gradeAnswer(
  question: InterviewQuestion,
  answer: string,
): RubricScores & { words: number } {
  const text = answer.trim();
  const words = text ? text.split(/\s+/).length : 0;
  if (!words || text === "(Skipped)")
    return { communication: 0, technical: 0, structure: 0, confidence: 0, words: 0 };
  const hits = question.keywords.filter((k) => mentions(text, k)).length;
  const lengthFit = words < 30 ? words / 30 : words > 220 ? Math.max(0.6, 220 / words) : 1;
  const fillers = count(text, FILLERS);
  return {
    technical: clamp(35 + (65 * hits) / Math.max(3, Math.min(question.keywords.length, 4))),
    communication: clamp(100 * lengthFit - fillers * 4),
    structure: clamp(40 + Math.min(4, count(text, STRUCTURE)) * 15),
    confidence: clamp(90 - count(text, HEDGES) * 12 - fillers * 3),
    words,
  };
}

function noteFor(
  g: RubricScores & { words: number },
  q: InterviewQuestion,
): { note: string; tip: string } {
  if (!g.words)
    return {
      note: "Not answered.",
      tip: "give a short answer even when you're unsure; say how you'd find out.",
    };
  const weakest = (Object.keys(g) as (keyof RubricScores | "words")[])
    .filter((k): k is keyof RubricScores => k !== "words")
    .sort((a, b) => g[a] - g[b])[0]!;
  const notes: Record<keyof RubricScores, [string, string]> = {
    technical: [
      `Light on specifics. ${q.kind === "technical" ? "Name the mechanism, not just the goal." : "Add the concrete detail of what you did."}`,
      q.keywords.length
        ? `mention ${q.keywords.slice(0, 2).join(" and ")}.`
        : "add one concrete detail.",
    ],
    communication: [
      g.words < 30 ? "Too short to show your thinking." : "Long; the main point got buried.",
      "aim for 80–150 words.",
    ],
    structure: [
      "Hard to follow the order of your answer.",
      "lead with the approach, then the details, then the result.",
    ],
    confidence: [
      "Lots of hedging. It reads less sure than your content is.",
      "state the answer first, then any caveats.",
    ],
  };
  const avg = (g.technical + g.communication + g.structure + g.confidence) / 4;
  if (avg >= 80) return { note: "Clear and specific.", tip: notes[weakest][1] };
  return { note: notes[weakest][0], tip: notes[weakest][1] };
}

export interface InterviewReport {
  summary: string;
  answers: GradedAnswer[];
  metrics: { wpm: number | null; fillers: number };
}

/** Grade a whole session: rubric averages, overall score, answer notes and delivery metrics. */
export function gradeSession(input: {
  questions: InterviewQuestion[];
  answers: string[];
  /** Seconds the candidate spent speaking, for voice sessions. */
  speakingSeconds?: number;
}): { score: number; rubric: RubricScores; report: InterviewReport } {
  const graded = input.questions.map((q, i) => ({ q, g: gradeAnswer(q, input.answers[i] ?? "") }));
  const avg = (k: keyof RubricScores) =>
    clamp(graded.reduce((a, x) => a + x.g[k], 0) / Math.max(1, graded.length));
  const rubric: RubricScores = {
    communication: avg("communication"),
    technical: avg("technical"),
    structure: avg("structure"),
    confidence: avg("confidence"),
  };
  const score = clamp(
    (rubric.communication + rubric.technical + rubric.structure + rubric.confidence) / 4,
  );
  const all = input.answers.join(" ");
  const totalWords = graded.reduce((a, x) => a + x.g.words, 0);
  const best = graded.slice().sort((a, b) => b.g.technical - a.g.technical)[0];
  const weakKey = (Object.keys(rubric) as (keyof RubricScores)[]).sort(
    (a, b) => rubric[a] - rubric[b],
  )[0]!;
  const WEAK: Record<keyof RubricScores, string> = {
    technical: "Name the mechanisms behind your answers.",
    communication: "Keep answers between 80 and 150 words.",
    structure: "Lead with the approach before details.",
    confidence: "Say the answer first, then the caveats.",
  };
  return {
    score,
    rubric,
    report: {
      summary: totalWords
        ? `${best && best.g.technical >= 70 ? "Strongest on specifics in your answer to “" + best.q.q.replace(/[.?]$/, "") + "”. " : ""}${WEAK[weakKey]}`
        : "No answers were recorded, so there's nothing to score yet.",
      answers: graded.map(({ q, g }) => ({
        q: q.q,
        score: clamp((g.communication + g.technical + g.structure + g.confidence) / 4),
        ...noteFor(g, q),
      })),
      metrics: {
        wpm:
          input.speakingSeconds && input.speakingSeconds > 10
            ? Math.round(totalWords / (input.speakingSeconds / 60))
            : null,
        fillers: count(all, FILLERS),
      },
    },
  };
}

export interface McqQuestion {
  topic: string;
  q: string;
  opts: [string, string, string, string];
  a: 0 | 1 | 2 | 3;
  why: string;
}

/** The multiple-choice bank (prototype/Interview.dc.html). */
export const MCQ_BANK: McqQuestion[] = [
  {
    topic: "APIs · Idempotency",
    q: "A retry arrives while the original request with the same idempotency key is still processing. What should the server return?",
    opts: [
      "200 OK with an empty body",
      "409 Conflict",
      "429 Too Many Requests",
      "500 Internal Server Error",
    ],
    a: 1,
    why: "409 tells the client the same operation is in progress, so it should back off and retry later instead of creating a duplicate.",
  },
  {
    topic: "Distributed systems · Kafka",
    q: "With at-least-once delivery, what must a consumer be prepared for?",
    opts: [
      "Messages arriving out of order across all partitions",
      "Messages being lost after a crash",
      "The same message being delivered more than once",
      "Messages expiring before they are read",
    ],
    a: 2,
    why: "At-least-once means no message is lost, but a crash before committing offsets causes redelivery. Consumers should be idempotent.",
  },
  {
    topic: "Data structures",
    q: "Which structure gives O(1) average-time lookup by key?",
    opts: ["Sorted array", "Hash map", "Balanced binary search tree", "Linked list"],
    a: 1,
    why: "A hash map computes the bucket directly from the key. A BST is O(log n); arrays and lists need a search.",
  },
  {
    topic: "System design · Rate limiting",
    q: "What does a token bucket rate limiter allow that a fixed window counter does not handle well?",
    opts: [
      "Controlled bursts up to the bucket size",
      "Unlimited requests after a quiet period",
      "Per-user limits",
      "Rejecting requests without storing state",
    ],
    a: 0,
    why: "Tokens accumulate up to a cap, so short bursts are allowed while the long-run rate stays fixed.",
  },
  {
    topic: "Algorithms",
    q: "What is the time complexity of binary search on a sorted array of n items?",
    opts: ["O(1)", "O(n)", "O(log n)", "O(n log n)"],
    a: 2,
    why: "Each step halves the search space, so it takes about log₂ n comparisons.",
  },
  {
    topic: "Databases · Transactions",
    q: "Which isolation level prevents dirty reads but still allows non-repeatable reads?",
    opts: ["Read uncommitted", "Read committed", "Repeatable read", "Serializable"],
    a: 1,
    why: "Read committed only shows committed data, but a row can change between two reads in the same transaction.",
  },
  {
    topic: "Web · Caching",
    q: "Which header lets a client revalidate a cached response without downloading it again if unchanged?",
    opts: ["ETag", "Content-Length", "Accept-Encoding", "Set-Cookie"],
    a: 0,
    why: "The client sends If-None-Match with the ETag; the server answers 304 Not Modified when nothing changed.",
  },
  {
    topic: "Concurrency",
    q: "Two threads increment a shared counter without locking. What is the most likely result?",
    opts: [
      "The program deadlocks",
      "Some increments are lost",
      "The counter doubles every step",
      "The compiler rejects the code",
    ],
    a: 1,
    why: "Read-modify-write is not atomic, so interleaved increments overwrite each other. Use an atomic or a lock.",
  },
];

/** interview_sessions.report: the graded report, plus the picks for a multiple-choice test. */
export type SessionReport = InterviewReport & {
  mcq?: { picks: (number | null)[] };
  questions?: string[];
};
