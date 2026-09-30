"use client";
import { useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Button,
  Chip,
  Icon,
  IconButton,
  MatchRing,
  Modal,
  Panel,
  SalaryBadge,
  Segmented,
  StatusBadge,
  Toggle,
  cx,
  isIconName,
  type IconName,
} from "@ge/ui";
import {
  EMPTY_FILTERS,
  FILTER_OPTIONS,
  SALARY_RANGE,
  SEARCH_FREQUENCY_LABELS,
  countFilters,
  filtersToChips,
  matchesFilters,
  parseFilters,
  type JobCard,
  type JobFilters,
} from "@ge/core";
import { useDictation } from "@/lib/useDictation";
import { createSavedSearch, updateSavedSearch } from "@/server/actions/searches";
import type { SavedSearchItem } from "@/server/searches";
import { fmtLast } from "./JobsBoard";
import { salaryProps } from "./JobRow";

const EXAMPLES = [
  "Remote frontend roles for freshers, React",
  "Security internships in Mumbai",
  "iOS roles, SwiftUI, 15 LPA+",
];
const MAX_CHARS = 3000;

type ListKey = "roles" | "locations" | "modes" | "experience" | "skills";
type GroupKey = ListKey | "type" | "salary";
const GROUPS: [GroupKey, string, IconName, string | null][] = [
  ["roles", "Role", "briefcase", "Add role"],
  ["locations", "Location", "map-pin", "Add city"],
  ["type", "Type", "briefcase", null],
  ["modes", "Work mode", "globe", null],
  ["experience", "Experience", "graduation-cap", "Add range"],
  ["salary", "Salary range", "wallet", null],
  ["skills", "Skills", "code", "Add skill"],
];
const APPLY_ORDER: GroupKey[] = [
  "type",
  "roles",
  "locations",
  "modes",
  "experience",
  "salary",
  "skills",
];

function SalaryRange({ f, set }: { f: JobFilters; set: (min: number, max: number) => void }) {
  const span = SALARY_RANGE.max - SALARY_RANGE.min;
  const thumb =
    "pointer-events-none absolute inset-x-0 z-2 m-0 h-5 w-full appearance-none bg-transparent outline-none [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-surface-1 [&::-moz-range-thumb]:bg-primary [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-surface-1 [&::-webkit-slider-thumb]:bg-primary focus-visible:[&::-webkit-slider-thumb]:shadow-focus";
  return (
    <div className="flex w-full items-center gap-4">
      <div className="relative flex h-5 flex-1 items-center">
        <div className="absolute inset-x-0 h-1 rounded-[2px] bg-hairline-strong" />
        <div
          className="absolute h-1 rounded-[2px] bg-primary"
          style={{
            left: `calc(8px + (100% - 16px) * ${(f.salaryMin - SALARY_RANGE.min) / span})`,
            right: `calc(8px + (100% - 16px) * ${1 - (f.salaryMax - SALARY_RANGE.min) / span})`,
          }}
        />
        <input
          type="range"
          aria-label="Minimum salary (LPA)"
          min={SALARY_RANGE.min}
          max={SALARY_RANGE.max}
          value={f.salaryMin}
          onChange={(e) => set(Math.min(Number(e.target.value), f.salaryMax), f.salaryMax)}
          className={thumb}
        />
        <input
          type="range"
          aria-label="Maximum salary (LPA)"
          min={SALARY_RANGE.min}
          max={SALARY_RANGE.max}
          value={f.salaryMax}
          onChange={(e) => set(f.salaryMin, Math.max(Number(e.target.value), f.salaryMin))}
          className={cx(thumb, "z-3")}
        />
      </div>
      <span className="min-w-[88px] flex-none text-right font-mono text-caption text-ink-muted">
        {f.salaryMin}–{f.salaryMax} LPA
      </span>
    </div>
  );
}

function FilterRow({
  icon,
  label,
  status,
  applying,
  highlighted,
  onClear,
  children,
}: {
  icon: IconName;
  label: string;
  status: string;
  applying: boolean;
  highlighted: boolean;
  onClear?: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className={cx(
        "grid grid-cols-[minmax(0,190px)_minmax(0,1fr)_auto] items-start gap-x-6 gap-y-2 border-b border-hairline px-6 py-4 transition-[opacity,background-color] duration-(--duration-base) ease-standard max-md:grid-cols-1 max-md:px-4",
        applying && "pointer-events-none opacity-40",
        highlighted && "bg-glow-soft",
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="box-border inline-flex size-9 flex-none items-center justify-center rounded-md border border-hairline-strong bg-surface-1 text-ink-subtle">
          <Icon name={icon} size={18} />
        </span>
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="flex items-center gap-2 text-body font-medium text-ink">
            {label}
            {highlighted && (
              <span className="size-1.5 rounded-full bg-primary shadow-glow-underline" />
            )}
          </span>
          <span className="text-caption text-ink-subtle">{status}</span>
        </span>
      </div>
      <div className="flex min-h-9 min-w-0 flex-wrap items-center gap-2">{children}</div>
      <div className="flex min-h-9 items-center max-md:hidden">
        {onClear && <IconButton icon="x" title="Clear this filter" onClick={onClear} size={28} />}
      </div>
    </div>
  );
}

function YourSearch({ s, now }: { s: SavedSearchItem; now: Date }) {
  const [q, setQ] = useState(s.query);
  const [, start] = useTransition();
  const commit = () => {
    if (q.trim() && q.trim() !== s.query) start(() => updateSavedSearch(s.id, { query: q.trim() }));
  };
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-6 gap-y-4 border-b border-hairline p-6 last:border-b-0 max-md:p-4">
      <div className={cx("flex min-w-0 flex-col gap-3.5", !s.active && "opacity-50")}>
        <label className="relative block">
          <Icon
            name="sparkles"
            size={14}
            className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-subtle"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
            aria-label="Edit search"
            className="box-border h-11 w-full rounded-md border border-hairline-strong bg-surface-2 pr-3.5 pl-9 text-small text-ink outline-none focus:border-primary"
          />
        </label>
        <div className="flex flex-wrap gap-1.5">
          {s.chips.map((c) => (
            <Chip key={c.type + c.value} icon={isIconName(c.icon) ? c.icon : undefined}>
              {c.label}
            </Chip>
          ))}
        </div>
        <span className="flex items-center gap-1.5 text-caption text-ink-subtle">
          <Icon name="refresh-cw" size={12} />
          {SEARCH_FREQUENCY_LABELS[s.frequency]} ·{" "}
          {s.lastRunAt ? `checked ${fmtLast(s.lastRunAt, now)}` : "not checked yet"}
        </span>
        {s.active && s.newCount > 0 && (
          <div className="flex">
            <StatusBadge tone="accent">{s.newCount} new</StatusBadge>
          </div>
        )}
      </div>
      <div className="flex h-11 items-center">
        <IconButton
          icon="arrow-up-right"
          title="Open saved search"
          href={`/jobs/searches/${s.id}`}
        />
      </div>
    </div>
  );
}

export function DeepSearch({
  jobs,
  searches,
  now,
  onShowSaved,
}: {
  jobs: JobCard[];
  searches: SavedSearchItem[];
  now: Date;
  onShowSaved: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [f, setF] = useState<JobFilters>(EMPTY_FILTERS);
  const [applying, setApplying] = useState(false);
  const [highlight, setHighlight] = useState<GroupKey | null>(null);
  const [drafts, setDrafts] = useState<Partial<Record<ListKey, string>>>({});
  const [extra, setExtra] = useState<Partial<Record<ListKey, string[]>>>({});
  const [focused, setFocused] = useState(false);
  const [promptsOpen, setPromptsOpen] = useState(false);
  const [hintClosed, setHintClosed] = useState(false);
  const [freq, setFreq] = useState("Daily");
  const [autoDraft, setAutoDraft] = useState(true);
  const [saveOpen, setSaveOpen] = useState(false);
  const [saving, startSave] = useTransition();
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const dictation = useDictation((text) => setQuery(text.slice(0, MAX_CHARS)));

  useEffect(
    () => () => {
      if (timer.current) clearInterval(timer.current);
    },
    [],
  );

  /** Apply the parsed filters one group at a time, like the prototype, so the change is legible. */
  const apply = () => {
    if (!query.trim()) return;
    const target = parseFilters(query);
    if (timer.current) clearInterval(timer.current);
    setApplying(true);
    let i = 0;
    timer.current = setInterval(() => {
      const key = APPLY_ORDER[i]!;
      setF((prev) =>
        key === "salary"
          ? { ...prev, salaryMin: target.salaryMin, salaryMax: target.salaryMax }
          : { ...prev, [key]: target[key] },
      );
      setHighlight(key);
      i++;
      if (i >= APPLY_ORDER.length) {
        clearInterval(timer.current!);
        setApplying(false);
        setHighlight(null);
      }
    }, 420);
  };

  const matching = useMemo(() => jobs.filter((j) => !j.hidden && matchesFilters(j, f)), [jobs, f]);
  const toggle = (k: ListKey, v: string) =>
    setF((p) => ({ ...p, [k]: p[k].includes(v) ? p[k].filter((x) => x !== v) : [...p[k], v] }));
  const addCustom = (k: ListKey) => {
    const v = (drafts[k] ?? "").trim();
    if (!v) return;
    setExtra((e) => ({ ...e, [k]: [...new Set([...(e[k] ?? []), v])] }));
    setF((p) => ({ ...p, [k]: p[k].includes(v) ? p[k] : [...p[k], v] }));
    setDrafts((d) => ({ ...d, [k]: "" }));
  };

  const save = () =>
    startSave(async () => {
      const id = await createSavedSearch({
        query: query.trim(),
        chips: filtersToChips(f),
        frequency: freq.toLowerCase(),
        autoDraft,
      });
      setSaveOpen(false);
      router.push(`/jobs/searches/${id}`);
    });

  const listening = dictation.listening;
  const glowing = focused || listening;

  return (
    <>
      <div className="flex flex-col gap-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            apply();
          }}
          className={cx(
            "flex flex-col rounded-lg border bg-surface-1 transition-[border-color,box-shadow] duration-(--duration-base) ease-standard",
            glowing ? "border-primary-line shadow-glow-active" : "border-hairline-strong",
          )}
        >
          <div className="flex items-start gap-2 px-5 pt-[18px] pb-2.5">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value.slice(0, MAX_CHARS))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  apply();
                }
              }}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              rows={3}
              placeholder="e.g. Backend internships in Pune or Bengaluru, Go or Java, at least 40k a month"
              aria-label="Deep search"
              className="min-w-0 flex-1 resize-none border-none bg-transparent p-0 font-sans text-body leading-[1.55] text-ink outline-none placeholder:text-ink-tertiary"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1 border-t border-hairline px-3 py-2">
            <div className="relative">
              <button
                type="button"
                aria-expanded={promptsOpen}
                aria-haspopup="menu"
                onClick={() => setPromptsOpen(!promptsOpen)}
                className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-md px-2.5 text-small text-ink-muted hover:bg-surface-2 hover:text-ink"
              >
                <Icon name="file-search" size={15} />
                Browse prompts
              </button>
              {promptsOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setPromptsOpen(false)} />
                  <div
                    role="menu"
                    className="absolute bottom-[calc(100%+8px)] left-0 z-21 flex w-[300px] max-w-[calc(100vw-48px)] flex-col gap-0.5 rounded-lg border border-hairline-strong bg-surface-2 p-1.5"
                  >
                    {EXAMPLES.map((text) => (
                      <button
                        key={text}
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setPromptsOpen(false);
                          setQuery(text);
                        }}
                        className="flex cursor-pointer items-center gap-2.5 rounded-sm px-2.5 py-2 text-left text-small text-ink hover:bg-surface-3"
                      >
                        <Icon name="sparkles" size={14} className="text-primary" />
                        {text}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <span className="flex-1" />
            <span className="px-1.5 font-mono text-caption text-ink-tertiary">
              {query.length.toLocaleString("en-IN")} / 3,000
            </span>
            {dictation.supported && (
              <IconButton
                icon={listening ? "mic-off" : "mic"}
                title={listening ? "Stop dictation" : "Dictate your search"}
                active={listening}
                onClick={dictation.toggle}
              />
            )}
            <button
              type="submit"
              title="Search"
              aria-label="Search"
              className="box-border inline-flex size-8 flex-none cursor-pointer items-center justify-center rounded-md bg-primary text-on-primary shadow-glow-cta hover:bg-primary-hover"
            >
              <Icon name="send-horizontal" size={16} />
            </button>
          </div>
        </form>
        {listening && (
          <div className="flex items-center gap-2 text-caption text-ink-muted" role="status">
            <span className="size-2 animate-blink rounded-full bg-primary shadow-glow-underline" />
            Listening. Speak your search, then tap the mic again to stop.
          </div>
        )}
        {dictation.error && (
          <div role="alert" className="text-caption text-ink-muted">
            {dictation.error}
          </div>
        )}
        {!query.trim() && !hintClosed && (
          <div className="flex items-center gap-2.5 rounded-md border border-dashed border-hairline-strong bg-surface-1 px-3.5 py-2.5 text-caption leading-[1.4] text-ink-muted">
            <Icon name="lightbulb" size={14} className="text-primary" />
            <span className="min-w-0 flex-1">
              <strong className="font-medium text-ink">Tip:</strong> Press Enter to search. AI
              applies filters you can edit after.
            </span>
            <IconButton
              icon="x"
              title="Dismiss tip"
              onClick={() => setHintClosed(true)}
              size={24}
            />
          </div>
        )}
      </div>

      <Panel
        title="Filters"
        meta={`${matching.length} ${matching.length === 1 ? "job matches" : "jobs match"} right now`}
      >
        {GROUPS.map(([key, label, icon, addPh]) => {
          const common = { icon, label, applying, highlighted: highlight === key };
          if (key === "type") {
            const value = f.type === "internship" ? "Internship" : f.type === "job" ? "Job" : null;
            return (
              <FilterRow key={key} {...common} status={value ?? "Any"}>
                {(["Job", "Internship"] as const).map((t) => (
                  <span
                    key={t}
                    className={cx(
                      "flex transition-opacity",
                      value !== t && "opacity-55 hover:opacity-100",
                    )}
                  >
                    <Chip
                      icon={value === t ? "check" : undefined}
                      active={value === t}
                      onClick={() =>
                        setF((p) => ({
                          ...p,
                          type: value === t ? "any" : (t.toLowerCase() as "job" | "internship"),
                        }))
                      }
                    >
                      {t}
                    </Chip>
                  </span>
                ))}
              </FilterRow>
            );
          }
          if (key === "salary") {
            const any = f.salaryMin === SALARY_RANGE.min && f.salaryMax === SALARY_RANGE.max;
            return (
              <FilterRow
                key={key}
                {...common}
                status={any ? "Any" : `${f.salaryMin}–${f.salaryMax} LPA`}
                onClear={
                  any
                    ? undefined
                    : () =>
                        setF((p) => ({
                          ...p,
                          salaryMin: SALARY_RANGE.min,
                          salaryMax: SALARY_RANGE.max,
                        }))
                }
              >
                <SalaryRange
                  f={f}
                  set={(min, max) => setF((p) => ({ ...p, salaryMin: min, salaryMax: max }))}
                />
              </FilterRow>
            );
          }
          const sel = f[key];
          const base: readonly string[] = FILTER_OPTIONS[key];
          const all = [...new Set([...base, ...(extra[key] ?? []), ...sel])];
          return (
            <FilterRow
              key={key}
              {...common}
              status={sel.length ? `${sel.length} selected` : "Any"}
              onClear={sel.length ? () => setF((p) => ({ ...p, [key]: [] })) : undefined}
            >
              {all.map((text) => {
                const on = sel.includes(text);
                return (
                  <span
                    key={text}
                    className={cx("flex transition-opacity", !on && "opacity-55 hover:opacity-100")}
                  >
                    <Chip
                      icon={on ? "check" : undefined}
                      active={on}
                      onClick={() => toggle(key, text)}
                    >
                      {text}
                    </Chip>
                  </span>
                );
              })}
              {addPh && (
                <input
                  value={drafts[key] ?? ""}
                  onChange={(e) => setDrafts((d) => ({ ...d, [key]: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustom(key);
                    }
                  }}
                  placeholder={addPh}
                  aria-label={addPh}
                  title="Press Enter to add your own value"
                  className="box-border h-7 w-[110px] rounded-full border border-dashed border-hairline-strong bg-transparent px-2.5 text-caption text-ink outline-none focus:border-solid focus:border-primary"
                />
              )}
            </FilterRow>
          );
        })}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 max-md:px-4">
          <span className="text-caption text-ink-subtle">
            {countFilters(f) ? `${countFilters(f)} filters` : "No filters yet"}
          </span>
          <Button onClick={() => setSaveOpen(true)} disabled={!query.trim() || applying}>
            Save search
          </Button>
        </div>
      </Panel>

      <Panel title="Preview" sub="Top matches right now">
        {matching.slice(0, 5).map((j) => (
          <Link
            key={j.id}
            href={`/jobs/${j.id}`}
            className="grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-3 border-b border-hairline px-5 py-3 last:border-b-0 hover:bg-surface-2"
          >
            {j.score != null ? <MatchRing value={j.score} size={28} label={false} /> : <span />}
            <span className="flex min-w-0 flex-col">
              <span className="text-small text-ink">{j.title}</span>
              <span className="text-caption text-ink-subtle">
                {j.company} · {j.location} ·{" "}
                {j.mode === "on-site" ? "On-site" : j.mode === "hybrid" ? "Hybrid" : "Remote"}
              </span>
            </span>
            {j.salary && <SalaryBadge {...salaryProps(j.salary)} compact />}
          </Link>
        ))}
        {matching.length === 0 && (
          <div className="px-5 py-6 text-small text-ink-subtle">
            Nothing on the board matches yet. Save the search and we&apos;ll keep checking.
          </div>
        )}
      </Panel>

      {searches.length > 0 && (
        <div className="flex flex-col overflow-hidden rounded-lg border border-hairline bg-surface-1">
          <div className="flex items-center justify-between gap-4 border-b border-hairline px-6 py-5 max-md:px-4">
            <div className="flex min-w-0 flex-col gap-1">
              <h2 className="m-0 text-lead font-semibold">Your searches</h2>
              <span className="text-caption text-ink-subtle">
                Edit a search in place. Changes save when you leave the field.
              </span>
            </div>
            <button
              type="button"
              onClick={onShowSaved}
              className="cursor-pointer text-small whitespace-nowrap text-ink-subtle hover:text-ink"
            >
              View all →
            </button>
          </div>
          {searches.slice(0, 3).map((s) => (
            <YourSearch key={s.id} s={s} now={now} />
          ))}
        </div>
      )}

      <Modal
        open={saveOpen}
        onClose={() => setSaveOpen(false)}
        title="Save search"
        sub="We'll keep checking for new roles and tell you when they appear."
        footer={
          <>
            <Button variant="tertiary" onClick={() => setSaveOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              Save search
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-1.5">
          <span className="text-small font-medium text-ink-muted">Search</span>
          <span className="text-small text-ink">{query}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-small text-ink-subtle">Frequency</span>
          <Segmented
            label="Frequency"
            options={["Hourly", "Daily", "Weekly"]}
            value={freq}
            onChange={setFreq}
          />
        </div>
        <label className="flex items-center gap-2.5 text-small text-ink-muted">
          <Toggle on={autoDraft} onChange={setAutoDraft} label="Auto-draft outreach" />
          Draft outreach for matches above 85
        </label>
      </Modal>
    </>
  );
}
