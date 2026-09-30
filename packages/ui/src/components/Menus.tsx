"use client";
import {
  Fragment,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { cx, transition } from "../lib/cx";
import { Button } from "./Button";
import { Chip } from "./Choices";
import { Field, Toggle, fieldClass } from "./Forms";
import { Icon } from "./Icon";

/** Open state for a popover: closes on outside click and Escape (returning focus to the trigger). */
export function usePopover() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return { open, setOpen, ref, triggerRef };
}

const listboxClass =
  "absolute z-20 box-border max-h-[280px] overflow-y-auto rounded-md border border-hairline-strong bg-surface-2 p-1";
const optionClass = (active: boolean) =>
  cx(
    "flex cursor-pointer items-center gap-2 rounded-sm px-2.5 py-2 text-small text-ink",
    active ? "bg-surface-3" : "hover:bg-surface-3",
  );

/** Keyboard handling shared by listbox triggers: arrows move, Enter picks, Escape closes. */
function listKeys(
  e: KeyboardEvent,
  count: number,
  state: { open: boolean; setOpen: (o: boolean) => void; hi: number; setHi: (i: number) => void },
  pick: (index: number) => void,
) {
  if (e.key === "ArrowDown") {
    e.preventDefault();
    if (!state.open) state.setOpen(true);
    else state.setHi(Math.min(state.hi + 1, count - 1));
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    state.setHi(Math.max(state.hi - 1, 0));
  } else if (e.key === "Enter" && state.open && count > 0) {
    e.preventDefault();
    pick(state.hi);
  } else if (e.key === "Escape") {
    state.setOpen(false);
  }
}

/** Custom-styled select: a field-looking button that opens a listbox. */
export function Dropdown({
  label,
  hint,
  options,
  value,
  defaultValue,
  onChange,
  placeholder,
  className,
}: {
  label?: ReactNode;
  hint?: ReactNode;
  options: readonly string[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** Shown dimmed while nothing is chosen. */
  placeholder?: string;
  className?: string;
}) {
  const [inner, setInner] = useState(defaultValue);
  const current = value ?? inner;
  const { open, setOpen, ref, triggerRef } = usePopover();
  const [hi, setHi] = useState(0);
  const id = useId();
  const pick = (i: number) => {
    const o = options[i];
    if (o == null) return;
    setInner(o);
    onChange?.(o);
    setOpen(false);
  };
  return (
    <Field label={label} hint={hint} htmlFor={id} className={className}>
      <div ref={ref} className="relative">
        <button
          id={id}
          ref={triggerRef}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          data-ds-focus=""
          onClick={() => {
            setHi(Math.max(0, options.indexOf(current ?? "")));
            setOpen(!open);
          }}
          onKeyDown={(e) => listKeys(e, options.length, { open, setOpen, hi, setHi }, pick)}
          className={cx(
            fieldClass,
            "flex min-h-[38px] cursor-pointer items-center justify-between gap-2 text-left",
            open && "border-hairline-strong! shadow-focus",
            current == null && "text-ink-tertiary!",
          )}
        >
          <span className="truncate">{current ?? placeholder}</span>
          <Icon
            name="chevron-down"
            size={14}
            className={cx("text-ink-subtle transition-transform", transition, open && "rotate-180")}
          />
        </button>
        {open && (
          <div
            id={`${id}-list`}
            role="listbox"
            className={cx(listboxClass, "inset-x-0 top-full mt-1")}
          >
            {options.map((o, i) => (
              <div
                key={o}
                role="option"
                aria-selected={o === current}
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(i);
                }}
                onMouseEnter={() => setHi(i)}
                className={optionClass(i === hi)}
              >
                <span className="flex-1">{o}</span>
                {o === current && <Icon name="check" size={14} className="text-primary" />}
              </div>
            ))}
          </div>
        )}
      </div>
    </Field>
  );
}

/** Search-as-you-type field with suggestions; offers "Use “…”" for a custom value. */
export function Combobox({
  label,
  hint,
  options,
  value,
  defaultValue = "",
  onChange,
  placeholder,
  allowCustom = true,
  className,
}: {
  label?: ReactNode;
  hint?: ReactNode;
  options: readonly string[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  allowCustom?: boolean;
  className?: string;
}) {
  const [inner, setInner] = useState(defaultValue);
  const current = value ?? inner;
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const id = useId();
  const set = (v: string) => {
    setInner(v);
    onChange?.(v);
  };
  const q = current.trim().toLowerCase();
  const matches = options.filter((o) => !q || o.toLowerCase().includes(q)).slice(0, 8);
  const exact = options.some((o) => o.toLowerCase() === q);
  const items: { value: string; custom?: boolean }[] = [
    ...matches.map((m) => ({ value: m })),
    ...(allowCustom && q && !exact ? [{ value: current.trim(), custom: true }] : []),
  ];
  const pick = (i: number) => {
    const it = items[i];
    if (!it) return;
    set(it.value);
    setOpen(false);
  };
  return (
    <Field label={label} hint={hint} htmlFor={id} className={className}>
      <div className="relative">
        <Icon
          name="search"
          size={14}
          className="pointer-events-none absolute top-3 left-3 text-ink-subtle"
        />
        <input
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-controls={`${id}-list`}
          aria-activedescendant={open && items[hi] ? `${id}-o${hi}` : undefined}
          value={current}
          placeholder={placeholder}
          data-ds-focus=""
          onChange={(e) => {
            set(e.target.value);
            setOpen(true);
            setHi(0);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={(e) => listKeys(e, items.length, { open, setOpen, hi, setHi }, pick)}
          className={cx(fieldClass, "min-h-[38px] pl-[34px]")}
        />
        {open && items.length > 0 && (
          <div
            id={`${id}-list`}
            role="listbox"
            className={cx(listboxClass, "inset-x-0 top-full mt-1")}
          >
            {items.map((it, i) => (
              <div
                key={it.custom ? "__custom" : it.value}
                id={`${id}-o${i}`}
                role="option"
                aria-selected={i === hi}
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(i);
                }}
                onMouseEnter={() => setHi(i)}
                className={optionClass(i === hi)}
              >
                {it.custom ? (
                  <Fragment>
                    <Icon name="plus" size={14} className="text-primary" />
                    Use “{it.value}”
                  </Fragment>
                ) : (
                  it.value
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Field>
  );
}

const triggerClass = (open: boolean) =>
  cx(
    "box-border inline-flex h-8 cursor-pointer items-center gap-2 rounded-md border px-2.5 text-small whitespace-nowrap text-ink transition-[background-color,border-color]",
    transition,
    open
      ? "border-hairline-strong bg-surface-2 shadow-focus"
      : "border-hairline hover:border-hairline-strong hover:bg-surface-1",
  );

const popClass =
  "absolute top-[calc(100%+6px)] right-0 z-30 box-border rounded-lg border border-hairline-strong bg-surface-2 p-1.5 shadow-edge";

/** Borderless select that sits inline in a sentence or toolbar ("Sort: Newest ▾"). */
export function InlineSelect({
  value,
  defaultValue,
  options,
  onChange,
  label,
}: {
  value?: string;
  defaultValue?: string;
  options: readonly string[];
  onChange?: (value: string) => void;
  /** Accessible name. */
  label: string;
}) {
  const [inner, setInner] = useState(defaultValue ?? options[0]);
  const current = value ?? inner;
  const { open, setOpen, ref, triggerRef } = usePopover();
  const [hi, setHi] = useState(0);
  const pick = (i: number) => {
    const o = options[i];
    if (o == null) return;
    setInner(o);
    onChange?.(o);
    setOpen(false);
  };
  return (
    <div ref={ref} className="relative inline-flex">
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          setHi(Math.max(0, options.indexOf(current ?? "")));
          setOpen(!open);
        }}
        onKeyDown={(e) => listKeys(e, options.length, { open, setOpen, hi, setHi }, pick)}
        className={cx(
          "box-border inline-flex h-8 cursor-pointer items-center gap-2 rounded-md border border-transparent px-2.5 text-small whitespace-nowrap text-ink transition-colors hover:bg-surface-2",
          transition,
          open && "bg-surface-2",
        )}
      >
        {current}
        <Icon
          name="chevron-down"
          size={14}
          className={cx("text-ink-subtle transition-transform", transition, open && "rotate-180")}
        />
      </button>
      {open && (
        <div
          role="listbox"
          aria-label={label}
          className={cx(popClass, "max-h-[300px] min-w-[200px] overflow-y-auto")}
        >
          {options.map((o, i) => (
            <div
              key={o}
              role="option"
              aria-selected={o === current}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(i);
              }}
              onMouseEnter={() => setHi(i)}
              className={optionClass(i === hi)}
            >
              <span className="flex-1">{o}</span>
              {o === current && <Icon name="check" size={14} className="text-primary" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Time ---------- */

const pad2 = (n: number) => String(n).padStart(2, "0");
const HOURS = Array.from({ length: 24 }, (_, i) => pad2(i));
const MINUTES = Array.from({ length: 12 }, (_, i) => pad2(i * 5));

function TimeColumn({
  items,
  value,
  onPick,
  label,
}: {
  items: string[];
  value: string;
  onPick: (v: string) => void;
  label: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const i = items.indexOf(value);
    if (ref.current && i >= 0) ref.current.scrollTop = Math.max(0, i * 32 - 64);
    // Scroll to the selection once, when the column mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="flex flex-col gap-1">
      <span className="text-center text-micro tracking-normal text-ink-tertiary">{label}</span>
      <div
        ref={ref}
        role="listbox"
        aria-label={label === "hr" ? "Hour" : "Minute"}
        className="flex h-44 w-[52px] flex-col overflow-y-auto [scrollbar-width:none]"
      >
        {items.map((it) => {
          const on = it === value;
          return (
            <button
              key={it}
              type="button"
              role="option"
              aria-selected={on}
              onClick={() => onPick(it)}
              className={cx(
                "flex h-8 flex-none cursor-pointer items-center justify-center rounded-sm font-mono text-ui",
                on ? "bg-primary text-on-primary" : "text-ink-muted hover:bg-surface-3",
              )}
            >
              {it}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TimeWheel({
  value,
  onChange,
  title,
}: {
  value: string;
  onChange: (v: string) => void;
  title?: string;
}) {
  const [hh = "08", mm = "00"] = value.split(":");
  return (
    <div className="flex flex-col gap-2">
      {title && (
        <span className="px-1 py-0.5 text-caption font-medium text-ink-subtle">{title}</span>
      )}
      <div className="flex items-start gap-1">
        <TimeColumn items={HOURS} value={hh} label="hr" onPick={(x) => onChange(`${x}:${mm}`)} />
        <span className="self-center pt-4 font-mono text-ink-tertiary">:</span>
        <TimeColumn items={MINUTES} value={mm} label="min" onPick={(x) => onChange(`${hh}:${x}`)} />
      </div>
    </div>
  );
}

/** "HH:MM" picker with hour/minute wheels and preset chips (digest time, reminders). */
export function TimePicker({
  value,
  defaultValue = "08:00",
  onChange,
  label,
  presets = ["07:00", "08:00", "12:00", "18:00"],
}: {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** Accessible name of the trigger. */
  label: string;
  presets?: string[];
}) {
  const [inner, setInner] = useState(value ?? defaultValue);
  const current = value ?? inner;
  const set = (v: string) => {
    setInner(v);
    onChange?.(v);
  };
  const { open, setOpen, ref, triggerRef } = usePopover();
  return (
    <div ref={ref} className="relative inline-flex">
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className={triggerClass(open)}
      >
        <Icon name="clock" size={14} className="text-ink-subtle" />
        <span className="font-mono text-ui">{current}</span>
      </button>
      {open && (
        <div className={cx(popClass, "flex flex-col gap-3 p-3")}>
          <TimeWheel value={current} onChange={set} />
          <div className="flex max-w-32 flex-wrap gap-1 border-t border-hairline pt-2.5">
            {presets.map((p) => (
              <Chip
                key={p}
                active={p === current}
                onClick={() => {
                  set(p);
                  setOpen(false);
                }}
              >
                {p}
              </Chip>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** Length of a start→end window, wrapping past midnight: "10h", "7h 30m". */
export function durationLabel(start: string, end: string): string {
  const mins = (s: string) => {
    const [h = 0, m = 0] = s.split(":").map(Number);
    return h * 60 + m;
  };
  let d = mins(end) - mins(start);
  if (d <= 0) d += 1440;
  const h = Math.floor(d / 60);
  const m = d % 60;
  return `${h}h${m ? ` ${m}m` : ""}`;
}

export interface TimeRange {
  start: string;
  end: string;
  off: boolean;
}

/** Start → end window (quiet hours, sending window), optionally switchable off. */
export function TimeRangePicker({
  start,
  end,
  off,
  defaultStart = "22:00",
  defaultEnd = "08:00",
  defaultOff = false,
  allowOff,
  onChange,
  label,
}: {
  start?: string;
  end?: string;
  off?: boolean;
  defaultStart?: string;
  defaultEnd?: string;
  defaultOff?: boolean;
  allowOff?: boolean;
  onChange?: (range: TimeRange) => void;
  label: string;
}) {
  const [s0, setS] = useState(defaultStart);
  const [e0, setE] = useState(defaultEnd);
  const [o0, setO] = useState(defaultOff);
  const s = start ?? s0;
  const e = end ?? e0;
  const isOff = off ?? o0;
  const { open, setOpen, ref, triggerRef } = usePopover();
  return (
    <div ref={ref} className="relative inline-flex">
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className={triggerClass(open)}
      >
        <Icon name={isOff ? "moon" : "clock"} size={14} className="text-ink-subtle" />
        {isOff ? (
          <span className="text-ink-subtle">Off</span>
        ) : (
          <span className="inline-flex items-center gap-1.5 font-mono text-ui">
            {s}
            <Icon name="arrow-right" size={12} className="text-ink-tertiary" />
            {e}
          </span>
        )}
      </button>
      {open && (
        <div className={cx(popClass, "flex flex-col gap-3 p-3")}>
          <div className={cx("flex gap-4", isOff && "pointer-events-none opacity-40")}>
            <TimeWheel
              title="Start"
              value={s}
              onChange={(x) => {
                setS(x);
                onChange?.({ start: x, end: e, off: isOff });
              }}
            />
            <span className="w-px bg-hairline" />
            <TimeWheel
              title="End"
              value={e}
              onChange={(x) => {
                setE(x);
                onChange?.({ start: s, end: x, off: isOff });
              }}
            />
          </div>
          <div className="flex items-center gap-2 border-t border-hairline pt-2.5">
            {allowOff ? (
              <span className="flex items-center gap-2 text-caption text-ink-muted">
                <Toggle
                  on={!isOff}
                  label="Enabled"
                  onChange={(v) => {
                    setO(!v);
                    onChange?.({ start: s, end: e, off: !v });
                  }}
                />
                {isOff ? "Off" : durationLabel(s, e)}
              </span>
            ) : (
              <span className="text-caption text-ink-subtle">{durationLabel(s, e)}</span>
            )}
            <span className="flex-1" />
            <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>
              Done
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
