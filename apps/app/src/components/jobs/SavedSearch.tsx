"use client";
import { useEffect, useMemo, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Button,
  Chip,
  Icon,
  MatchRing,
  Panel,
  SalaryBadge,
  Segmented,
  StatusBadge,
  Toggle,
  cx,
  isIconName,
} from "@ge/ui";
import {
  filtersToChips,
  parseFilters,
  SEARCH_FREQUENCY_MS,
  timeAgo,
  type JobCard,
  type SearchFrequency,
  type SearchNotify,
  type SearchRunOn,
} from "@ge/core";
import { PageBody } from "@/components/shell/AppShell";
import { deleteSavedSearch, runSavedSearch, updateSavedSearch } from "@/server/actions/searches";
import type { SavedSearchItem } from "@/server/searches";
import { fmtLast } from "./JobsBoard";
import { salaryProps } from "./JobRow";

const MODE_LABEL = { "on-site": "On-site", hybrid: "Hybrid", remote: "Remote" } as const;
const FREQ_OPTIONS: { value: SearchFrequency; label: string }[] = [
  { value: "four-hourly", label: "4 hours" },
  { value: "eight-hourly", label: "8 hours" },
  { value: "daily", label: "Day" },
];
const NOTIFY: [SearchNotify, string][] = [
  ["each", "Each new match"],
  ["digest", "Daily digest"],
  ["off", "Off"],
];
const RUN_ON: [SearchRunOn, string, "cloud" | "laptop", string][] = [
  ["cloud", "Cloud", "cloud", "Runs when your device is off. Uses your monthly cloud checks."],
  [
    "local",
    "Local",
    "laptop",
    "Free and unlimited. Runs only while this device is on and the app is open.",
  ],
];

/** "38 min", "4 h 12 min", "3 days" until the next scheduled check. */
function untilLabel(ms: number) {
  const min = Math.max(1, Math.round(ms / 60_000));
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return min % 60 ? `${h} h ${min % 60} min` : `${h} h`;
  const d = Math.round(h / 24);
  return `${d} ${d === 1 ? "day" : "days"}`;
}

function Row({ label, children, top }: { label: string; children: ReactNode; top?: boolean }) {
  return (
    <div
      className={cx(
        "grid grid-cols-[minmax(0,140px)_minmax(0,1fr)] gap-4 border-b border-hairline px-5 py-4 last:border-b-0 max-md:grid-cols-1 max-md:gap-2 max-md:px-4",
        top ? "items-start" : "items-center",
      )}
    >
      <span className={cx("text-small text-ink-subtle", top && "pt-3 max-md:pt-0")}>{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function SavedSearchView({
  search,
  matches,
  nowIso,
}: {
  search: SavedSearchItem;
  matches: (JobCard & { isNew: boolean })[];
  nowIso: string;
}) {
  const router = useRouter();
  const [, start] = useTransition();
  const [s, setS] = useState(search);
  const [q, setQ] = useState(search.query);
  const [checking, setChecking] = useState(false);
  const [now, setNow] = useState(() => new Date(nowIso));
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const patch = (
    p: Partial<Pick<SavedSearchItem, "active" | "frequency" | "runOn" | "notify">>,
  ) => {
    setS((cur) => ({ ...cur, ...p }));
    start(() => updateSavedSearch(s.id, p));
  };
  const commitQuery = () => {
    const query = q.trim();
    if (!query || query === s.query) return setQ(s.query);
    // Re-parse the chips so they describe the edited sentence.
    const chips = filtersToChips(parseFilters(query));
    setS((cur) => ({ ...cur, query, chips }));
    start(async () => {
      await updateSavedSearch(s.id, { query, chips });
      await runSavedSearch(s.id);
      router.refresh();
    });
  };
  const checkNow = () => {
    if (checking) return;
    setChecking(true);
    start(async () => {
      await runSavedSearch(s.id);
      await new Promise((r) => setTimeout(r, 1800));
      setChecking(false);
      router.refresh();
    });
  };
  const remove = () =>
    start(async () => {
      await deleteSavedSearch(s.id);
      router.push(`/jobs?board=Saved&deleted=${s.id}&q=${encodeURIComponent(s.query)}`);
    });

  const nNew = s.active ? matches.filter((m) => m.isNew).length : 0;
  const next = useMemo(() => {
    const last = s.lastRunAt ? new Date(s.lastRunAt).getTime() : now.getTime();
    return untilLabel(Math.max(60_000, last + SEARCH_FREQUENCY_MS[s.frequency] - now.getTime()));
  }, [s.lastRunAt, s.frequency, now]);

  return (
    <PageBody>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex min-w-0 flex-col gap-1.5">
          <Link
            href="/jobs?board=Saved"
            className="inline-flex items-center gap-1.5 text-small text-ink-subtle no-underline hover:text-ink"
          >
            <Icon name="arrow-left" size={14} />
            Saved searches
          </Link>
          <h1 className="m-0 text-headline leading-[1.15] font-semibold tracking-[-0.8px]">
            Saved search
          </h1>
        </div>
        <Button variant="secondary" onClick={remove}>
          Delete search
        </Button>
      </div>

      <div className="flex flex-col gap-3.5 rounded-lg border border-hairline bg-surface-1 p-5 max-md:p-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative block min-w-0 flex-[1_1_320px]">
            <Icon
              name="sparkles"
              size={16}
              className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-primary"
            />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
              onBlur={commitQuery}
              aria-label="Edit search"
              className="box-border h-11 w-full rounded-md border border-hairline-strong bg-surface-2 pr-3.5 pl-10 text-body text-ink outline-none focus:border-primary"
            />
          </label>
          <span className="flex items-center gap-2 text-small text-ink-muted">
            <Toggle on={s.active} onChange={(active) => patch({ active })} label="Active" />
            {s.active ? "Active" : "Paused"}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {s.chips.map((c) => (
            <Chip key={c.type + c.value} icon={isIconName(c.icon) ? c.icon : undefined}>
              {c.label}
            </Chip>
          ))}
        </div>
      </div>

      <Panel title="Matches" meta={`${matches.length} jobs${nNew ? ` · ${nNew} new` : ""}`}>
        {matches.map((j) => (
          <Link
            key={j.id}
            href={`/jobs/${j.id}`}
            className="grid grid-cols-[36px_minmax(0,1fr)_auto_auto] items-center gap-3.5 border-b border-hairline px-5 py-3.5 no-underline transition-colors duration-(--duration-base) ease-standard last:border-b-0 hover:bg-surface-2 max-md:grid-cols-[36px_minmax(0,1fr)_auto] max-md:px-4"
          >
            {j.score != null ? (
              <MatchRing value={j.score} size={36} label={false} />
            ) : (
              <span className="size-9 rounded-full border border-dashed border-hairline-strong" />
            )}
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="flex items-center gap-2 text-body font-medium text-ink">
                {j.title}
                {s.active && j.isNew && <StatusBadge tone="accent">New</StatusBadge>}
              </span>
              <span className="text-caption text-ink-subtle">
                {j.company} · {j.location} · {MODE_LABEL[j.mode]} · {timeAgo(j.postedAt, now)} ago
              </span>
            </span>
            <span className="max-md:hidden">
              {j.salary && <SalaryBadge {...salaryProps(j.salary)} compact />}
            </span>
            <Icon name="chevron-right" size={16} className="text-ink-subtle" />
          </Link>
        ))}
        {matches.length === 0 && (
          <p className="m-0 px-5 py-8 text-center text-small text-ink-subtle">
            No matches yet. We&apos;ll list roles here as soon as a check finds them.
          </p>
        )}
      </Panel>

      <Panel title="Polling" sub="How this search checks for new postings.">
        <div className="flex flex-wrap items-center gap-3 border-b border-hairline bg-surface-2 px-5 py-3.5 max-md:px-4">
          <span className="flex min-w-0 flex-1 items-center gap-2.5 text-small text-ink">
            <span
              className={cx(
                "size-2 flex-none rounded-full",
                checking
                  ? "bg-primary motion-safe:animate-pulse"
                  : s.active
                    ? "bg-success motion-safe:animate-pulse"
                    : "bg-ink-tertiary",
              )}
            />
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="font-medium" aria-live="polite">
                {checking
                  ? "Checking career pages and listings…"
                  : s.active
                    ? `Watching · next check in ${next}`
                    : "Paused"}
              </span>
              <span className="text-caption text-ink-subtle">
                {s.active
                  ? `Last checked ${s.lastRunAt ? fmtLast(s.lastRunAt, now) : "never"} · ${s.runOn === "cloud" ? "in the cloud" : "on this device"}`
                  : "Turn the search back on to resume checks."}
              </span>
            </span>
          </span>
          <Button variant="secondary" size="sm" onClick={checkNow} disabled={checking}>
            {checking ? "Checking…" : "Check now"}
          </Button>
        </div>
        <Row label="Check every">
          <Segmented
            label="Check every"
            options={FREQ_OPTIONS}
            value={s.frequency}
            onChange={(v) => patch({ frequency: v as SearchFrequency })}
          />
        </Row>
        <Row label="Runs on" top>
          <div
            role="radiogroup"
            aria-label="Runs on"
            className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-2"
          >
            {RUN_ON.map(([value, name, icon, desc]) => {
              const on = s.runOn === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => patch({ runOn: value })}
                  className={cx(
                    "box-border flex cursor-pointer items-start gap-3 rounded-md border px-3.5 py-3 text-left transition-[background-color,border-color] duration-(--duration-base) ease-standard hover:border-hairline-tertiary focus-visible:shadow-focus focus-visible:outline-none",
                    on ? "border-primary! bg-glow-soft" : "border-hairline bg-surface-1",
                  )}
                >
                  <Icon name={icon} size={18} className="mt-px text-ink-subtle" />
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-small font-medium text-ink">{name}</span>
                    <span className="text-caption leading-[1.4] text-pretty text-ink-subtle">
                      {desc}
                    </span>
                  </span>
                  <span
                    className={cx(
                      "mt-0.5 box-border size-3.5 flex-none rounded-full",
                      on ? "border-4 border-primary" : "border-[1.5px] border-hairline-tertiary",
                    )}
                  />
                </button>
              );
            })}
          </div>
        </Row>
        <Row label="Notify me">
          <Segmented
            label="Notify me"
            options={NOTIFY.map((n) => n[1])}
            value={NOTIFY.find((n) => n[0] === s.notify)![1]}
            onChange={(v) => patch({ notify: NOTIFY.find((n) => n[1] === v)![0] })}
          />
        </Row>
      </Panel>
    </PageBody>
  );
}
