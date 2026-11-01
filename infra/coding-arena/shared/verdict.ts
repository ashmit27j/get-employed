import { outputsMatch } from "./compare";
import type { BatchResult, Checker, SandboxRun, TestResult, Verdict } from "./types";

const RESOURCE_VERDICT: Record<Exclude<SandboxRun["status"], "OK">, TestResult["verdict"]> = {
  TLE: "Time Limit Exceeded",
  MLE: "Memory Limit Exceeded",
  RE: "Runtime Error",
  // Output that hits the file-size cap can't be correct.
  OLE: "Wrong Answer",
};

export function judgeRun(
  n: number,
  run: SandboxRun,
  expected: string,
  checker: Checker,
): TestResult {
  const base = { n, timeMs: run.timeMs, memKb: run.memKb };
  if (run.status !== "OK") return { ...base, verdict: RESOURCE_VERDICT[run.status] };
  if (run.stdoutTruncated) return { ...base, verdict: "Wrong Answer" };
  return {
    ...base,
    verdict: outputsMatch(expected, run.stdout, checker) ? "Accepted" : "Wrong Answer",
  };
}

export interface Aggregate {
  verdict: Verdict;
  tests: TestResult[];
  passed: number;
  total: number;
  failedTest: number | null;
  maxTimeMs: number;
  maxMemKb: number;
}

/** The verdict is the first failing test in test order; Accepted only if every test ran and passed. */
export function aggregate(batches: BatchResult[], totalTests: number): Aggregate {
  const tests = batches.flatMap((b) => b.tests).sort((a, b) => a.n - b.n);
  const firstFail = tests.find((t) => t.verdict !== "Accepted");
  const passed = tests.filter((t) => t.verdict === "Accepted").length;
  let verdict: Verdict;
  if (firstFail) verdict = firstFail.verdict;
  else if (tests.length === totalTests && totalTests > 0) verdict = "Accepted";
  else verdict = "Internal Error"; // some batch was lost without a failure to explain it
  return {
    verdict,
    tests,
    passed,
    total: totalTests,
    failedTest: firstFail?.n ?? null,
    maxTimeMs: Math.max(0, ...tests.map((t) => t.timeMs)),
    maxMemKb: Math.max(0, ...tests.map((t) => t.memKb)),
  };
}

/** Split test numbers into batches of at most `size` tests and `maxBytes` of input+output. */
export function planBatches(
  sizes: { n: number; bytes: number }[],
  size = 5,
  maxBytes = 3_500_000,
): number[][] {
  const batches: number[][] = [];
  let cur: number[] = [];
  let bytes = 0;
  for (const t of [...sizes].sort((a, b) => a.n - b.n)) {
    if (cur.length && (cur.length >= size || bytes + t.bytes > maxBytes)) {
      batches.push(cur);
      cur = [];
      bytes = 0;
    }
    cur.push(t.n);
    bytes += t.bytes;
  }
  if (cur.length) batches.push(cur);
  return batches;
}
