import { describe, expect, it } from "vitest";
import type { SandboxRun } from "../../shared/types";
import { aggregate, judgeRun, planBatches } from "../../shared/verdict";

const run = (over: Partial<SandboxRun> = {}): SandboxRun => ({
  status: "OK",
  stdout: "3\n",
  stdoutBytes: 2,
  stdoutTruncated: false,
  stderr: "",
  exitCode: 0,
  signal: null,
  timeMs: 10,
  wallMs: 12,
  memKb: 3000,
  ...over,
});

describe("judgeRun", () => {
  it("maps sandbox status and output to a verdict", () => {
    expect(judgeRun(1, run(), "3", "tokens").verdict).toBe("Accepted");
    expect(judgeRun(1, run({ stdout: "4" }), "3", "tokens").verdict).toBe("Wrong Answer");
    expect(judgeRun(1, run({ status: "TLE" }), "3", "tokens").verdict).toBe("Time Limit Exceeded");
    expect(judgeRun(1, run({ status: "MLE" }), "3", "tokens").verdict).toBe(
      "Memory Limit Exceeded",
    );
    expect(judgeRun(1, run({ status: "RE" }), "3", "tokens").verdict).toBe("Runtime Error");
    expect(judgeRun(1, run({ status: "OLE" }), "3", "tokens").verdict).toBe("Wrong Answer");
    expect(judgeRun(1, run({ stdoutTruncated: true }), "3", "tokens").verdict).toBe("Wrong Answer");
  });
});

describe("aggregate", () => {
  const ok = (n: number) => ({ n, verdict: "Accepted" as const, timeMs: n, memKb: 100 * n });
  it("is Accepted only when every test ran and passed", () => {
    const a = aggregate(
      [
        { batchId: 0, tests: [ok(1), ok(2)] },
        { batchId: 1, tests: [ok(3)] },
      ],
      3,
    );
    expect(a).toMatchObject({
      verdict: "Accepted",
      passed: 3,
      total: 3,
      failedTest: null,
      maxTimeMs: 3,
      maxMemKb: 300,
    });
  });
  it("reports the first failing test in test order across batches", () => {
    const a = aggregate(
      [
        { batchId: 1, tests: [ok(4), { n: 5, verdict: "Wrong Answer", timeMs: 1, memKb: 1 }] },
        {
          batchId: 0,
          tests: [ok(1), { n: 2, verdict: "Time Limit Exceeded", timeMs: 2000, memKb: 1 }],
        },
      ],
      10,
    );
    expect(a.verdict).toBe("Time Limit Exceeded");
    expect(a.failedTest).toBe(2);
  });
  it("never says Accepted when tests are missing", () => {
    expect(
      aggregate(
        [
          { batchId: 0, tests: [ok(1)] },
          { batchId: 1, skipped: true, tests: [] },
        ],
        2,
      ).verdict,
    ).toBe("Internal Error");
  });
});

describe("planBatches", () => {
  it("groups by count and by size", () => {
    const sizes = Array.from({ length: 12 }, (_, i) => ({ n: i + 1, bytes: 10 }));
    expect(planBatches(sizes, 5)).toEqual([
      [1, 2, 3, 4, 5],
      [6, 7, 8, 9, 10],
      [11, 12],
    ]);
    expect(
      planBatches(
        [
          { n: 1, bytes: 3e6 },
          { n: 2, bytes: 3e6 },
          { n: 3, bytes: 1 },
        ],
        5,
        3.5e6,
      ),
    ).toEqual([[1], [2, 3]]);
  });
});
