"use client";
import { isFinished, type ArenaSubmission, type ArenaTestResult } from "@ge/core";
import { Icon, cx } from "@ge/ui";
import { VerdictBadge } from "./parts";

const SHORT: Record<ArenaTestResult["verdict"], string> = {
  Accepted: "Passed",
  "Wrong Answer": "Wrong answer",
  "Time Limit Exceeded": "Time limit exceeded",
  "Memory Limit Exceeded": "Memory limit exceeded",
  "Runtime Error": "Runtime error",
};

function memory(kb: number) {
  return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`;
}

/** The verdict area under the editor: idle hint, live progress, or the final result. */
export function ResultPanel({
  submission: s,
  label,
  error,
}: {
  submission: ArenaSubmission | null;
  label: string;
  error: string;
}) {
  return (
    <div
      aria-live="polite"
      className="box-border max-h-[42%] min-h-[96px] flex-none overflow-y-auto border-t border-hairline bg-canvas px-4 py-3 max-lg:max-h-none"
    >
      {error && <p className="m-0 mb-2 text-small text-danger-text">{error}</p>}
      {!s ? (
        !error && (
          <p className="m-0 text-small text-ink-subtle">
            Submit to run your code against the hidden tests. Results show here as each batch
            finishes.
          </p>
        )
      ) : !isFinished(s) ? (
        <Running submission={s} label={label} />
      ) : (
        <Finished submission={s} />
      )}
    </div>
  );
}

function Running({ submission: s, label }: { submission: ArenaSubmission; label: string }) {
  const done = s.progress?.done ?? 0;
  const total = s.progress?.total ?? 0;
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-small text-ink">
        <Icon name="loader" size={14} className="text-primary motion-safe:animate-spin" />
        {label || (s.status === "QUEUED" ? "Queued" : "Running tests")}
      </div>
      <div
        role="progressbar"
        aria-label="Judging progress"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-1 overflow-hidden rounded-full bg-surface-3"
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-(--duration-base) ease-standard"
          style={{ width: `${Math.max(pct, 4)}%` }}
        />
      </div>
    </div>
  );
}

function Finished({ submission: s }: { submission: ArenaSubmission }) {
  const total = s.totalTests ?? 0;
  const passed = s.passed ?? 0;
  const byN = new Map((s.tests ?? []).map((t) => [t.n, t]));
  const summary =
    s.verdict === "Accepted"
      ? `All ${total} tests passed.`
      : s.verdict === "Compile Error"
        ? "Your code didn't compile."
        : s.verdict === "Internal Error"
          ? (s.message ?? "The judge couldn't finish this submission. Submit again in a moment.")
          : s.failedTest
            ? `Failed on test ${s.failedTest}. ${passed} of ${total} passed.`
            : `${passed} of ${total} tests passed.`;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <VerdictBadge verdict={s.verdict} />
        <span className="text-small text-ink">{summary}</span>
        {s.maxTimeMs != null && s.verdict !== "Compile Error" && (
          <span className="ml-auto font-mono text-caption text-ink-subtle">
            Slowest {s.maxTimeMs} ms · Peak {memory(s.maxMemKb ?? 0)}
          </span>
        )}
      </div>
      {s.verdict === "Compile Error" && s.compileOutput && (
        <pre className="m-0 max-h-48 overflow-auto rounded-md border border-hairline bg-surface-2 px-3 py-2 font-mono text-caption leading-[1.5] whitespace-pre-wrap text-ink-muted">
          {s.compileOutput}
        </pre>
      )}
      {total > 0 && s.verdict !== "Compile Error" && (
        <ul aria-label="Tests" className="m-0 flex list-none flex-wrap gap-1 p-0">
          {Array.from({ length: total }, (_, i) => {
            const t = byN.get(i + 1);
            const text = t
              ? `Test ${t.n}: ${SHORT[t.verdict]}, ${t.timeMs} ms, ${memory(t.memKb)}`
              : `Test ${i + 1}: not run`;
            return (
              <li
                key={i}
                title={text}
                aria-label={text}
                className={cx(
                  "size-3.5 rounded-xs border",
                  !t
                    ? "border-hairline bg-surface-2"
                    : t.verdict === "Accepted"
                      ? "border-success-line bg-success-soft"
                      : "border-danger-line bg-danger-soft",
                )}
              />
            );
          })}
        </ul>
      )}
      {s.verdict !== "Accepted" &&
        s.verdict !== "Compile Error" &&
        s.verdict !== "Internal Error" && (
          <p className="m-0 text-caption text-ink-subtle">
            Tests are hidden, so you won&apos;t see the input. Check edge cases: the smallest and
            largest sizes, equal values, and numbers that overflow 32 bits.
          </p>
        )}
    </div>
  );
}
