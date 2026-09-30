import type { ReactNode } from "react";
import { cx } from "../lib/cx";
import { barToneClass, scoreTone, scoreToneVar } from "../lib/tone";
import { Icon } from "./Icon";

/** 0–100 match score as a ring. Green 80+, amber 60+, red below. Sizes ≥ 80 show "/ 100". */
export function MatchRing({
  value,
  size = 40,
  stroke,
  label = true,
  caption,
}: {
  value: number;
  size?: number;
  stroke?: number;
  /** Show the number inside the ring. */
  label?: boolean;
  caption?: ReactNode;
}) {
  const st = stroke ?? (size >= 80 ? 5 : size >= 48 ? 4 : 3);
  const r = (size - st) / 2;
  const c = 2 * Math.PI * r;
  const color = scoreToneVar[scoreTone(value)];
  return (
    <span className="inline-flex flex-none items-center gap-2.5">
      <span
        role="img"
        aria-label={`Match ${value} of 100`}
        className="relative inline-flex flex-none items-center justify-center"
        style={{ width: size, height: size }}
      >
        <svg width={size} height={size} className="absolute inset-0 -rotate-90" aria-hidden="true">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--color-surface-4)"
            strokeWidth={st}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={st}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - value / 100)}
            className="transition-[stroke-dashoffset] duration-600 ease-standard"
          />
        </svg>
        {label && (
          <span className="flex flex-col items-center leading-none" aria-hidden="true">
            <span
              className="font-mono font-medium"
              style={{ color, fontSize: Math.round(size * (size >= 80 ? 0.3 : 0.32)) }}
            >
              {value}
            </span>
            {size >= 80 && <span className="mt-1 text-caption text-ink-tertiary">/ 100</span>}
          </span>
        )}
      </span>
      {caption && <span className="max-w-[120px] text-caption text-ink-subtle">{caption}</span>}
    </span>
  );
}

/** Labelled bar (ATS score, rubric). `gain` shows a glow-tinted projection past the value. */
export function ScoreBar({
  label,
  value,
  max = 100,
  gain = 0,
  valueLabel,
  dim,
  note,
}: {
  label: ReactNode;
  value: number;
  max?: number;
  gain?: number;
  valueLabel?: ReactNode;
  dim?: boolean;
  note?: ReactNode;
}) {
  const pct = (v: number) => `${Math.min(100, (v / max) * 100)}%`;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between gap-3 text-small">
        <span className="text-ink-muted">{label}</span>
        <span className="inline-flex gap-1.5 font-mono text-ui text-ink">
          {valueLabel ?? value}
          {gain > 0 && <span className="text-primary">+{gain}</span>}
        </span>
      </div>
      <span className="relative block h-1 overflow-hidden rounded-full bg-surface-3">
        {gain > 0 && (
          <span
            className="absolute inset-y-0 left-0 rounded-[inherit] bg-glow"
            style={{ width: pct(value + gain) }}
          />
        )}
        <span
          className={cx(
            "absolute inset-y-0 left-0 rounded-[inherit] transition-[width] duration-600 ease-standard",
            dim ? "bg-ink-subtle" : barToneClass((value / max) * 100),
          )}
          style={{ width: pct(value) }}
        />
      </span>
      {note && <span className="text-caption text-ink-subtle">{note}</span>}
    </div>
  );
}

/** Three rising bars + percentage (contact-email confidence, salary estimate confidence). */
export function ConfidenceMeter({ value, label }: { value: number; label?: ReactNode }) {
  const lit = value >= 85 ? 3 : value >= 60 ? 2 : 1;
  const color = scoreToneVar[scoreTone(value)];
  return (
    <span
      title={`${value}% confidence`}
      className="inline-flex items-center gap-1.5 text-caption whitespace-nowrap text-ink-subtle"
    >
      <span aria-hidden="true" className="inline-flex items-end gap-0.5">
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            className="w-1 rounded-[1px]"
            style={{ height: 4 + i * 3, background: i <= lit ? color : "var(--color-surface-4)" }}
          />
        ))}
      </span>
      <span className="font-mono" style={{ color }}>
        {value}%
      </span>
      {label && <span>{label}</span>}
    </span>
  );
}

export type SalaryBadgeProps = {
  min: number;
  max: number;
  currency?: string;
  unit?: string;
  /** Hide the Stated/Est tag. */
  compact?: boolean;
  /** Replace the tag with a small "stated"/"est." word. */
  quiet?: boolean;
} & ({ type?: "stated" } | { type: "est"; confidence: number; samples: number });

/** Salary range in ₹ LPA. Estimates get "~", a dashed underline and a confidence meter. */
export function SalaryBadge(props: SalaryBadgeProps) {
  const { min, max, currency = "₹", unit = "LPA", compact, quiet } = props;
  const est = props.type === "est";
  const text = `${currency}${min}–${max} ${unit}`;
  return (
    <span
      title={
        est
          ? `Estimated from ${props.samples} data points · ${props.confidence}% confidence`
          : "Stated in the job post"
      }
      className={cx(
        "inline-flex items-baseline text-small whitespace-nowrap",
        quiet ? "gap-[5px]" : "gap-2",
      )}
    >
      <span
        className={cx(
          "font-mono text-ui",
          est ? "border-b border-dashed border-hairline-tertiary text-ink-muted" : "text-ink",
        )}
      >
        {est ? "~" : ""}
        {text}
      </span>
      {quiet && !compact ? (
        <span className="text-micro tracking-normal text-ink-subtle">
          {est ? "est." : "stated"}
        </span>
      ) : (
        !compact && (
          <span
            className={cx(
              "inline-flex items-center gap-1.5 rounded-xs border px-1.5 py-px text-micro font-medium tracking-[0.4px] uppercase",
              est
                ? "border-dashed border-hairline-strong text-ink-subtle"
                : "border-solid border-hairline-strong text-ink-muted",
            )}
          >
            {est ? (
              <>
                Est
                <ConfidenceMeter value={props.confidence} />
              </>
            ) : (
              "Stated"
            )}
          </span>
        )
      )}
    </span>
  );
}

/** Stat tile (interview history, usage). `trend` shows ↗/↘ with the delta; `bar` a 0–100 fill. */
export function MetricReadout({
  label,
  value,
  unit,
  hint,
  trend,
  bar,
}: {
  label: ReactNode;
  value: ReactNode;
  unit?: ReactNode;
  hint?: ReactNode;
  trend?: number;
  bar?: number;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-lg border border-hairline bg-surface-1 p-4 shadow-edge">
      <span className="text-caption text-ink-subtle">{label}</span>
      <div className="flex items-baseline gap-1.5">
        <span className="font-mono text-title text-ink">{value}</span>
        {unit && <span className="text-caption text-ink-subtle">{unit}</span>}
        {trend != null && (
          <span
            className={cx(
              "ml-auto inline-flex items-center gap-0.5 font-mono text-caption",
              trend > 0 ? "text-primary" : "text-ink-subtle",
            )}
          >
            <Icon
              name={trend > 0 ? "arrow-up-right" : trend < 0 ? "arrow-down-right" : "minus"}
              size={12}
            />
            {trend > 0 ? "+" : ""}
            {trend}
          </span>
        )}
      </div>
      {bar != null && (
        <span className="block h-1 overflow-hidden rounded-full bg-surface-3">
          <span
            className={cx("block h-full rounded-[inherit]", barToneClass(bar))}
            style={{ width: `${bar}%` }}
          />
        </span>
      )}
      {hint && <span className="text-caption text-pretty text-ink-subtle">{hint}</span>}
    </div>
  );
}
