"use client";
import { Button, Icon, MatchRing, MetricReadout, PageHeader, Panel, ScoreBar, cx } from "@ge/ui";
import { MCQ_BANK, type RubricScores } from "@ge/core";
import type { SessionView } from "@/server/interview";

const RUBRIC: [keyof RubricScores, string][] = [
  ["communication", "Communication"],
  ["technical", "Technical accuracy"],
  ["structure", "Structure"],
  ["confidence", "Confidence"],
];

const day = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "2-digit" });
const fmt = (n: number) =>
  `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;
const signed = (n: number) => (n > 0 ? `+${n}` : String(n));

/**
 * The feedback for one session (prototype/Interview.dc.html "Interview feedback"; a multiple-choice
 * session shows its test results). `sessions` is newest first, for the comparisons and progress.
 */
export function Report({ session, sessions }: { session: SessionView; sessions: SessionView[] }) {
  if (session.format === "mcq") return <McqResults session={session} />;

  const idx = sessions.findIndex((s) => s.id === session.id);
  const older = sessions.slice(idx + 1);
  const prev = older.find((s) => s.format !== "mcq" && s.score != null);
  const prevWithMetrics = older.find((s) => s.report?.metrics);
  const report = session.report;
  const minutes = Math.max(1, Math.round((session.durationS ?? 0) / 60));
  const questions = report?.answers.length ?? report?.questions?.length;
  const sub = [
    `${session.type === "behavioural" ? "Behavioural" : "Technical"} mock`,
    session.format === "typed" ? "typed" : null,
    day(session.startedAt),
    `${minutes} min`,
    questions ? `${questions} questions` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const delta = prev?.score != null && session.score != null ? session.score - prev.score : null;
  const scored = sessions.filter((s) => s.format !== "mcq" && s.score != null);
  const at = Math.max(
    0,
    scored.findIndex((s) => s.id === session.id),
  );
  const history = scored.slice(at, at + 5).reverse();
  const m = report?.metrics;
  const pm = prevWithMetrics?.report?.metrics;

  return (
    <section aria-label="Interview feedback" className="flex flex-col gap-6">
      <PageHeader title={session.label} sub={sub}>
        <Button href="/interview">Practise again</Button>
      </PageHeader>
      <div className="flex flex-wrap items-start gap-6">
        <div className="min-w-0 flex-[1_1_320px]">
          <Panel
            title="Rubric"
            meta={
              delta == null
                ? undefined
                : delta === 0
                  ? "Same as last session"
                  : `${signed(delta)} since last session`
            }
            padded
          >
            <div className="flex items-center gap-4">
              <MatchRing value={session.score ?? 0} size={88} />
              <p className="m-0 text-small text-pretty text-ink-muted">
                {report?.summary ??
                  "This session was scored before written feedback was available."}
              </p>
            </div>
            {session.rubric &&
              RUBRIC.map(([k, label]) => (
                <ScoreBar
                  key={k}
                  label={label}
                  value={session.rubric![k]}
                  gain={prev?.rubric ? Math.max(0, session.rubric![k] - prev.rubric[k]) : 0}
                />
              ))}
          </Panel>
        </div>
        <div className="flex min-w-0 flex-[2_1_480px] flex-col gap-4">
          {m && (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3">
              {m.wpm != null && (
                <MetricReadout
                  label="Speaking pace"
                  value={m.wpm}
                  unit="wpm"
                  trend={pm?.wpm != null ? m.wpm - pm.wpm : undefined}
                  hint={
                    m.wpm > 160
                      ? "Fast; slow down on the hard questions"
                      : m.wpm < 110
                        ? "Slow; keep your answers moving"
                        : "In range"
                  }
                />
              )}
              <MetricReadout
                label="Filler words"
                value={m.fillers}
                trend={pm ? m.fillers - pm.fillers : undefined}
                hint={m.fillers === 0 ? "None counted" : "Pause instead of filling the gap"}
              />
            </div>
          )}
          {history.length > 1 && (
            <Panel
              title="Progress"
              sub={`Overall score across your last ${history.length === 5 ? "five" : history.length} sessions`}
            >
              <div className="flex h-[140px] items-end gap-3 px-5 pt-5 pb-3">
                {history.map((h) => (
                  <div
                    key={h.id}
                    className="flex h-full flex-1 flex-col items-center justify-end gap-1.5"
                  >
                    <span className="font-mono text-caption text-ink-muted">{h.score}</span>
                    <div
                      className={cx(
                        "w-full max-w-10 rounded-xs",
                        h.id === session.id ? "bg-primary" : "bg-surface-4",
                      )}
                      style={{ height: `${((h.score ?? 0) / 100) * 90}px` }}
                    />
                    <span className="text-caption text-ink-subtle">{day(h.startedAt)}</span>
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </div>
      </div>
      {report && report.answers.length > 0 && (
        <Panel title="Answer by answer">
          {report.answers.map((a, i) => (
            <div
              key={i}
              className="grid grid-cols-[32px_minmax(0,1fr)_auto] items-start gap-4 border-b border-hairline px-5 py-4 last:border-b-0"
            >
              <span className="font-mono text-ui text-ink-tertiary">Q{i + 1}</span>
              <div className="flex min-w-0 flex-col gap-1.5">
                <span className="text-small text-ink">{a.q}</span>
                <span className="text-small text-pretty text-ink-muted">{a.note}</span>
                <span className="text-caption text-ink-subtle">Try: {a.tip}</span>
              </div>
              <MatchRing value={a.score} size={36} />
            </div>
          ))}
        </Panel>
      )}
    </section>
  );
}

function McqResults({ session }: { session: SessionView }) {
  const picks = session.report?.mcq?.picks ?? [];
  const right = MCQ_BANK.filter((q, i) => picks[i] === q.a).length;
  const answered = picks.filter((p) => p != null).length;
  return (
    <section aria-label="Test results" className="mx-auto flex w-full max-w-[760px] flex-col gap-5">
      <PageHeader title="Test results" sub={`Multiple choice · ${MCQ_BANK.length} questions`}>
        <Button variant="secondary" href="/interview">
          Change format
        </Button>
        <Button href="/interview?start=mcq">Retake</Button>
      </PageHeader>
      <div className="flex items-center gap-5 rounded-xl border border-hairline bg-surface-1 p-6">
        <MatchRing value={session.score ?? 0} size={88} />
        <div className="flex flex-col gap-1">
          <span className="text-body font-semibold">
            {right} of {MCQ_BANK.length} correct
          </span>
          <span className="text-small text-ink-muted">
            Finished in {fmt(session.durationS ?? 0)} · {answered - right} to revisit
          </span>
        </div>
      </div>
      <Panel title="Review">
        {MCQ_BANK.map((q, i) => {
          const p = picks[i];
          const ok = p === q.a;
          return (
            <div
              key={q.q}
              className="grid grid-cols-[20px_minmax(0,1fr)] items-start gap-3.5 border-b border-hairline px-5 py-3.5 last:border-b-0"
            >
              <Icon
                name={p == null ? "circle-dashed" : ok ? "circle-check" : "circle-x"}
                size={16}
                className={cx(
                  "mt-0.5",
                  p == null ? "text-ink-tertiary" : ok ? "text-success-ink" : "text-danger-ink",
                )}
              />
              <div className="flex min-w-0 flex-col gap-1">
                <span className="text-small text-ink">{q.q}</span>
                <span className="text-caption text-ink-subtle">
                  {p == null
                    ? `Not answered · Answer: ${q.opts[q.a]}`
                    : ok
                      ? `Your answer: ${q.opts[p]}`
                      : `Your answer: ${q.opts[p]} · Correct: ${q.opts[q.a]}`}
                </span>
              </div>
            </div>
          );
        })}
      </Panel>
    </section>
  );
}
