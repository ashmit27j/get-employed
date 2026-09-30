"use client";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Button,
  Chip,
  Icon,
  IconButton,
  Segmented,
  Select,
  SortSelect,
  StatusBadge,
  cx,
  isIconName,
} from "@ge/ui";
import { SEARCH_FREQUENCY_LABELS, type JobCard } from "@ge/core";
import { setJobHidden, toggleSaveJob, unhideAllJobs } from "@/server/actions/jobs";
import { restoreSavedSearch } from "@/server/actions/searches";
import type { SavedSearchItem } from "@/server/searches";
import { DeepSearch } from "./DeepSearch";
import { JobRow } from "./JobRow";

type Board = "Discover" | "Deep Search" | "Saved";

const BOARD_COPY: Record<Board, [string, string]> = {
  Discover: [
    "Find your next role",
    "Browse new openings from company career pages, or describe what you want and let AI search for it.",
  ],
  "Deep Search": [
    "Deep Search",
    "Describe the role you want in plain language. AI searches beyond the job board, across company career pages and listings, and brings back matches.",
  ],
  Saved: [
    "Saved searches",
    "Each search keeps checking for new roles. Open one to see its matches and polling settings.",
  ],
};

const ROLE_FILTERS: Record<string, RegExp> = {
  Backend: /backend|api|platform/i,
  Frontend: /frontend/i,
  Mobile: /ios|android|mobile/i,
  Data: /data/i,
  Security: /security/i,
  Graduate: /graduate|trainee|intern/i,
};
const MODE_LABEL = { "on-site": "On-site", hybrid: "Hybrid", remote: "Remote" } as const;

/** Seconds until the next hourly refresh of saved searches ("Next wave"). */
function useNextWave(): number {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setLeft(3600 - (d.getMinutes() * 60 + d.getSeconds()));
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);
  return left ?? 3600;
}

function NextWave() {
  const left = useNextWave();
  const clock = `${String(Math.floor(left / 60)).padStart(2, "0")}:${String(left % 60).padStart(2, "0")}`;
  return (
    <div className="flex flex-none items-center gap-3.5 rounded-lg border border-hairline bg-surface-1 py-3 pr-[18px] pl-3 max-md:hidden">
      <span className="relative flex size-14 flex-none items-center justify-center">
        <svg
          width="56"
          height="56"
          viewBox="0 0 56 56"
          className="absolute inset-0 -rotate-90"
          aria-hidden="true"
        >
          <circle
            cx="28"
            cy="28"
            r="25"
            fill="none"
            stroke="var(--color-surface-3)"
            strokeWidth="3"
          />
          <circle
            cx="28"
            cy="28"
            r="25"
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="157.08"
            strokeDashoffset={(157.08 * (1 - left / 3600)).toFixed(2)}
            className="transition-[stroke-dashoffset] duration-1000 ease-linear"
          />
        </svg>
        <span className="font-mono text-caption text-ink" aria-label={`Next refresh in ${clock}`}>
          {clock}
        </span>
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="text-small font-medium">Next wave</span>
        <span className="text-caption text-ink-subtle">New roles every hour</span>
      </span>
    </div>
  );
}

function Discover({ jobs: initial, now }: { jobs: JobCard[]; now: Date }) {
  const [jobs, setJobs] = useState(initial);
  const [open, setOpen] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [role, setRole] = useState("All roles");
  const [level, setLevel] = useState("All seniority levels");
  const [co, setCo] = useState("All companies");
  const [loc, setLoc] = useState("All locations");
  const [mode, setMode] = useState("All workplaces");
  const [sort, setSort] = useState("Best match");
  const [, start] = useTransition();

  const visible = useMemo(() => {
    let list = jobs.filter((j) => !j.hidden);
    const query = q.trim().toLowerCase();
    if (query)
      list = list.filter((j) =>
        `${j.title} ${j.company} ${j.location}`.toLowerCase().includes(query),
      );
    if (role !== "All roles") list = list.filter((j) => ROLE_FILTERS[role]!.test(j.title));
    if (level !== "All seniority levels") list = list.filter((j) => j.experience === level);
    if (co !== "All companies") list = list.filter((j) => j.company === co);
    if (loc !== "All locations") list = list.filter((j) => j.location === loc);
    if (mode !== "All workplaces") list = list.filter((j) => MODE_LABEL[j.mode] === mode);
    if (sort === "Salary")
      list = [...list].sort((a, b) => (b.salary?.max ?? 0) - (a.salary?.max ?? 0));
    if (sort === "Newest") list = [...list].sort((a, b) => b.postedAt.localeCompare(a.postedAt));
    return list;
  }, [jobs, q, role, level, co, loc, mode, sort]);
  const hidden = jobs.filter((j) => j.hidden);
  const uniq = (f: (j: JobCard) => string) => [...new Set(jobs.map(f))].sort();

  const patch = (id: string, p: Partial<JobCard>) =>
    setJobs((js) => js.map((j) => (j.id === id ? { ...j, ...p } : j)));
  const save = (j: JobCard) => {
    patch(j.id, { saved: !j.saved });
    start(async () => {
      const r = await toggleSaveJob(j.id);
      patch(j.id, { saved: r.saved });
    });
  };
  const hide = (j: JobCard, value: boolean) => {
    patch(j.id, { hidden: value });
    start(() => setJobHidden(j.id, value));
  };
  const unhideAll = () => {
    setJobs((js) => js.map((j) => ({ ...j, hidden: false })));
    start(() => unhideAllJobs());
  };
  const dropdowns: [string, string, string[], (v: string) => void][] = [
    ["All roles", role, Object.keys(ROLE_FILTERS), setRole],
    ["All seniority levels", level, uniq((j) => j.experience), setLevel],
    ["All companies", co, uniq((j) => j.company), setCo],
    ["All locations", loc, uniq((j) => j.location), setLoc],
    ["All workplaces", mode, ["Remote", "Hybrid", "On-site"], setMode],
  ];

  return (
    <>
      <div className="flex flex-col gap-4 rounded-lg border border-hairline bg-surface-1 p-4 shadow-edge">
        <label className="relative block">
          <Icon
            name="search"
            size={16}
            className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-subtle"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search role, company or location"
            aria-label="Search jobs"
            className="box-border h-11 w-full rounded-md border border-hairline-strong bg-surface-2 pr-3.5 pl-10 text-body text-ink outline-none placeholder:text-ink-tertiary focus:border-primary"
          />
        </label>
        <div className="flex flex-wrap items-end gap-2">
          {dropdowns.map(([all, value, options, set]) => (
            <div key={all} className="max-w-[220px] min-w-0 flex-[1_1_150px]">
              <Select
                aria-label={all.replace("All ", "Filter by ")}
                options={[all, ...options]}
                value={value}
                placeholder={all}
                onChange={(e) => set(e.target.value)}
              />
            </div>
          ))}
          <span className="flex-1" />
          <span
            className="self-center text-caption whitespace-nowrap text-ink-subtle"
            aria-live="polite"
          >
            {visible.length} {visible.length === 1 ? "role" : "roles"}
          </span>
        </div>
      </div>
      <div className="flex items-center justify-end gap-3">
        {hidden.length > 0 && (
          <Button variant="tertiary" size="sm" onClick={unhideAll}>
            Unhide all
          </Button>
        )}
        <SortSelect value={sort} options={["Best match", "Newest", "Salary"]} onChange={setSort} />
      </div>
      <div className="flex flex-col gap-3">
        {visible.map((j) => (
          <JobRow
            key={j.id}
            job={j}
            now={now}
            open={open === j.id}
            onToggle={() => setOpen(open === j.id ? null : j.id)}
            onSave={() => save(j)}
            onHide={() => hide(j, true)}
          />
        ))}
        {visible.length === 0 && (
          <div className="rounded-lg border border-dashed border-hairline-strong px-6 py-12 text-center text-small text-ink-subtle">
            No roles match these filters. Clear a filter or try Deep Search.
          </div>
        )}
        {hidden.length > 0 && (
          <div className="flex flex-col overflow-hidden rounded-lg border border-hairline bg-surface-1">
            <div className="flex items-center justify-between gap-3 border-b border-hairline px-4 py-3 text-small text-ink-subtle">
              <span className="flex items-center gap-2">
                <Icon name="eye-off" size={14} />
                {hidden.length} hidden. We&apos;ll rank similar roles lower.
              </span>
              <Button variant="tertiary" size="sm" onClick={unhideAll}>
                Unhide all
              </Button>
            </div>
            {hidden.map((j) => (
              <div
                key={j.id}
                className="flex items-center justify-between gap-3 border-b border-hairline px-4 py-2.5 last:border-b-0"
              >
                <span className="flex min-w-0 flex-wrap items-baseline gap-2">
                  <span className="text-small text-ink">{j.title}</span>
                  <span className="text-caption text-ink-subtle">{j.company}</span>
                </span>
                <Button variant="secondary" size="sm" onClick={() => hide(j, false)}>
                  Unhide
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export function SavedSearchRow({ s, now }: { s: SavedSearchItem; now: Date }) {
  const router = useRouter();
  const href = `/jobs/searches/${s.id}`;
  const last = s.lastRunAt ? `checked ${fmtLast(s.lastRunAt, now)}` : "not checked yet";
  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => router.push(href)}
      onKeyDown={(e) => e.target === e.currentTarget && e.key === "Enter" && router.push(href)}
      className="grid cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 gap-y-4 border-b border-hairline px-6 py-5 transition-colors duration-(--duration-base) ease-standard last:border-b-0 hover:bg-surface-2 max-md:px-4"
    >
      <div className={cx("flex min-w-0 flex-col gap-3", !s.active && "opacity-50")}>
        <span className="text-body leading-[1.45] font-medium text-pretty text-ink">{s.query}</span>
        <div className="flex flex-wrap gap-1.5">
          {s.chips.map((c) => (
            <Chip key={c.type + c.value} icon={isIconName(c.icon) ? c.icon : undefined}>
              {c.label}
            </Chip>
          ))}
        </div>
        <span className="flex flex-wrap items-center gap-2 text-caption text-ink-subtle">
          <span className="flex items-center gap-1.5">
            <span
              className={cx("size-1.5 rounded-full", s.active ? "bg-success" : "bg-ink-tertiary")}
            />
            {s.active ? "Active" : "Paused"}
          </span>
          <span>·</span>
          <span className="flex items-center gap-1.5">
            <Icon name="refresh-cw" size={12} />
            {SEARCH_FREQUENCY_LABELS[s.frequency]} · {last}
          </span>
          {s.active && s.newCount > 0 && <StatusBadge tone="accent">{s.newCount} new</StatusBadge>}
        </span>
      </div>
      <div onClick={(e) => e.stopPropagation()}>
        <IconButton icon="arrow-up-right" title="Open saved search" href={href} />
      </div>
    </div>
  );
}

export function fmtLast(iso: string, now: Date) {
  const d = new Date(iso);
  const hm = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
  const mins = Math.round((now.getTime() - d.getTime()) / 60000);
  if (mins < 60) return `${Math.max(1, mins)} min ago`;
  if (d.toDateString() === now.toDateString()) return `Today, ${hm}`;
  return `${d.toLocaleDateString("en-IN", { weekday: "short" })}, ${hm}`;
}

function Saved({
  searches,
  now,
  onDeep,
}: {
  searches: SavedSearchItem[];
  now: Date;
  onDeep: () => void;
}) {
  const params = useSearchParams();
  const deleted = params.get("deleted");
  const [undone, setUndone] = useState(false);
  const [, start] = useTransition();
  const router = useRouter();
  return (
    <>
      {deleted && !undone && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-md border border-hairline-strong bg-surface-2 px-4 py-2.5 text-small text-ink-muted"
        >
          <span>Deleted “{params.get("q") ?? "search"}”</span>
          <Button
            variant="tertiary"
            size="sm"
            onClick={() =>
              start(async () => {
                await restoreSavedSearch(deleted);
                setUndone(true);
                router.replace("/jobs?board=Saved");
              })
            }
          >
            Undo
          </Button>
        </div>
      )}
      {searches.length ? (
        <div className="flex flex-col overflow-hidden rounded-lg border border-hairline bg-surface-1">
          {searches.map((s) => (
            <SavedSearchRow key={s.id} s={s} now={now} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-hairline-strong px-6 py-12 text-center">
          <span className="text-body text-ink">No saved searches</span>
          <span className="text-small text-ink-subtle">
            Describe a role in Deep Search and it will keep checking for you.
          </span>
          <Button variant="secondary" onClick={onDeep}>
            Open Deep Search
          </Button>
        </div>
      )}
    </>
  );
}

export function JobsBoard({
  jobs,
  searches,
  nowIso,
}: {
  jobs: JobCard[];
  searches: SavedSearchItem[];
  nowIso: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const now = useMemo(() => new Date(nowIso), [nowIso]);
  const fromUrl = params.get("board");
  const board: Board = fromUrl === "Saved" || fromUrl === "Deep Search" ? fromUrl : "Discover";
  const setBoard = (b: string) => {
    const next = new URLSearchParams(params);
    if (b === "Discover") next.delete("board");
    else next.set("board", b);
    next.delete("deleted");
    next.delete("q");
    router.replace(`/jobs${next.size ? `?${next}` : ""}`, { scroll: false });
  };
  const [title, sub] = BOARD_COPY[board];

  return (
    <>
      <div className="flex items-start justify-between gap-6">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <h1 className="m-0 text-headline leading-[1.15] font-semibold tracking-[-0.8px]">
            {title}
          </h1>
          <p className="m-0 text-body text-pretty text-ink-subtle">{sub}</p>
        </div>
        {board === "Discover" && <NextWave />}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented
          label="Job board"
          value={board}
          onChange={setBoard}
          options={[
            { value: "Discover", icon: "compass" },
            { value: "Deep Search", icon: "sparkles", emphasis: true },
            { value: "Saved", icon: "bookmark", count: searches.length },
          ]}
        />
        {board === "Saved" && (
          <Link
            href="/jobs?board=Deep+Search"
            className="text-small text-ink-subtle hover:text-ink"
          >
            New search →
          </Link>
        )}
      </div>
      {board === "Discover" && <Discover jobs={jobs} now={now} />}
      {board === "Deep Search" && (
        <DeepSearch
          jobs={jobs}
          searches={searches}
          now={now}
          onShowSaved={() => setBoard("Saved")}
        />
      )}
      {board === "Saved" && (
        <Saved searches={searches} now={now} onDeep={() => setBoard("Deep Search")} />
      )}
    </>
  );
}
