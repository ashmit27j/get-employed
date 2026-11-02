"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ArenaMcqResult, ArenaMcqSet, ArenaProgress } from "@ge/core";
import { Button, Icon, cx } from "@ge/ui";
import { arenaRequest, errorMessage } from "@/lib/arena-client";
import { ArenaMarkdown } from "./ArenaMarkdown";
import { DifficultyBadge, ResourceList } from "./parts";

type Phase = "intro" | "running" | "result";

function clock(s: number) {
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

export function McqRunner({
  set,
  best,
}: {
  set: ArenaMcqSet;
  best?: ArenaProgress["mcq"][number];
}) {
  const total = set.questions.length;
  const [phase, setPhase] = useState<Phase>("intro");
  const [answers, setAnswers] = useState<number[]>(() => set.questions.map(() => -1));
  const [index, setIndex] = useState(0);
  const [left, setLeft] = useState(set.minutes * 60);
  const [result, setResult] = useState<ArenaMcqResult | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const startedAt = useRef(0);
  const answered = answers.filter((a) => a >= 0).length;

  const submit = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const r = await arenaRequest<ArenaMcqResult>(`/mcq/${set.setId}/attempts`, {
        method: "POST",
        body: {
          answers,
          seconds: Math.round((Date.now() - startedAt.current) / 1000),
        },
      });
      setResult(r);
      setPhase("result");
      window.scrollTo({ top: 0 });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }, [answers, busy, set.setId]);

  // Countdown; time running out submits whatever is answered.
  const submitRef = useRef(submit);
  useEffect(() => {
    submitRef.current = submit;
  });
  useEffect(() => {
    if (phase !== "running") return;
    const t = setInterval(() => {
      setLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          void submitRef.current();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [phase]);

  const start = () => {
    setAnswers(set.questions.map(() => -1));
    setIndex(0);
    setLeft(set.minutes * 60);
    setResult(null);
    setError("");
    startedAt.current = Date.now();
    setPhase("running");
  };

  if (phase === "intro") {
    return (
      <div className="flex max-w-[720px] flex-col gap-5">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="m-0 text-headline font-semibold text-ink">{set.title}</h1>
          <DifficultyBadge difficulty={set.difficulty} />
        </div>
        <p className="m-0 text-small text-pretty text-ink-subtle">{set.description}</p>
        <div className="flex flex-wrap gap-5 text-small text-ink-muted">
          <span className="inline-flex items-center gap-1.5">
            <Icon name="list-checks" size={14} className="text-ink-subtle" />
            {total} questions
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Icon name="timer" size={14} className="text-ink-subtle" />
            {set.minutes} minutes
          </span>
          {best && (
            <span className="inline-flex items-center gap-1.5">
              <Icon name="trophy" size={14} className="text-ink-subtle" />
              Your best{" "}
              <span className="font-mono">
                {best.best} / {best.total}
              </span>
            </span>
          )}
        </div>
        <p className="m-0 text-caption text-ink-subtle">
          The timer starts when you begin. When it runs out, your answers are submitted as they are.
          You&apos;ll see every explanation afterwards.
        </p>
        <Button onClick={start} className="self-start" iconLeft={<Icon name="play" size={14} />}>
          {best ? "Try again" : "Start"}
        </Button>
        {set.resources.length > 0 && (
          <section className="flex flex-col gap-2">
            <h2 className="m-0 text-small font-semibold text-ink">Revise first</h2>
            <ResourceList resources={set.resources} />
          </section>
        )}
      </div>
    );
  }

  if (phase === "result" && result) {
    const pct = Math.round((result.score / result.total) * 100);
    return (
      <div className="flex max-w-[820px] flex-col gap-6">
        <div className="flex flex-wrap items-end justify-between gap-4 rounded-lg border border-hairline bg-surface-1 p-6 shadow-edge">
          <div className="flex flex-col gap-1">
            <span className="text-caption text-ink-subtle">Your score</span>
            <span className="font-mono text-stat text-ink">
              {result.score} / {result.total}
            </span>
            <span className="text-small text-ink-subtle">
              {pct >= 80
                ? "Strong result. Review the explanations for the ones you missed."
                : pct >= 50
                  ? "A good base. The explanations below show where the marks went."
                  : "Worth another pass. Read the explanations, then try the set again."}
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" href="/arena">
              Back to Coding Arena
            </Button>
            <Button onClick={start} iconLeft={<Icon name="rotate-ccw" size={14} />}>
              Try again
            </Button>
          </div>
        </div>
        <ol className="m-0 flex list-none flex-col gap-4 p-0">
          {set.questions.map((q, i) => {
            const r = result.review[i];
            return (
              <li
                key={q.id}
                className="flex flex-col gap-3 rounded-lg border border-hairline bg-surface-1 p-5"
              >
                <div className="flex items-start gap-3">
                  <Icon
                    name={r?.correct ? "circle-check" : "circle-x"}
                    size={18}
                    className={cx(
                      "mt-0.5 flex-none",
                      r?.correct ? "text-success-ink" : "text-danger-ink",
                    )}
                  />
                  <span className="sr-only">{r?.correct ? "Correct" : "Incorrect"}</span>
                  <div className="flex min-w-0 flex-1 flex-col gap-3">
                    <ArenaMarkdown source={`**${i + 1}.** ${q.prompt}`} className="text-ink" />
                    <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
                      {q.options.map((o, j) => {
                        const isAnswer = r?.answer === j;
                        const isChosen = r?.chosen === j;
                        return (
                          <li
                            key={j}
                            className={cx(
                              "flex items-center gap-2 rounded-md border px-3 py-2 text-small",
                              isAnswer
                                ? "border-success-line bg-success-soft text-ink"
                                : isChosen
                                  ? "border-danger-line bg-danger-soft text-ink"
                                  : "border-hairline text-ink-muted",
                            )}
                          >
                            <span className="flex-1">{o}</span>
                            {isAnswer && (
                              <span className="text-caption text-success-ink">Answer</span>
                            )}
                            {isChosen && !isAnswer && (
                              <span className="text-caption text-danger-ink">Your answer</span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                    {r?.chosen === -1 && (
                      <span className="text-caption text-ink-subtle">
                        You didn&apos;t answer this one.
                      </span>
                    )}
                    {r && <ArenaMarkdown source={r.explanation} className="text-caption" />}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    );
  }

  const q = set.questions[index]!;
  const pick = (j: number) => setAnswers((a) => a.map((v, i) => (i === index ? j : v)));
  const lowTime = left <= 60;
  return (
    <div className="flex max-w-[820px] flex-col gap-5">
      <div className="flex flex-wrap items-center gap-4">
        <span className="text-small text-ink-subtle">
          Question <span className="font-mono text-ink">{index + 1}</span> of {total}
        </span>
        <span className="text-small text-ink-subtle">
          <span className="font-mono text-ink">{answered}</span> answered
        </span>
        <span
          role="timer"
          aria-live={lowTime ? "assertive" : "off"}
          className={cx(
            "ml-auto inline-flex items-center gap-1.5 font-mono text-small",
            lowTime ? "text-danger-ink" : "text-ink",
          )}
        >
          <Icon name="timer" size={14} />
          {clock(left)}
        </span>
      </div>
      <nav aria-label="Questions" className="flex flex-wrap gap-1.5">
        {set.questions.map((qq, i) => (
          <button
            key={qq.id}
            type="button"
            onClick={() => setIndex(i)}
            aria-current={i === index ? "step" : undefined}
            aria-label={`Question ${i + 1}${answers[i]! >= 0 ? ", answered" : ""}`}
            className={cx(
              "size-8 cursor-pointer rounded-sm border font-mono text-caption transition-colors duration-(--duration-base) ease-standard",
              i === index
                ? "border-primary-line bg-primary-soft text-ink"
                : answers[i]! >= 0
                  ? "border-hairline-strong bg-surface-3 text-ink"
                  : "border-hairline bg-surface-1 text-ink-subtle hover:text-ink",
            )}
          >
            {i + 1}
          </button>
        ))}
      </nav>
      <fieldset className="m-0 flex flex-col gap-4 rounded-lg border border-hairline bg-surface-1 p-6 shadow-edge">
        <legend className="sr-only">Question {index + 1}</legend>
        <ArenaMarkdown source={q.prompt} className="text-body text-ink" />
        <div className="flex flex-col gap-2">
          {q.options.map((o, j) => {
            const on = answers[index] === j;
            return (
              <label
                key={j}
                className={cx(
                  "flex cursor-pointer items-center gap-3 rounded-md border px-3.5 py-2.5 text-small transition-colors duration-(--duration-base) ease-standard has-focus-visible:shadow-focus",
                  on
                    ? "border-primary-line bg-primary-soft text-ink"
                    : "border-hairline text-ink-muted hover:border-hairline-strong hover:text-ink",
                )}
              >
                <input
                  type="radio"
                  name={`q-${q.id}`}
                  checked={on}
                  onChange={() => pick(j)}
                  className="sr-only"
                />
                <span
                  aria-hidden="true"
                  className={cx(
                    "flex size-4 flex-none items-center justify-center rounded-full border",
                    on ? "border-primary" : "border-hairline-strong",
                  )}
                >
                  {on && <span className="size-2 rounded-full bg-primary" />}
                </span>
                {o}
              </label>
            );
          })}
        </div>
      </fieldset>
      {error && <p className="m-0 text-small text-danger-text">{error}</p>}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          disabled={index === 0}
          onClick={() => setIndex((i) => i - 1)}
          iconLeft={<Icon name="chevron-left" size={14} />}
        >
          Previous
        </Button>
        {index < total - 1 ? (
          <Button
            variant="secondary"
            onClick={() => setIndex((i) => i + 1)}
            iconRight={<Icon name="chevron-right" size={14} />}
          >
            Next
          </Button>
        ) : null}
        <Button onClick={submit} disabled={busy} className="ml-auto">
          {busy
            ? "Submitting"
            : answered < total
              ? `Submit with ${total - answered} unanswered`
              : "Submit answers"}
        </Button>
      </div>
    </div>
  );
}
