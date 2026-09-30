"use client";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Icon, StatusBadge, cx, type IconName } from "@ge/ui";
import { useReducedMotion } from "./motion";

/** Auto-playing product tour: five fake app views, 5.2s each, pausable (prototype/marketing/ProductMock.jsx). */

const DURATION = 5200;
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (x: number) => 1 - Math.pow(1 - x, 3);
/** Progress of a sub-animation starting at `start` ms and lasting `dur` ms, eased. */
const at = (t: number) => (start: number, dur: number) => ease(clamp((t - start) / dur));
const fadeUp = (v: number) => ({ opacity: v, transform: `translateY(${(1 - v) * 8}px)` });

const FEATURES: { id: ViewId; icon: IconName; label: string; title: string }[] = [
  { id: "search", icon: "search", label: "Search", title: "Verified roles only" },
  { id: "tracker", icon: "kanban-square", label: "Tracker", title: "Every application, one board" },
  { id: "resume", icon: "file-text", label: "Resume", title: "Tailored to each role" },
  { id: "alerts", icon: "bell", label: "Alerts", title: "Never miss a follow-up" },
  { id: "salary", icon: "bar-chart-3", label: "Salary", title: "Pay bands up front" },
];
type ViewId = "search" | "tracker" | "resume" | "alerts" | "salary";

const TOUR = {
  q: "Backend engineer, Bengaluru",
  rows: [
    ["Backend Engineer (Go)", "Razorpay", "Bengaluru · Hybrid", "₹18–26 LPA"],
    ["SDE-1, Payments", "Zepto", "Bengaluru", "₹16–22 LPA"],
    ["Platform Engineer", "Postman", "Remote · IN", "₹20–30 LPA"],
    ["Backend Engineer, Growth", "CRED", "Bengaluru", "₹22–32 LPA"],
  ],
  base: {
    Saved: ["Postman · Platform", "Groww · SDE-1"],
    Applied: ["Zepto · SDE-1", "CRED · Growth"],
    Interview: ["Razorpay · Backend"],
    Offer: [] as string[],
  } as Record<string, string[]>,
  mover: "Swiggy · SDE-2",
  cv: ["Priya Nair", "Backend engineer · Bengaluru", "Match score · Razorpay, Backend"],
  tips: [
    "Added “Kafka” and “gRPC” to skills",
    "Quantified impact: p99 latency −38%",
    "Moved Go + Postgres to the top",
  ],
  alerts: [
    ["sparkles", "New match", "Backend Engineer at Razorpay · 94% match", "now"],
    ["clock", "Follow up", "Zepto has been in Applied for 7 days", "2h"],
    ["calendar", "Interview tomorrow", "Swiggy system design · Thu 10:00", "5h"],
    ["trending-up", "Salary update", "Median for your role rose 4% this quarter", "1d"],
  ] as [IconName, string, string, string][],
  salary: {
    from: 14,
    span: 6,
    label: "median · Backend engineer, 1–3 yrs · Bengaluru",
    ticks: ["₹8 LPA", "p25 ₹15 LPA", "p75 ₹26 LPA", "₹42 LPA"],
    notes: ["Based on 412 verified offers", "Updated weekly"],
  },
};

function SearchView({ t }: { t: number }) {
  const p = at(t);
  const typed = TOUR.q.slice(0, Math.floor(clamp(t / 1100) * TOUR.q.length));
  const caretOn = t < 1300 && Math.floor(t / 400) % 2 === 0;
  return (
    <div className="flex flex-col gap-3">
      <div
        className={cx(
          "flex items-center gap-2 rounded-md border border-hairline-strong bg-surface-1 px-3 py-2 transition-shadow duration-200",
          t < 1300 && "shadow-focus",
        )}
      >
        <Icon name="search" size={15} className="text-ink-subtle" />
        <span className="text-ink">
          {typed}
          <span className={cx("text-primary", !caretOn && "opacity-0")}>|</span>
        </span>
        <span
          className="ml-auto font-mono text-caption text-ink-subtle"
          style={{ opacity: p(1200, 300) }}
        >
          1,284 results
        </span>
      </div>
      {TOUR.rows.map(([title, co, where, pay], i) => (
        <div
          key={title}
          className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-3 rounded-md border border-hairline bg-surface-1 px-3 py-2.5 max-md:grid-cols-[minmax(0,1fr)_auto]"
          style={fadeUp(p(1300 + i * 180, 350))}
        >
          <span className="flex min-w-0 flex-col">
            <span className="truncate">{title}</span>
            <span className="text-caption text-ink-subtle">{co}</span>
          </span>
          <span className="text-ink-subtle max-md:hidden">{where}</span>
          <span className="font-mono text-caption text-ink-muted max-md:hidden">{pay}</span>
          <StatusBadge tone="success">Verified</StatusBadge>
        </div>
      ))}
    </div>
  );
}

function TrackerView({ t }: { t: number }) {
  const cols = ["Saved", "Applied", "Interview", "Offer"];
  const step = t < 1400 ? 1 : t < 2900 ? 2 : 3;
  const moved = cols[step];
  return (
    <div className="grid grid-cols-4 gap-2.5 max-md:grid-cols-2">
      {cols.map((c) => (
        <div
          key={c}
          className="flex min-h-[230px] flex-col gap-2 rounded-md border border-hairline bg-surface-1 p-2.5"
        >
          <div className="flex justify-between text-caption text-ink-subtle">
            <span>{c}</span>
            <span className="font-mono">{TOUR.base[c]!.length + (moved === c ? 1 : 0)}</span>
          </div>
          {TOUR.base[c]!.map((x) => (
            <div
              key={x}
              className="rounded-sm border border-hairline bg-surface-2 px-2.5 py-2 text-caption"
            >
              {x}
            </div>
          ))}
          {moved === c && (
            <div
              key={`m${step}`}
              className="ge-pop flex flex-col gap-1 rounded-sm border border-primary bg-surface-3 px-2.5 py-2 text-caption shadow-glow-active"
            >
              <span>{TOUR.mover}</span>
              <span
                className={cx(
                  "text-micro tracking-normal",
                  c === "Offer" ? "text-success" : "text-ink-subtle",
                )}
              >
                {c === "Offer"
                  ? "Offer received"
                  : c === "Interview"
                    ? "Onsite Thu 10:00"
                    : "Applied today"}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ResumeView({ t }: { t: number }) {
  const p = at(t);
  const score = Math.round(62 + 29 * p(600, 2000));
  return (
    <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-3.5 max-md:grid-cols-1">
      <div className="flex flex-col gap-2.5 rounded-md border border-hairline bg-surface-1 p-4 text-caption text-ink-subtle">
        <span className="text-body font-medium text-ink">{TOUR.cv[0]}</span>
        <span>{TOUR.cv[1]}</span>
        {["Summary", "Experience", "Skills"].map((h, i) => (
          <div key={h} className="mt-1 flex flex-col gap-1.5">
            <span className="text-micro tracking-[0.4px] uppercase">{h}</span>
            {[0, 1].map((j) => {
              const hl = p(900 + i * 600, 400);
              const lit = j === 0 && hl > 0;
              return (
                <span
                  key={j}
                  className={cx(
                    "h-2 rounded-[2px] transition-colors duration-300",
                    lit ? "bg-selection" : "bg-surface-3",
                  )}
                  style={{
                    width: `${88 - j * 22 - i * 6}%`,
                    opacity: lit ? 0.3 + 0.7 * hl : undefined,
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2.5 rounded-md border border-hairline bg-surface-1 p-4">
          <span className="text-caption text-ink-subtle">{TOUR.cv[2]}</span>
          <span className="text-stat font-semibold">
            {score}
            <span className="text-body text-ink-subtle">/100</span>
          </span>
          <div className="h-1 overflow-hidden rounded-full bg-surface-3">
            <div
              className="h-full bg-primary shadow-glow-underline"
              style={{ width: `${score}%` }}
            />
          </div>
        </div>
        {TOUR.tips.map((x, i) => (
          <div
            key={x}
            className="flex items-center gap-2 text-caption text-ink-muted"
            style={fadeUp(p(900 + i * 600, 350))}
          >
            <Icon name="check" size={14} className="text-success" />
            {x}
          </div>
        ))}
      </div>
    </div>
  );
}

function AlertsView({ t }: { t: number }) {
  const p = at(t);
  return (
    <div className="flex flex-col gap-2">
      {TOUR.alerts.map(([icon, head, body, when], i) => {
        const v = p(300 + i * 700, 450);
        return (
          <div
            key={head}
            className={cx(
              "flex items-center gap-3 rounded-md border px-3.5 py-3",
              i === 0 ? "border-hairline-strong bg-surface-2" : "border-hairline bg-surface-1",
            )}
            style={{ opacity: v, transform: `translateX(${(1 - v) * 24}px)` }}
          >
            <span
              className={cx(
                "flex size-[30px] flex-none items-center justify-center rounded-md bg-surface-3",
                i === 0 ? "text-primary" : "text-ink-subtle",
              )}
            >
              <Icon name={icon} size={15} />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span>{head}</span>
              <span className="text-caption text-ink-subtle">{body}</span>
            </span>
            <span className="font-mono text-caption text-ink-tertiary">{when}</span>
          </div>
        );
      })}
    </div>
  );
}

function SalaryView({ t }: { t: number }) {
  const p = at(t);
  const g = p(300, 1400);
  const bars = [3, 6, 11, 17, 24, 21, 15, 9, 5, 2];
  const S = TOUR.salary;
  const median = Math.round(S.from + S.span * p(600, 1600));
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline gap-3">
        <span className="text-stat font-semibold">₹{median} LPA</span>
        <span className="text-caption text-ink-subtle">{S.label}</span>
      </div>
      <div className="flex h-[130px] items-end gap-1.5 border-b border-hairline px-1">
        {bars.map((h, i) => {
          const on = i >= 3 && i <= 6;
          return (
            <div
              key={i}
              className={cx(
                "flex-1 rounded-t-xs",
                on ? "bg-primary" : "bg-surface-4",
                on && i === 4 && "shadow-glow-active",
              )}
              style={{ height: `${(h / 24) * 100 * ease(clamp(g * 1.4 - i * 0.05))}%` }}
            />
          );
        })}
      </div>
      <div
        className="flex justify-between font-mono text-caption text-ink-subtle"
        style={{ opacity: p(1800, 400) }}
      >
        <span>{S.ticks[0]}</span>
        <span className="text-ink-muted">{S.ticks[1]}</span>
        <span className="text-ink-muted">{S.ticks[2]}</span>
        <span>{S.ticks[3]}</span>
      </div>
      <div className="flex flex-wrap gap-2" style={fadeUp(p(2200, 400))}>
        {S.notes.map((x) => (
          <span
            key={x}
            className="rounded-full border border-hairline px-2 py-0.5 text-caption text-ink-subtle"
          >
            {x}
          </span>
        ))}
      </div>
    </div>
  );
}

const VIEWS: Record<ViewId, (p: { t: number }) => React.ReactNode> = {
  search: SearchView,
  tracker: TrackerView,
  resume: ResumeView,
  alerts: AlertsView,
  salary: SalaryView,
};

export function ProductTour() {
  const reduced = useReducedMotion();
  const [idx, setIdx] = useState(0);
  const [t, setT] = useState(0);
  const [hover, setHover] = useState(false);
  const [paused, setPaused] = useState(false);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const base = useId();
  // Reduced motion: no auto-advance and every view shows its finished state.
  const stopped = hover || paused || reduced;

  // Elapsed time lives in a ref so advancing to the next view happens exactly once per lap.
  const elapsed = useRef(0);
  useEffect(() => {
    if (stopped) return;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      elapsed.current += now - last;
      last = now;
      if (elapsed.current >= DURATION) {
        elapsed.current = 0;
        setIdx((i) => (i + 1) % FEATURES.length);
      }
      setT(elapsed.current);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [stopped]);

  const jump = (i: number) => {
    elapsed.current = 0;
    setIdx(i);
    setT(0);
  };
  const onKey = (e: KeyboardEvent, i: number) => {
    const d = e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const n = (i + d + FEATURES.length) % FEATURES.length;
    tabs.current[n]?.focus();
    jump(n);
  };
  const f = FEATURES[idx]!;
  const View = VIEWS[f.id];
  const shownT = reduced ? DURATION - 1 : t;
  const progress = `${(t / DURATION) * 100}%`;

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="grid min-h-[400px] grid-cols-[200px_minmax(0,1fr)] overflow-hidden rounded-lg border border-hairline bg-canvas text-ui max-lg:grid-cols-1"
    >
      <aside
        role="tablist"
        aria-label="Product tour"
        aria-orientation="vertical"
        className="flex flex-col gap-0.5 border-r border-hairline bg-surface-1 p-3 max-lg:hidden"
      >
        {FEATURES.map((x, i) => {
          const on = i === idx;
          return (
            <button
              key={x.id}
              ref={(el) => {
                tabs.current[i] = el;
              }}
              id={`${base}-t${i}`}
              role="tab"
              aria-selected={on}
              aria-controls={`${base}-panel`}
              tabIndex={on ? 0 : -1}
              onClick={() => jump(i)}
              onKeyDown={(e) => onKey(e, i)}
              className={cx(
                "relative flex cursor-pointer items-center gap-2.5 overflow-hidden rounded-sm px-2.5 py-[7px] text-left text-ui",
                on ? "bg-surface-3 text-ink" : "text-ink-subtle hover:text-ink",
              )}
            >
              <Icon name={x.icon} size={15} className={on ? "text-primary" : undefined} />
              {x.label}
              {on && !reduced && (
                <span
                  className="absolute bottom-0 left-0 h-px bg-primary shadow-glow-underline"
                  style={{ width: progress }}
                />
              )}
            </button>
          );
        })}
        <div className="mt-auto flex items-center gap-2 px-2.5 py-2 text-caption text-ink-subtle">
          <span className="size-1.5 rounded-full bg-success" />
          Open to work
        </div>
      </aside>
      <div className="flex min-w-0 flex-col">
        <div className="flex items-center gap-2.5 border-b border-hairline px-4 py-2.5 text-ink-muted">
          <span className="font-medium text-ink">{f.label}</span>
          <span className="text-ink-tertiary">/</span>
          <span className="truncate">{f.title}</span>
          <span className="ml-auto flex gap-1" aria-hidden="true">
            {FEATURES.map((x, i) => (
              <span
                key={x.id}
                onClick={() => jump(i)}
                className={cx(
                  "h-[3px] w-[18px] cursor-pointer overflow-hidden rounded-full",
                  i < idx ? "bg-ink-tertiary" : "bg-surface-4",
                )}
              >
                {i === idx && (
                  <span
                    className="block h-full bg-primary"
                    style={{ width: reduced ? "100%" : progress }}
                  />
                )}
              </span>
            ))}
          </span>
          <button
            type="button"
            onClick={() => setPaused((v) => !v)}
            aria-label={paused ? "Play product tour" : "Pause product tour"}
            className="flex size-8 cursor-pointer items-center justify-center rounded-sm border border-hairline bg-surface-1 text-ink-subtle hover:text-ink"
          >
            <Icon name={paused ? "play" : "pause"} size={12} />
          </button>
        </div>
        <div
          key={f.id}
          id={`${base}-panel`}
          role="tabpanel"
          aria-labelledby={`${base}-t${idx}`}
          aria-label={`${f.label}: ${f.title}`}
          className="ge-fade flex-1 p-4"
        >
          <View t={shownT} />
        </div>
      </div>
    </div>
  );
}
