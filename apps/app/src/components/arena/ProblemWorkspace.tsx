"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  LANGUAGE_LABEL,
  isFinished,
  tagLabel,
  timeAgo,
  type ArenaEditorial,
  type ArenaLanguage,
  type ArenaProblem,
  type ArenaSubmission,
} from "@ge/core";
import { Button, Icon, Kbd, Segmented, Tag, cx } from "@ge/ui";
import { ArenaRequestError, arenaRequest, errorMessage, useArenaSocket } from "@/lib/arena-client";
import { ArenaMarkdown } from "./ArenaMarkdown";
import { DifficultyBadge, ResourceList, VerdictBadge } from "./parts";
import { ResultPanel } from "./ResultPanel";

const CodeEditor = dynamic(() => import("./CodeEditor"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-caption text-ink-subtle">
      Loading the editor…
    </div>
  ),
});

type Tab = "problem" | "hints" | "editorial" | "submissions";
const LANGS: ArenaLanguage[] = ["cpp", "python"];
const MAX_CODE_BYTES = 64 * 1024;
const POLL_MS = 2000;
const GIVE_UP_MS = 120_000;

const draftKey = (slug: string, lang: ArenaLanguage) => `ge-arena-draft:${slug}:${lang}`;
const LANG_KEY = "ge-arena-language";

function readStore(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function writeStore(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // Private mode or storage full: drafts just aren't kept.
  }
}

function seconds(ms: number) {
  return ms % 1000 === 0 ? `${ms / 1000} s` : `${(ms / 1000).toFixed(1)} s`;
}

export function ProblemWorkspace({ problem }: { problem: ArenaProblem }) {
  const slug = problem.slug;
  const [tab, setTab] = useState<Tab>("problem");
  const [lang, setLang] = useState<ArenaLanguage>("cpp");
  const [code, setCode] = useState(problem.starter.cpp);
  const [solved, setSolved] = useState(problem.solved);

  const [current, setCurrent] = useState<ArenaSubmission | null>(null);
  const [label, setLabel] = useState("");
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(false);

  const [editorial, setEditorial] = useState<ArenaEditorial | null>(null);
  const [editorialError, setEditorialError] = useState("");
  const [hintsShown, setHintsShown] = useState(0);
  const [editorialOpen, setEditorialOpen] = useState(false);
  const [history, setHistory] = useState<ArenaSubmission[] | null>(null);
  const [historyError, setHistoryError] = useState("");

  // Restore the last language and this problem's draft once the editor exists (client only,
  // so the server render and hydration agree). Drafts are a per-browser convenience.
  const restored = useRef(false);
  const onEditorReady = useCallback(() => {
    if (restored.current) return;
    restored.current = true;
    const l: ArenaLanguage = readStore(LANG_KEY) === "python" ? "python" : "cpp";
    setLang(l);
    setCode(readStore(draftKey(slug, l)) ?? problem.starter[l]);
  }, [slug, problem.starter]);

  const changeCode = (v: string) => {
    setCode(v);
    writeStore(draftKey(slug, lang), v === problem.starter[lang] ? null : v);
  };
  const changeLang = (v: string) => {
    const l = v as ArenaLanguage;
    setLang(l);
    writeStore(LANG_KEY, l);
    setCode(readStore(draftKey(slug, l)) ?? problem.starter[l]);
  };
  const resetCode = () => {
    setCode(problem.starter[lang]);
    writeStore(draftKey(slug, lang), null);
  };

  const running = current !== null && !isFinished(current);
  const currentId = useRef<string | null>(null);
  useEffect(() => {
    currentId.current = current && !isFinished(current) ? current.submissionId : null;
  }, [current]);

  const finish = useCallback((s: ArenaSubmission) => {
    setCurrent(s);
    setLabel("");
    if (s.verdict === "Accepted") setSolved(true);
    setHistory((h) => (h ? [s, ...h.filter((x) => x.submissionId !== s.submissionId)] : h));
  }, []);

  useArenaSocket((m) => {
    if (m.type === "pong" || m.submissionId !== currentId.current) return;
    if (m.type === "progress") {
      setLabel(m.label);
      setCurrent((c) =>
        c ? { ...c, status: "RUNNING", progress: { done: m.done, total: m.total } } : c,
      );
    } else if (isFinished(m.submission)) {
      finish(m.submission);
    }
  });

  // Polling fallback: the socket may be blocked or reconnecting. Runs only while judging.
  const pollId = current && !isFinished(current) ? current.submissionId : null;
  useEffect(() => {
    if (!pollId) return;
    const started = Date.now();
    const ctrl = new AbortController();
    const timer = setInterval(async () => {
      if (Date.now() - started > GIVE_UP_MS) {
        clearInterval(timer);
        setError("The judge is taking longer than usual. Check Submissions in a minute.");
        setCurrent((c) => (c?.submissionId === pollId ? null : c));
        return;
      }
      try {
        const r = await arenaRequest<{ submission: ArenaSubmission }>(`/submissions/${pollId}`, {
          signal: ctrl.signal,
        });
        if (currentId.current !== pollId) return;
        if (isFinished(r.submission)) finish(r.submission);
        else
          setCurrent((c) =>
            c?.submissionId === pollId
              ? { ...c, status: r.submission.status, progress: r.submission.progress }
              : c,
          );
      } catch {
        // Keep polling; a single failed request isn't worth showing.
      }
    }, POLL_MS);
    return () => {
      clearInterval(timer);
      ctrl.abort();
    };
  }, [pollId, finish]);

  const submit = async () => {
    if (running || cooldown) return;
    setError("");
    if (!code.trim()) return setError("Write some code before you submit.");
    if (new TextEncoder().encode(code).length > MAX_CODE_BYTES)
      return setError("Code must be 64 KB or less.");
    try {
      const r = await arenaRequest<{ submissionId: string }>("/submissions", {
        method: "POST",
        body: { slug, language: lang, code },
      });
      setLabel("Queued");
      setCurrent({
        submissionId: r.submissionId,
        slug,
        language: lang,
        status: "QUEUED",
        createdAt: new Date().toISOString(),
        code,
      });
    } catch (e) {
      setError(errorMessage(e));
      if (e instanceof ArenaRequestError && e.status === 429) {
        setCooldown(true);
        setTimeout(() => setCooldown(false), e.retryAfterMs ?? 10_000);
      }
    }
  };

  const loadEditorial = useCallback(async () => {
    if (editorial) return;
    setEditorialError("");
    try {
      const r = await arenaRequest<{ editorial: ArenaEditorial }>(`/problems/${slug}/editorial`);
      setEditorial(r.editorial);
    } catch (e) {
      setEditorialError(errorMessage(e));
    }
  }, [editorial, slug]);

  const loadHistory = useCallback(async () => {
    setHistoryError("");
    try {
      const r = await arenaRequest<{ submissions: ArenaSubmission[] }>(
        `/problems/${slug}/submissions`,
      );
      setHistory(r.submissions);
    } catch (e) {
      setHistoryError(errorMessage(e));
    }
  }, [slug]);

  const openTab = (v: string) => {
    const t = v as Tab;
    setTab(t);
    if (t === "hints" || t === "editorial") void loadEditorial();
    if (t === "submissions" && history === null) void loadHistory();
  };

  const openInEditor = (s: ArenaSubmission) => {
    if (!s.code) return;
    setLang(s.language);
    writeStore(LANG_KEY, s.language);
    setCode(s.code);
    writeStore(draftKey(slug, s.language), s.code);
  };

  return (
    <main className="grid h-[calc(100dvh-56px)] grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] max-lg:h-auto max-lg:grid-cols-1">
      <section
        aria-label="Problem"
        className="flex min-h-0 flex-col border-r border-hairline max-lg:border-r-0 max-lg:border-b"
      >
        <div className="flex flex-none items-center gap-3 border-b border-hairline px-6 py-2.5 max-md:px-4">
          <Segmented
            label="Problem sections"
            value={tab}
            onChange={openTab}
            options={[
              { value: "problem", label: "Problem", icon: "file-text" },
              { value: "hints", label: "Hints", icon: "lightbulb" },
              { value: "editorial", label: "Editorial", icon: "book-open" },
              { value: "submissions", label: "Submissions", icon: "history" },
            ]}
          />
        </div>
        <div
          role="tabpanel"
          aria-label={tab}
          className="min-h-0 flex-1 overflow-y-auto px-6 py-6 max-md:px-4"
        >
          {tab === "problem" && <Statement problem={problem} solved={solved} />}
          {tab === "hints" && (
            <Hints
              editorial={editorial}
              error={editorialError}
              shown={hintsShown}
              onShow={() => setHintsShown((n) => n + 1)}
              onRetry={loadEditorial}
            />
          )}
          {tab === "editorial" && (
            <EditorialView
              editorial={editorial}
              error={editorialError}
              open={editorialOpen || solved}
              onOpen={() => setEditorialOpen(true)}
              onRetry={loadEditorial}
            />
          )}
          {tab === "submissions" && (
            <History
              history={history}
              error={historyError}
              onRetry={loadHistory}
              onOpen={openInEditor}
            />
          )}
        </div>
      </section>

      <section aria-label="Code" className="flex min-h-0 flex-col max-lg:min-h-[640px]">
        <div className="flex flex-none flex-wrap items-center gap-2 border-b border-hairline px-4 py-2.5">
          <Segmented
            label="Language"
            value={lang}
            onChange={changeLang}
            options={LANGS.map((l) => ({ value: l, label: LANGUAGE_LABEL[l] }))}
          />
          <Button
            variant="tertiary"
            size="sm"
            onClick={resetCode}
            iconLeft={<Icon name="rotate-ccw" size={13} />}
          >
            Reset
          </Button>
          <span className="ml-auto inline-flex items-center gap-2 text-caption text-ink-tertiary max-md:hidden">
            <Kbd>Ctrl+Enter</Kbd>
          </span>
          <Button
            size="sm"
            onClick={submit}
            disabled={running || cooldown}
            iconLeft={
              <Icon
                name={running ? "loader" : "play"}
                size={13}
                className={running ? "motion-safe:animate-spin" : undefined}
              />
            }
          >
            {running ? "Judging" : "Submit"}
          </Button>
        </div>
        <div className="relative min-h-[320px] flex-1">
          <div className="absolute inset-0">
            <CodeEditor
              language={lang}
              value={code}
              onChange={changeCode}
              onSubmit={submit}
              onReady={onEditorReady}
              label={`${LANGUAGE_LABEL[lang]} solution for ${problem.title}`}
            />
          </div>
        </div>
        <ResultPanel submission={current} label={label} error={error} />
      </section>
    </main>
  );
}

function Statement({ problem, solved }: { problem: ArenaProblem; solved: boolean }) {
  const block = (title: string, md: string) =>
    md.trim() ? (
      <section className="flex flex-col gap-2">
        <h2 className="m-0 text-small font-semibold text-ink">{title}</h2>
        <ArenaMarkdown source={md} />
      </section>
    ) : null;
  return (
    <article className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="m-0 text-title font-semibold text-ink">{problem.title}</h1>
          <DifficultyBadge difficulty={problem.difficulty} />
          {solved && (
            <span className="inline-flex items-center gap-1 text-caption text-success-ink">
              <Icon name="circle-check" size={14} />
              Solved
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {problem.topics.map((t) => (
            <Tag key={t}>{tagLabel(t)}</Tag>
          ))}
        </div>
      </header>
      <ArenaMarkdown source={problem.statementMd} />
      {block("Input", problem.inputFormatMd)}
      {block("Output", problem.outputFormatMd)}
      {block("Constraints", problem.constraintsMd)}
      <section className="flex flex-col gap-3">
        <h2 className="m-0 text-small font-semibold text-ink">Examples</h2>
        {problem.examples.map((ex, i) => (
          <div
            key={i}
            className="flex flex-col gap-2 rounded-md border border-hairline bg-surface-1 p-3"
          >
            <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1">
              <Sample title={`Input ${i + 1}`} text={ex.input} />
              <Sample title={`Output ${i + 1}`} text={ex.output} />
            </div>
            {ex.explanation && <ArenaMarkdown source={ex.explanation} className="text-caption" />}
          </div>
        ))}
      </section>
      <p className="m-0 font-mono text-caption text-ink-subtle">
        Time limit {seconds(problem.timeLimitMs)} (Python {seconds(problem.pythonTimeLimitMs)}) ·
        Memory {problem.memoryLimitMb} MB
        {problem.checker === "float-1e-6" ? " · Answers within 10⁻⁶ are accepted" : ""}
      </p>
      {problem.resources.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="m-0 text-small font-semibold text-ink">Learn more</h2>
          <ResourceList resources={problem.resources} />
        </section>
      )}
    </article>
  );
}

function Sample({ title, text }: { title: string; text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <div className="flex items-center justify-between text-caption text-ink-subtle">
        {title}
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(text);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            } catch {
              // Clipboard blocked: nothing to do.
            }
          }}
          className="inline-flex cursor-pointer items-center gap-1 rounded-xs px-1 text-caption text-ink-subtle hover:text-ink"
          aria-label={`Copy ${title.toLowerCase()}`}
        >
          <Icon name={copied ? "check" : "copy"} size={12} />
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="m-0 overflow-x-auto rounded-sm bg-surface-2 px-3 py-2 font-mono text-caption leading-[1.6] text-ink">
        {text.replace(/\n$/, "")}
      </pre>
    </div>
  );
}

function Loading({ error, onRetry }: { error: string; onRetry: () => void }) {
  return error ? (
    <div className="flex flex-col items-start gap-2 text-small text-danger-text">
      {error}
      <Button variant="secondary" size="sm" onClick={onRetry}>
        Try again
      </Button>
    </div>
  ) : (
    <div className="flex items-center gap-2 text-small text-ink-subtle">
      <Icon name="loader" size={14} className="motion-safe:animate-spin" />
      Loading…
    </div>
  );
}

function Hints({
  editorial,
  error,
  shown,
  onShow,
  onRetry,
}: {
  editorial: ArenaEditorial | null;
  error: string;
  shown: number;
  onShow: () => void;
  onRetry: () => void;
}) {
  if (!editorial) return <Loading error={error} onRetry={onRetry} />;
  const hints = editorial.hints;
  return (
    <div className="flex flex-col gap-4">
      <p className="m-0 text-small text-ink-subtle">
        Each hint gives away a little more. Open one, think it over, and only open the next if
        you&apos;re still stuck.
      </p>
      <ol className="m-0 flex list-none flex-col gap-3 p-0">
        {hints.slice(0, shown).map((h, i) => (
          <li key={i} className="flex gap-3 rounded-md border border-hairline bg-surface-1 p-4">
            <span className="font-mono text-caption text-primary">{i + 1}</span>
            <ArenaMarkdown source={h} />
          </li>
        ))}
      </ol>
      {shown < hints.length ? (
        <Button
          variant="secondary"
          size="sm"
          onClick={onShow}
          iconLeft={<Icon name="lightbulb" size={13} />}
          className="self-start"
        >
          Show hint {shown + 1} of {hints.length}
        </Button>
      ) : (
        <p className="m-0 text-caption text-ink-subtle">
          That&apos;s every hint. The editorial walks through the full solution.
        </p>
      )}
    </div>
  );
}

function EditorialView({
  editorial,
  error,
  open,
  onOpen,
  onRetry,
}: {
  editorial: ArenaEditorial | null;
  error: string;
  open: boolean;
  onOpen: () => void;
  onRetry: () => void;
}) {
  const [lang, setLang] = useState<ArenaLanguage>("cpp");
  if (!open) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-md border border-hairline bg-surface-1 p-5">
        <div className="text-small font-medium text-ink">The editorial has the full solution</div>
        <p className="m-0 text-small text-ink-subtle">
          You&apos;ll learn more if you try the hints first. It&apos;s always here when you want it.
        </p>
        <Button variant="secondary" size="sm" onClick={onOpen}>
          Show the editorial
        </Button>
      </div>
    );
  }
  if (!editorial) return <Loading error={error} onRetry={onRetry} />;
  return (
    <article className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-4 font-mono text-caption text-ink-subtle">
        <span>
          Time <span className="text-ink">{editorial.complexity.time}</span>
        </span>
        <span>
          Space <span className="text-ink">{editorial.complexity.space}</span>
        </span>
      </div>
      <ArenaMarkdown source={editorial.editorialMd} />
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <h2 className="m-0 text-small font-semibold text-ink">Reference solution</h2>
          <Segmented
            label="Solution language"
            value={lang}
            onChange={(v) => setLang(v as ArenaLanguage)}
            options={LANGS.map((l) => ({ value: l, label: LANGUAGE_LABEL[l] }))}
          />
        </div>
        <pre className="m-0 overflow-x-auto rounded-md border border-hairline bg-surface-2 px-3 py-2.5 font-mono text-caption leading-[1.6] text-ink-muted">
          {editorial.solutions[lang]}
        </pre>
      </section>
    </article>
  );
}

function History({
  history,
  error,
  onRetry,
  onOpen,
}: {
  history: ArenaSubmission[] | null;
  error: string;
  onRetry: () => void;
  onOpen: (s: ArenaSubmission) => void;
}) {
  if (!history) return <Loading error={error} onRetry={onRetry} />;
  if (!history.length)
    return (
      <p className="m-0 text-small text-ink-subtle">
        You haven&apos;t submitted this problem yet. Your last 25 submissions will show here.
      </p>
    );
  const now = new Date();
  return (
    <ul className="m-0 flex list-none flex-col divide-y divide-hairline rounded-md border border-hairline p-0">
      {history.map((s) => (
        <li key={s.submissionId} className="flex flex-wrap items-center gap-3 px-3 py-2.5">
          <VerdictBadge verdict={isFinished(s) ? s.verdict : undefined} />
          <span className="text-caption text-ink-muted">{LANGUAGE_LABEL[s.language]}</span>
          {s.totalTests ? (
            <span className="font-mono text-caption text-ink-subtle">
              {s.passed ?? 0}/{s.totalTests}
            </span>
          ) : null}
          {s.maxTimeMs != null && (
            <span className="font-mono text-caption text-ink-subtle">{s.maxTimeMs} ms</span>
          )}
          <span className="ml-auto font-mono text-caption text-ink-tertiary">
            {timeAgo(s.createdAt, now)} ago
          </span>
          <button
            type="button"
            disabled={!s.code}
            onClick={() => onOpen(s)}
            className={cx(
              "inline-flex cursor-pointer items-center gap-1 rounded-xs px-1 text-caption text-ink-subtle hover:text-ink",
              "disabled:cursor-not-allowed disabled:opacity-40",
            )}
          >
            <Icon name="pencil-line" size={12} />
            Open in editor
          </button>
        </li>
      ))}
    </ul>
  );
}
