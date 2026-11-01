// Single-table key builders for the CodingArena DynamoDB table. Documented in README.md.
import type { ArenaId, Difficulty } from "./types";

const DIFF_RANK: Record<Difficulty, number> = { easy: 1, medium: 2, hard: 3 };
const pad = (n: number) => String(n).padStart(4, "0");

export const keys = {
  problem: (slug: string) => ({ PK: `PROBLEM#${slug}`, SK: "META" }),
  editorial: (slug: string) => ({ PK: `PROBLEM#${slug}`, SK: "EDITORIAL" }),
  tests: (slug: string) => ({ PK: `PROBLEM#${slug}`, SK: "TESTS" }),
  /** GSI1: problems of an arena, ordered by difficulty then curriculum order. */
  problemByArena: (arena: ArenaId, difficulty: Difficulty, order: number, slug: string) => ({
    GSI1PK: `ARENA#${arena}`,
    GSI1SK: `P#${DIFF_RANK[difficulty]}#${pad(order)}#${slug}`,
  }),

  submission: (id: string) => ({ PK: `SUB#${id}`, SK: "META" }),
  /** GSI1: a user's submissions for one problem, newest last. */
  submissionByUserProblem: (userId: string, slug: string, createdAt: string) => ({
    GSI1PK: `USER#${userId}#P#${slug}`,
    GSI1SK: createdAt,
  }),

  solved: (userId: string, slug: string) => ({ PK: `USER#${userId}`, SK: `SOLVED#${slug}` }),
  solvedPrefix: "SOLVED#",
  rate: (userId: string) => ({ PK: `USER#${userId}`, SK: "RATE" }),
  user: (userId: string) => `USER#${userId}`,

  connection: (connectionId: string) => ({ PK: `CONN#${connectionId}`, SK: "META" }),
  /** GSI2: a user's open WebSocket connections. */
  connectionByUser: (userId: string, connectionId: string) => ({
    GSI2PK: `USER#${userId}`,
    GSI2SK: `CONN#${connectionId}`,
  }),

  mcqSet: (setId: string) => ({ PK: `MCQ#${setId}`, SK: "META" }),
  mcqByArena: (arena: ArenaId, order: number, setId: string) => ({
    GSI1PK: `ARENA#${arena}`,
    GSI1SK: `M#${pad(order)}#${setId}`,
  }),
  mcqAttempt: (userId: string, setId: string, at: string) => ({
    PK: `USER#${userId}`,
    SK: `MCQ#${setId}#${at}`,
  }),
  mcqAttemptPrefix: "MCQ#",
};

export const TTL = {
  /** WebSocket connections: API Gateway closes them after 2 hours anyway. */
  connectionSeconds: 2 * 60 * 60,
  /** Submissions are kept for a year, then DynamoDB deletes them. */
  submissionSeconds: 365 * 24 * 60 * 60,
};

export const epochSeconds = (d = new Date()) => Math.floor(d.getTime() / 1000);
