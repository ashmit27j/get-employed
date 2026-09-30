"use client";
import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import type { IconName } from "../icons";
import { cx, transition } from "../lib/cx";
import { Icon } from "./Icon";

export interface ChoiceOption {
  value: string;
  label?: ReactNode;
  icon?: IconName;
  /** Small mono count after the label ("Saved 3"). */
  count?: number | string;
  /** Animated accent fill when selected (the "Deep Search" mode). */
  emphasis?: boolean;
}

const toOption = (o: string | ChoiceOption): ChoiceOption =>
  typeof o === "string" ? { value: o } : o;

/** Arrow-key movement between tabs, as the ARIA tabs pattern expects. */
function useRovingTabs(count: number, onMove: (index: number) => void) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKeyDown = (e: KeyboardEvent, index: number) => {
    const delta =
      e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : e.key === "Home" ? -index : 0;
    const end = e.key === "End" ? count - 1 - index : 0;
    if (!delta && !end) return;
    e.preventDefault();
    const next = (index + delta + end + count) % count;
    refs.current[next]?.focus();
    onMove(next);
  };
  return { refs, onKeyDown };
}

/** Segmented control for views and filters inside the app (square-ish, 13px). */
export function Segmented({
  options,
  value,
  defaultValue,
  onChange,
  label,
  className,
}: {
  options: readonly (string | ChoiceOption)[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  label?: string;
  className?: string;
}) {
  const opts = options.map(toOption);
  const [inner, setInner] = useState(defaultValue ?? opts[0]?.value);
  const current = value ?? inner;
  const select = (v: string) => {
    setInner(v);
    onChange?.(v);
  };
  const { refs, onKeyDown } = useRovingTabs(opts.length, (i) => select(opts[i]!.value));
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cx(
        "box-border inline-flex w-max max-w-full gap-0.5 self-start overflow-x-auto rounded-md border border-hairline bg-canvas p-0.5",
        className,
      )}
    >
      {opts.map((o, i) => {
        const on = o.value === current;
        return (
          <button
            key={o.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            aria-selected={on}
            tabIndex={on ? 0 : -1}
            onClick={() => select(o.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cx(
              "inline-flex cursor-pointer items-center gap-1.5 rounded-sm px-2.5 py-1 text-ui whitespace-nowrap transition-colors",
              transition,
              on
                ? o.emphasis
                  ? "animate-seg-gradient bg-[linear-gradient(100deg,var(--color-primary)_0%,var(--color-primary-hover)_25%,var(--color-primary)_50%,var(--color-primary-hover)_75%,var(--color-primary)_100%)] bg-size-[250%_100%] text-on-primary"
                  : "bg-surface-3 text-ink"
                : "text-ink-subtle hover:text-ink",
            )}
          >
            {o.icon && <Icon name={o.icon} size={14} />}
            {o.label ?? o.value}
            {o.count != null && (
              <span className="font-mono text-micro tracking-normal text-ink-tertiary">
                {o.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Pill tabs from the marketing site (Monthly / Yearly). The selected pill carries the active glow. */
export function PillTabs({
  options,
  value,
  defaultValue,
  onChange,
  label,
  className,
}: {
  options: readonly (string | ChoiceOption)[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  label: string;
  className?: string;
}) {
  const opts = options.map(toOption);
  const [inner, setInner] = useState(defaultValue ?? opts[0]?.value);
  const current = value ?? inner;
  const select = (v: string) => {
    setInner(v);
    onChange?.(v);
  };
  const { refs, onKeyDown } = useRovingTabs(opts.length, (i) => select(opts[i]!.value));
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cx(
        "inline-flex gap-1 rounded-full border border-hairline bg-canvas p-1",
        className,
      )}
    >
      {opts.map((o, i) => {
        const on = o.value === current;
        return (
          <button
            key={o.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            aria-selected={on}
            tabIndex={on ? 0 : -1}
            onClick={() => select(o.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cx(
              "min-h-[30px] cursor-pointer rounded-full px-3.5 py-1.5 font-sans text-small leading-[1.2] font-medium transition-[background-color,color,box-shadow]",
              transition,
              on ? "bg-surface-2 text-ink shadow-glow-active" : "text-ink-subtle hover:text-ink",
            )}
          >
            {o.label ?? o.value}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Filter chip. Parsed search filters, presets and toggles.
 * Pass `onClick` for a toggle chip and `onRemove` for a removable one.
 */
export function Chip({
  icon,
  active,
  dashed,
  onClick,
  onRemove,
  removeLabel,
  children,
}: {
  icon?: IconName;
  active?: boolean;
  dashed?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  removeLabel?: string;
  children: ReactNode;
}) {
  const body = (
    <>
      {icon && (
        <Icon name={icon} size={13} className={active ? "text-primary" : "text-ink-subtle"} />
      )}
      {children}
    </>
  );
  const shell = cx(
    "box-border inline-flex h-7 items-center gap-1.5 rounded-full border text-ui whitespace-nowrap transition-colors",
    transition,
    dashed ? "border-dashed" : "border-solid",
    active
      ? "border-primary-line bg-glow-soft text-ink"
      : "border-hairline-strong bg-surface-2 text-ink-muted",
    onClick && !active && "hover:bg-surface-3",
    onRemove ? "pr-1 pl-2.5" : "px-2.5",
  );
  return (
    <span className={shell}>
      {onClick ? (
        <button
          type="button"
          aria-pressed={active}
          onClick={onClick}
          className="-my-1 inline-flex cursor-pointer items-center gap-1.5 rounded-full py-1"
        >
          {body}
        </button>
      ) : (
        body
      )}
      {onRemove && (
        <button
          type="button"
          aria-label={removeLabel ?? "Remove"}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="inline-flex cursor-pointer rounded-full p-1 text-ink-subtle hover:bg-surface-3 hover:text-ink"
        >
          <Icon name="x" size={12} />
        </button>
      )}
    </span>
  );
}
