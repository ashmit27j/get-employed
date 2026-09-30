import type { ReactNode } from "react";
import type { IconName } from "../icons";
import { cx } from "../lib/cx";
import { Icon } from "./Icon";

/** Neutral pill with an optional 6px status dot (hero count, "Verified"). */
export function StatusBadge({
  children,
  tone = "neutral",
  dot,
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "accent";
  dot?: boolean;
  className?: string;
}) {
  const showDot = dot ?? tone !== "neutral";
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full border border-hairline bg-surface-2 px-2 py-0.5 text-caption font-medium whitespace-nowrap text-ink-muted",
        className,
      )}
    >
      {showDot && (
        <span
          aria-hidden="true"
          className={cx(
            "size-1.5 rounded-full",
            tone === "success" ? "bg-success" : tone === "accent" ? "bg-primary" : "bg-ink-subtle",
          )}
        />
      )}
      {children}
    </span>
  );
}

export type Tone = "neutral" | "primary" | "success" | "warning" | "danger" | "teal" | "violet";

const toneClass: Record<Tone, string> = {
  neutral: "bg-surface-2 text-ink-subtle border-hairline-strong",
  primary: "bg-primary-soft text-primary-200 border-primary-line",
  success: "bg-success-soft text-success-ink border-success-line",
  warning: "bg-warning-soft text-warning-ink border-warning-line",
  danger: "bg-danger-soft text-danger-ink border-danger-line",
  teal: "bg-teal-soft text-teal-ink border-teal-line",
  violet: "bg-violet-soft text-violet-ink border-violet-line",
};

/** Tinted status/category badge. Tones are for status and tags only, never icons or CTAs. */
export function ToneBadge({
  tone = "neutral",
  dot = true,
  children,
}: {
  tone?: Tone;
  dot?: boolean;
  children: ReactNode;
}) {
  return (
    <span
      className={cx(
        "box-border inline-flex h-[22px] flex-none items-center gap-1.5 rounded-full border px-2 text-caption font-medium whitespace-nowrap",
        toneClass[tone],
      )}
    >
      {dot && <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

/** Small surface-3 chip with an optional dim label ("Stack · Go"). */
export function Tag({ children, label }: { children: ReactNode; label?: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-3 px-2 py-0.5 text-caption whitespace-nowrap text-ink-muted">
      {label && <span className="text-ink-subtle">{label}</span>}
      {children}
    </span>
  );
}

export function EmptyState({
  icon = "inbox",
  title,
  body,
  children,
}: {
  icon?: IconName;
  title: ReactNode;
  body?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-hairline-strong px-6 py-12 text-center">
      <span className="flex size-10 items-center justify-center rounded-md border border-hairline bg-surface-2 text-ink-subtle">
        <Icon name={icon} size={18} />
      </span>
      <div className="text-body font-medium text-ink">{title}</div>
      {body && <p className="m-0 max-w-[400px] text-small text-pretty text-ink-subtle">{body}</p>}
      {children}
    </div>
  );
}

/** Usage against a limit (emails this month, tailored resumes). Turns accent at 80%. */
export function QuotaBar({
  label,
  used,
  max,
  unit = "",
  compact,
  note,
}: {
  label: string;
  used: number;
  max: number;
  unit?: string;
  compact?: boolean;
  note?: ReactNode;
}) {
  const p = Math.min(1, used / Math.max(max, 1));
  const full = used >= max;
  const warn = p >= 0.8;
  return (
    <div className={cx("flex flex-col", compact ? "gap-1.5" : "gap-2")}>
      <div className={cx("flex justify-between gap-3", compact ? "text-caption" : "text-small")}>
        <span className="text-ink-muted">{label}</span>
        <span
          className={cx(
            "inline-flex items-center gap-1 font-mono",
            compact ? "text-micro tracking-normal" : "text-ui",
            warn ? "text-ink" : "text-ink-subtle",
          )}
        >
          {full && <Icon name="circle-alert" size={12} />}
          {used} / {max}
          {unit}
        </span>
      </div>
      <span
        role="progressbar"
        aria-label={label}
        aria-valuenow={used}
        aria-valuemin={0}
        aria-valuemax={max}
        className="block h-1 overflow-hidden rounded-full bg-surface-3"
      >
        <span
          className={cx("block h-full rounded-[inherit]", warn ? "bg-primary" : "bg-ink-subtle")}
          style={{ width: `${p * 100}%` }}
        />
      </span>
      {note && <span className="text-caption text-ink-subtle">{note}</span>}
    </div>
  );
}

/** Numbered steps (onboarding checklists, "what happens next"). */
export function StepList({
  steps,
}: {
  steps: { title: ReactNode; body?: ReactNode; meta?: ReactNode }[];
}) {
  return (
    <ol className="m-0 flex list-none flex-col gap-4 p-0">
      {steps.map((s, i) => (
        <li key={i} className="grid grid-cols-[22px_minmax(0,1fr)_auto] items-start gap-3">
          <span className="inline-flex size-[22px] items-center justify-center rounded-full border border-hairline-strong bg-surface-2 font-mono text-micro tracking-normal text-ink-muted">
            {i + 1}
          </span>
          <div className="flex flex-col gap-0.5">
            <span className="text-small font-medium text-ink">{s.title}</span>
            {s.body && <span className="text-caption text-pretty text-ink-subtle">{s.body}</span>}
          </div>
          {s.meta && (
            <span className="text-caption whitespace-nowrap text-ink-tertiary">{s.meta}</span>
          )}
        </li>
      ))}
    </ol>
  );
}
