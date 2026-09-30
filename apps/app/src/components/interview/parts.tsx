"use client";
import { useEffect, useRef } from "react";
import { Icon, cx, type IconName } from "@ge/ui";

/** The AI interviewer: a blurred conic orb that breathes while listening and pulses while speaking. */
export function AIOrb({ speaking, size = 180 }: { speaking: boolean; size?: number }) {
  return (
    <div aria-hidden="true" className="relative flex-none" style={{ width: size, height: size }}>
      <div
        className="absolute -inset-[35%] rounded-full bg-[radial-gradient(circle,var(--color-glow),transparent_62%)]"
        style={{ animation: `ge-orb-pulse ${speaking ? "1.1s" : "3.2s"} ease-in-out infinite` }}
      />
      <div
        className="absolute inset-0 rounded-full"
        style={{
          animation: `${speaking ? "ge-orb-talk 1.4s" : "ge-orb-breathe 4s"} ease-in-out infinite`,
        }}
      >
        <div
          className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,var(--color-primary-400),var(--color-primary-200),var(--color-violet-ink),var(--color-primary-100),var(--color-primary-400))]"
          style={{
            filter: `blur(${Math.round(size * 0.05)}px)`,
            animation: `ge-orb-spin ${speaking ? "4s" : "10s"} linear infinite`,
          }}
        />
        <div
          className="absolute inset-[8%] rounded-full bg-[radial-gradient(circle_at_35%_30%,var(--color-primary-50),transparent_55%)] opacity-85 mix-blend-screen"
          style={{ animation: "ge-orb-spin 14s linear infinite reverse" }}
        />
      </div>
    </div>
  );
}

/** Round call control. `off` inverts it (e.g. mic off); `danger` is the wide red end button. */
export function MeetingButton({
  icon,
  label,
  off,
  danger,
  disabled,
  onClick,
}: {
  icon: IconName;
  label: string;
  off?: boolean;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={danger ? undefined : !!off}
      disabled={disabled}
      onClick={onClick}
      className={cx(
        "box-border inline-flex h-12 flex-none cursor-pointer items-center justify-center rounded-full border transition-colors duration-150 focus-visible:shadow-focus focus-visible:outline-none disabled:cursor-default disabled:opacity-40",
        danger ? "w-[68px]" : "w-12",
        danger
          ? "border-transparent bg-danger-ink text-on-primary hover:bg-danger-text"
          : off
            ? "border-transparent bg-ink text-on-primary hover:bg-paper"
            : "border-hairline-strong bg-surface-3 text-ink hover:bg-surface-4",
      )}
    >
      <Icon name={icon} size={20} />
    </button>
  );
}

export interface TranscriptLine {
  who: "ai" | "you";
  t: string;
  text: string;
}

/** The running transcript, newest at the bottom; the live line gets a cursor. */
export function TranscriptReadout({ lines, live }: { lines: TranscriptLine[]; live?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const tail = `${lines.length}:${lines[lines.length - 1]?.text ?? ""}`;
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [tail]);
  return (
    <div ref={ref} className="flex h-full flex-col gap-4 overflow-y-auto pr-1" aria-live="polite">
      {lines.map((l, i) => {
        const ai = l.who === "ai";
        return (
          <div key={i} className="grid grid-cols-[48px_1fr] gap-3">
            <span className="pt-0.5 font-mono text-caption text-ink-tertiary">{l.t}</span>
            <div className="flex flex-col gap-1">
              <span
                className={cx("text-caption font-medium", ai ? "text-ink-subtle" : "text-primary")}
              >
                {ai ? "Interviewer" : "You"}
              </span>
              <span className={cx("text-small text-pretty", ai ? "text-ink-muted" : "text-ink")}>
                {l.text}
                {live && i === lines.length - 1 && (
                  <span className="ml-1 inline-block h-[13px] w-1.5 animate-blink bg-primary align-text-bottom" />
                )}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
