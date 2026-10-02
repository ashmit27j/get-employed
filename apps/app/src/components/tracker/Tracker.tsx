"use client";
import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Button,
  CoLogo,
  EmptyState,
  Icon,
  IconButton,
  InlineSelect,
  Modal,
  Panel,
  Segmented,
  StatusBadge,
  TextArea,
  cx,
} from "@ge/ui";
import { STAGES, STAGE_LABELS, timeAgo, type Stage } from "@ge/core";
import { addAlert, completeAlert, moveApplication } from "@/server/actions/tracker";
import type { TrackerAlert, TrackerApp } from "@/server/tracker";

type View = "Active" | "All" | "Closed";
const PIPELINE: Stage[] = ["saved", "applied", "interview", "offer"];
/** Newest stage first, rejected last (as in the prototype). */
const GROUP_ORDER: Stage[] = ["offer", "interview", "applied", "saved", "rejected"];
const DOT: Record<Stage, string> = {
  offer: "bg-success",
  interview: "bg-primary",
  applied: "bg-ink-muted",
  saved: "bg-ink-tertiary",
  rejected: "bg-surface-4",
};
const STAGE_BY_LABEL = Object.fromEntries(STAGES.map((s) => [STAGE_LABELS[s], s])) as Record<
  string,
  Stage
>;

const DAY = 86_400_000;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/** "Today", "Tomorrow", "In 4 days", "2 days overdue" and the badge tone for an alert. */
function alertWhen(alert: Pick<TrackerAlert, "dueAt" | "createdAt">, now: Date) {
  if (!alert.dueAt) {
    const fresh = now.getTime() - new Date(alert.createdAt).getTime() < 3_600_000;
    return {
      when: fresh ? "Just added" : `Added ${timeAgo(alert.createdAt, now)} ago`,
      tone: "neutral" as const,
    };
  }
  const days = Math.round((startOfDay(new Date(alert.dueAt)) - startOfDay(now)) / DAY);
  const when =
    days < 0
      ? days === -1
        ? "Yesterday"
        : `${-days} days overdue`
      : days === 0
        ? "Today"
        : days === 1
          ? "Tomorrow"
          : `In ${days} days`;
  return {
    when,
    tone: days <= 1 ? ("accent" as const) : days <= 4 ? ("neutral" as const) : ("success" as const),
  };
}

function metaFor(a: TrackerApp, now: Date) {
  if (a.note) return a.note;
  const ago = timeAgo(a.stageChangedAt, now);
  return now.getTime() - new Date(a.stageChangedAt).getTime() < 3_600_000
    ? "Moved just now"
    : `Moved ${ago} ago`;
}

const COLS =
  "grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_88px_128px] items-center gap-4 max-lg:grid-cols-[minmax(0,1fr)_128px]";

function AppRow({
  app,
  now,
  onMove,
}: {
  app: TrackerApp;
  now: Date;
  onMove: (stage: Stage) => void;
}) {
  const idx = PIPELINE.indexOf(app.stage);
  const rejected = app.stage === "rejected";
  const meta = metaFor(app, now);
  const who = (
    <>
      <CoLogo name={app.company} size={32} />
      <span className="flex min-w-0 flex-col gap-px">
        <span className="truncate text-small font-medium text-ink">{app.title}</span>
        <span className="truncate text-caption text-ink-subtle">
          {app.company}
          <span className="lg:hidden"> · {meta}</span>
        </span>
      </span>
    </>
  );
  return (
    <div
      className={cx(COLS, "border-b border-hairline px-4 py-3 last:border-b-0 hover:bg-surface-2")}
    >
      {app.jobId ? (
        <Link href={`/jobs/${app.jobId}`} className="flex min-w-0 items-center gap-3 no-underline">
          {who}
        </Link>
      ) : (
        <div className="flex min-w-0 items-center gap-3">{who}</div>
      )}
      <span className="truncate text-small text-ink-muted max-lg:hidden" title={meta}>
        {meta}
      </span>
      <div
        className="flex gap-[3px] max-lg:hidden"
        title={`${rejected ? "Closed" : `Step ${idx + 1} of 4`} · ${PIPELINE.map((s) => STAGE_LABELS[s]).join(" → ")}`}
      >
        {PIPELINE.map((s, i) => (
          <span
            key={s}
            className={cx(
              "h-1 flex-1 rounded-full",
              rejected ? "bg-surface-4" : i <= idx ? DOT[app.stage] : "bg-surface-3",
            )}
          />
        ))}
        <span className="sr-only">{rejected ? "Closed" : `Step ${idx + 1} of 4`}</span>
      </div>
      <div className="flex justify-end">
        <InlineSelect
          label={`Stage for ${app.title}`}
          options={STAGES.map((s) => STAGE_LABELS[s])}
          value={STAGE_LABELS[app.stage]}
          onChange={(v) => onMove(STAGE_BY_LABEL[v]!)}
        />
      </div>
    </div>
  );
}

export function Tracker({
  apps: initial,
  alerts,
  nowIso,
}: {
  apps: TrackerApp[];
  alerts: TrackerAlert[];
  nowIso: string;
}) {
  const router = useRouter();
  const now = useMemo(() => new Date(nowIso), [nowIso]);
  const [apps, setApps] = useState(initial);
  const [view, setView] = useState<View>("Active");
  const [modal, setModal] = useState(false);
  const [draft, setDraft] = useState("");
  const [done, setDone] = useState<string[]>([]);
  const [, start] = useTransition();

  const list = apps.filter((a) =>
    view === "All" ? true : view === "Closed" ? a.stage === "rejected" : a.stage !== "rejected",
  );
  const groups = GROUP_ORDER.map((stage) => ({
    stage,
    rows: list.filter((a) => a.stage === stage),
  })).filter((g) => g.rows.length);
  const shown = alerts.filter((a) => !done.includes(a.id));

  const move = (id: string, stage: Stage) => {
    setApps((xs) =>
      xs.map((a) =>
        a.id === id ? { ...a, stage, note: null, stageChangedAt: new Date().toISOString() } : a,
      ),
    );
    start(() => moveApplication(id, stage));
  };
  const save = () => {
    const text = draft.trim();
    if (!text) return;
    setModal(false);
    start(async () => {
      await addAlert(text);
      router.refresh();
    });
  };
  const complete = (id: string) => {
    setDone((d) => [...d, id]);
    start(() => completeAlert(id));
  };

  const counts = [...PIPELINE, "rejected" as const].map((stage) => ({
    stage,
    n: apps.filter((a) => a.stage === stage).length,
  }));

  return (
    <div className="flex flex-col gap-6">
      <section aria-label="Pipeline" className="grid grid-cols-5 gap-3 max-md:grid-cols-3">
        {counts.map(({ stage, n }) => (
          <div
            key={stage}
            className="flex flex-col gap-1.5 rounded-lg border border-hairline bg-surface-1 px-4 py-3 shadow-edge"
          >
            <span className="flex items-center gap-2 text-caption text-ink-subtle">
              <span className={cx("size-2 flex-none rounded-full", DOT[stage])} />
              {stage === "rejected" ? "Closed" : STAGE_LABELS[stage]}
            </span>
            <span className="font-mono text-title text-ink">{n}</span>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-[minmax(0,1fr)_340px] items-start gap-6 max-[1180px]:grid-cols-1">
        <section aria-label="Applications" className="flex min-w-0 flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="m-0 text-body font-semibold">Applications</h2>
            <Segmented
              label="Show"
              options={["Active", "All", "Closed"]}
              value={view}
              onChange={(v) => setView(v as View)}
            />
          </div>
          <Panel>
            <div
              className={cx(
                COLS,
                "border-b border-hairline px-4 py-2 text-caption text-ink-tertiary max-lg:hidden",
              )}
            >
              <span>Role</span>
              <span>Latest</span>
              <span>Progress</span>
              <span className="text-right">Stage</span>
            </div>
            {groups.map((g) => (
              <div key={g.stage}>
                <div className="flex items-center gap-2 border-b border-hairline bg-surface-2 px-4 py-2">
                  <span className={cx("size-2 flex-none rounded-full", DOT[g.stage])} />
                  <span className="text-small font-medium">{STAGE_LABELS[g.stage]}</span>
                  <span className="font-mono text-caption text-ink-tertiary">{g.rows.length}</span>
                </div>
                {g.rows.map((a) => (
                  <AppRow key={a.id} app={a} now={now} onMove={(s) => move(a.id, s)} />
                ))}
              </div>
            ))}
            {list.length === 0 && (
              <div className="p-4">
                <EmptyState
                  icon="square-kanban"
                  title="Nothing here"
                  body="Save a job from the feed and it shows up in your tracker."
                />
              </div>
            )}
          </Panel>
        </section>

        <section
          aria-label="Alerts"
          className="sticky top-[72px] flex min-w-0 flex-col gap-3 max-[1180px]:static"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="m-0 text-body font-semibold">Alerts</h2>
            <Button
              size="sm"
              variant="secondary"
              iconLeft={<Icon name="plus" size={14} />}
              onClick={() => {
                setDraft("");
                setModal(true);
              }}
            >
              Add alert
            </Button>
          </div>
          <Panel>
            {shown.map((a) => {
              const due = a.dueAt ? new Date(a.dueAt) : null;
              const { when, tone } = alertWhen(a, now);
              const body = (
                <>
                  <span className="flex h-11 w-11 flex-none flex-col items-center justify-center rounded-md border border-hairline-strong bg-surface-2">
                    <span className="text-micro text-ink-subtle uppercase">
                      {due ? MONTHS[due.getMonth()] : "Note"}
                    </span>
                    <span className="font-mono text-small leading-none text-ink">
                      {due ? due.getDate() : "·"}
                    </span>
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="text-small font-medium text-ink">{a.action}</span>
                    <span className="truncate text-caption text-ink-subtle">
                      {a.title ? `${a.title} · ${a.company}` : "Custom"}
                    </span>
                    <StatusBadge tone={tone} className="self-start">
                      {when}
                    </StatusBadge>
                  </span>
                </>
              );
              const row = "flex min-w-0 flex-1 items-start gap-3 no-underline";
              return (
                <div
                  key={a.id}
                  className="flex items-start gap-1 border-b border-hairline py-3 pr-2 pl-4 last:border-b-0 hover:bg-surface-2"
                >
                  {a.jobId ? (
                    <Link href={`/jobs/${a.jobId}`} className={row}>
                      {body}
                    </Link>
                  ) : (
                    <div className={row}>{body}</div>
                  )}
                  <IconButton
                    icon="check"
                    title={`Mark “${a.action}” done`}
                    onClick={() => complete(a.id)}
                    size={32}
                  />
                </div>
              );
            })}
            {shown.length === 0 && (
              <p className="m-0 px-5 py-8 text-center text-small text-ink-subtle">
                No alerts. You&apos;re all caught up.
              </p>
            )}
          </Panel>
        </section>
      </div>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Add a custom alert"
        sub="Write a reminder to show up in your alerts list."
        width={420}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={!draft.trim()}>
              Add alert
            </Button>
          </>
        }
      >
        <TextArea
          aria-label="Alert"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="e.g. Follow up with recruiter at CRED"
          rows={3}
          autoFocus
        />
      </Modal>
    </div>
  );
}
