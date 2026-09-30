"use client";
import type { KeyboardEvent } from "react";
import { Button, Icon, IconButton, MatchRing, SalaryBadge, cx } from "@ge/ui";
import { timeAgo, type JobCard } from "@ge/core";

const MODE_LABEL = { "on-site": "On-site", hybrid: "Hybrid", remote: "Remote" } as const;

export function salaryProps(s: NonNullable<JobCard["salary"]>) {
  return s.type === "stated"
    ? ({ type: "stated", min: s.min, max: s.max } as const)
    : ({
        type: "est",
        min: s.min,
        max: s.max,
        confidence: s.confidence,
        samples: s.samples,
      } as const);
}

export function contactLine(c: JobCard["contact"]) {
  if (c.status === "found")
    return { icon: "user-check" as const, label: `${c.name} · ${c.role}`, found: true };
  if (c.status === "searching")
    return { icon: "loader" as const, label: "Searching for a contact…", found: false };
  return { icon: "user-search" as const, label: "No contact found yet", found: false };
}

/** One job in the feed. Click or Enter/Space expands skills, the match reason and actions. */
export function JobRow({
  job,
  open,
  now,
  onToggle,
  onSave,
  onHide,
}: {
  job: JobCard;
  open: boolean;
  now: Date;
  onToggle: () => void;
  onSave: () => void;
  onHide: () => void;
}) {
  const matched = job.skills.filter((s) => !job.missing.includes(s));
  const contact = contactLine(job.contact);
  const onKey = (e: KeyboardEvent) => {
    if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onToggle();
    }
  };
  return (
    <div
      role="button"
      tabIndex={0}
      aria-expanded={open}
      onClick={onToggle}
      onKeyDown={onKey}
      className={cx(
        "flex cursor-pointer flex-col gap-3.5 rounded-lg border p-5 transition-[background-color,border-color] duration-(--duration-base) ease-standard hover:border-hairline-strong hover:bg-surface-2",
        open ? "border-hairline-strong bg-surface-2" : "border-hairline bg-surface-1",
      )}
    >
      <div className="grid grid-cols-[44px_minmax(0,1fr)_auto_auto] items-center gap-x-4 max-md:grid-cols-[44px_minmax(0,1fr)_auto]">
        {job.score != null ? (
          <MatchRing value={job.score} size={44} />
        ) : (
          <span
            className="grid size-11 place-items-center rounded-full border border-dashed border-hairline-strong font-mono text-caption text-ink-tertiary"
            title="Not scored yet"
          >
            –
          </span>
        )}
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-lead font-medium text-ink">{job.title}</span>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-small text-ink-subtle">
            <span className="text-ink-muted">{job.company}</span>
            <span>·</span>
            <span>{job.location}</span>
            <span>·</span>
            <span>{MODE_LABEL[job.mode]}</span>
            <span>·</span>
            <span>{job.experience}</span>
          </div>
        </div>
        <span className="max-md:hidden">
          {job.salary && <SalaryBadge {...salaryProps(job.salary)} quiet />}
        </span>
        <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
          <IconButton icon="eye-off" title="Hide this job" onClick={onHide} size={40} />
          <IconButton
            icon={job.saved ? "bookmark-check" : "bookmark"}
            title={job.saved ? "Saved to tracker" : "Save to tracker"}
            active={job.saved}
            onClick={onSave}
            size={40}
          />
        </div>
      </div>
      {open && (
        <div className="ml-[60px] flex flex-col gap-4 max-md:ml-0">
          {job.salary && (
            <span className="md:hidden">
              <SalaryBadge {...salaryProps(job.salary)} quiet />
            </span>
          )}
          <div className="flex flex-col gap-2">
            <span className="text-caption font-semibold tracking-[0.4px] text-ink-subtle uppercase">
              Skills
            </span>
            <div className="flex flex-wrap gap-1.5">
              {matched.map((s) => (
                <span
                  key={s}
                  className="flex items-center gap-1.5 rounded-full border border-hairline-strong bg-surface-1 px-2.5 py-1 text-caption text-primary"
                >
                  <Icon name="circle-check" size={12} />
                  {s}
                </span>
              ))}
              {job.missing.map((s) => (
                <span
                  key={s}
                  className="flex items-center gap-1.5 rounded-full border border-dashed border-hairline-strong bg-surface-1 px-2.5 py-1 text-caption text-ink-subtle"
                  title="Missing from your profile"
                >
                  <Icon name="circle-dashed" size={12} />
                  {s}
                </span>
              ))}
            </div>
          </div>
          {job.reason && (
            <div className="flex items-start gap-2.5 rounded-md border border-hairline bg-glow-soft px-3.5 py-3 text-small text-pretty text-ink-muted">
              <Icon name="sparkles" size={14} className="mt-[3px] text-primary" />
              <span>{job.reason}</span>
            </div>
          )}
          <div
            className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-3.5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1.5 text-caption text-ink-subtle">
              <Icon name="clock" size={14} />
              <span>
                {timeAgo(job.postedAt, now)} ago via {job.sourceLabel}
              </span>
              <span>·</span>
              <Icon
                name={contact.icon}
                size={14}
                className={contact.found ? "text-primary" : undefined}
              />
              <span>{contact.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" href={`/documents?view=tailor&job=${job.id}`}>
                Tailor resume
              </Button>
              <Button href={`/jobs/${job.id}`}>View job</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
