"use client";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import type { IconName } from "../icons";
import { cx, transition } from "../lib/cx";
import { initials } from "../lib/tone";
import { Button } from "./Button";
import { Eyebrow } from "./Foundations";
import { Icon } from "./Icon";
import { IconButton } from "./IconButton";
import { ToneBadge, type Tone } from "./Status";

export type CardVariant = "default" | "featured" | "screenshot" | "testimonial";

const cardVariant: Record<CardVariant, string> = {
  default: "rounded-lg border-hairline bg-surface-1 p-6",
  featured: "rounded-lg border-hairline-strong bg-surface-2 p-6",
  screenshot: "rounded-xl border-hairline bg-surface-1 p-6",
  testimonial: "rounded-lg border-hairline bg-surface-1 p-8 text-lead leading-[1.5]",
};

/**
 * Lifted panel: surface step, 1px hairline, 7% top edge. `interactive` adds the hover lift
 * (surface-1 → 2, hairline → strong); give it `onClick` or `href`-wrapped content.
 */
export function Card({
  variant = "default",
  interactive = false,
  eyebrow,
  title,
  children,
  className,
  onClick,
}: {
  variant?: CardVariant;
  interactive?: boolean;
  eyebrow?: ReactNode;
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cx(
        "box-border flex flex-col gap-3 border text-body text-ink shadow-edge transition-[background-color,border-color]",
        transition,
        cardVariant[variant],
        interactive && "cursor-pointer hover:border-hairline-strong hover:bg-surface-2",
        className,
      )}
    >
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      {title && <div className="text-title font-medium">{title}</div>}
      {children}
    </div>
  );
}

/** App panel: a card with a header row (optional icon tile, title, sub, meta, status badge). */
export function Panel({
  title,
  sub,
  meta,
  icon,
  status,
  tone = "neutral",
  padded = false,
  children,
  className,
}: {
  title?: ReactNode;
  sub?: ReactNode;
  meta?: ReactNode;
  icon?: IconName;
  status?: ReactNode;
  tone?: Tone;
  /** 20px body padding with 16px gaps; off for edge-to-edge lists. */
  padded?: boolean;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "box-border flex flex-col overflow-hidden rounded-lg border border-hairline bg-surface-1 text-small text-ink shadow-edge",
        className,
      )}
    >
      {title && (
        <div
          className={cx(
            "flex items-center justify-between gap-3 border-b border-hairline px-5",
            icon ? "py-4" : "py-3",
          )}
        >
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {icon && (
              <span className="box-border inline-flex size-8 flex-none items-center justify-center rounded-md border border-primary-line bg-primary-soft text-primary">
                <Icon name={icon} size={16} />
              </span>
            )}
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className={cx("text-small text-ink", icon ? "font-semibold" : "font-medium")}>
                {title}
              </span>
              {sub && <span className="text-caption text-pretty text-ink-subtle">{sub}</span>}
            </div>
          </div>
          {(meta || status) && (
            <span className="inline-flex flex-none items-center gap-2">
              {meta && (
                <span className="text-caption whitespace-nowrap text-ink-subtle">{meta}</span>
              )}
              {status && <ToneBadge tone={tone}>{status}</ToneBadge>}
            </span>
          )}
        </div>
      )}
      <div className={cx("flex min-w-0 flex-col", padded && "gap-4 p-5")}>{children}</div>
    </div>
  );
}

/** Page title row in the app: H1 (headline size) + sub, actions on the right. */
export function PageHeader({
  title,
  sub,
  children,
}: {
  title: ReactNode;
  sub?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-6">
      <div className="flex min-w-0 flex-col gap-1.5">
        <h1 className="m-0 font-sans text-headline font-semibold text-ink">{title}</h1>
        {sub && <p className="m-0 max-w-prose text-small text-pretty text-ink-subtle">{sub}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

export function PricingCard({
  tier,
  price,
  period = "/mo",
  description,
  features = [],
  cta = "Get started",
  featured = false,
  onSelect,
  href,
}: {
  tier: string;
  price: string;
  period?: string;
  description?: ReactNode;
  features?: string[];
  cta?: string;
  featured?: boolean;
  onSelect?: () => void;
  href?: string;
}) {
  return (
    <Card variant={featured ? "featured" : "default"} className="gap-5">
      <div className="flex flex-col gap-2">
        <div className="text-headline font-semibold">{tier}</div>
        {description && <div className="text-small text-ink-subtle">{description}</div>}
      </div>
      <div className="flex flex-wrap items-baseline gap-1.5">
        <span className="text-stat leading-[1.1] font-semibold">{price}</span>
        {period && <span className="text-small text-ink-subtle">{period}</span>}
      </div>
      <Button variant={featured ? "primary" : "secondary"} fullWidth onClick={onSelect} href={href}>
        {cta}
      </Button>
      <ul className="m-0 flex list-none flex-col gap-2.5 p-0 text-small text-ink-muted">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2.5">
            <span
              aria-hidden="true"
              className={cx(
                "mt-[7px] size-1.5 flex-none rounded-full",
                featured ? "bg-primary" : "bg-ink-tertiary",
              )}
            />
            {f}
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function TestimonialCard({
  quote,
  name,
  role,
  avatar,
}: {
  quote: ReactNode;
  name: string;
  role: string;
  avatar?: string;
}) {
  return (
    <Card variant="testimonial" className="h-full gap-6">
      <p className="m-0 text-pretty">{quote}</p>
      <div className="mt-auto flex items-center gap-3">
        <div
          aria-hidden="true"
          className="flex size-9 flex-none items-center justify-center overflow-hidden rounded-full border border-hairline bg-surface-3 text-caption font-medium text-ink-muted"
        >
          {avatar ? <img src={avatar} alt="" className="size-full object-cover" /> : initials(name)}
        </div>
        <div className="flex flex-col text-small leading-[1.35]">
          <span className="font-medium">{name}</span>
          <span className="text-ink-subtle">{role}</span>
        </div>
      </div>
    </Card>
  );
}

/** Terminal window for commands (self-host section). */
export function CodeWindow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cx("overflow-hidden rounded-xl border border-hairline bg-surface-1", className)}
    >
      <div aria-hidden="true" className="flex gap-1.5 border-b border-hairline px-3.5 py-3">
        {[0, 1, 2].map((i) => (
          <span key={i} className="size-2.5 rounded-full bg-surface-4" />
        ))}
      </div>
      <pre className="m-0 px-[22px] py-5 font-mono text-ui leading-[1.8] whitespace-pre-wrap text-ink-muted">
        {children}
      </pre>
    </div>
  );
}

/** FAQ list. One row open at a time; rows expand with grid-template-rows (500ms ease-out-expo). */
export function Accordion({
  items,
  defaultOpen = 0,
}: {
  items: { q: ReactNode; a: ReactNode }[];
  defaultOpen?: number;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const base = useId();
  return (
    <div>
      {items.map((it, i) => {
        const on = open === i;
        const panelId = `${base}-p${i}`;
        const buttonId = `${base}-b${i}`;
        return (
          <div key={i} className="border-b border-hairline">
            <button
              id={buttonId}
              type="button"
              aria-expanded={on}
              aria-controls={panelId}
              onClick={() => setOpen(on ? -1 : i)}
              className={cx(
                "box-border flex w-full cursor-pointer items-center justify-between gap-4 py-5 text-left text-body font-medium",
                on ? "text-ink" : "text-ink-muted",
              )}
            >
              {it.q}
              <Icon
                name="plus"
                size={16}
                className={cx(
                  "text-ink-subtle transition-transform duration-(--duration-slow) ease-out-expo",
                  on && "rotate-45",
                )}
              />
            </button>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              className={cx(
                "grid transition-[grid-template-rows] duration-500 ease-out-expo",
                on ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
              )}
            >
              <div className="overflow-hidden">
                <p className="m-0 mb-5 max-w-[600px] text-body leading-[1.6] text-ink-subtle">
                  {it.a}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Job-source pebble in the marketing marquee. Turns to paper on hover.
 * `icon`: a registry icon name, or `si:<slug>` for a Simple Icons brand mark.
 */
export function SourceChip({ name, icon }: { name: string; icon?: IconName | `si:${string}` }) {
  const [broken, setBroken] = useState(false);
  let mark: ReactNode;
  if (icon && icon.startsWith("si:") && !broken) {
    mark = (
      <img
        src={`https://cdn.simpleicons.org/${icon.slice(3)}/C3C8D1`}
        alt=""
        width={14}
        height={14}
        onError={() => setBroken(true)}
        className="group-hover:brightness-[0.1]"
      />
    );
  } else if (icon && !icon.startsWith("si:")) {
    mark = <Icon name={icon as IconName} size={14} />;
  } else {
    mark = <span className="text-caption font-semibold">{name[0]}</span>;
  }
  return (
    <div className="group flex items-center gap-2.5 rounded-full border border-hairline bg-surface-1 py-1.5 pr-4 pl-1.5 text-small font-medium whitespace-nowrap text-ink-muted transition-[background-color,color,border-color] duration-250 hover:border-paper hover:bg-paper hover:text-paper-ink">
      <span className="flex size-7 flex-none items-center justify-center rounded-full bg-surface-3 text-ink-muted transition-colors duration-250 group-hover:bg-paper-rule group-hover:text-paper-ink">
        {mark}
      </span>
      {name}
    </div>
  );
}

/**
 * Dialog on a dimmed scrim. Closes on Escape and scrim click, moves focus into the dialog and
 * back to where it was on close.
 */
export function Modal({
  open,
  onClose,
  title,
  sub,
  width = 520,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  sub?: ReactNode;
  width?: number;
  children?: ReactNode;
  footer?: ReactNode;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // With stacked dialogs, Escape closes only the top one.
      const all = document.querySelectorAll('[role="dialog"][aria-modal="true"]');
      if (all[all.length - 1] === dialogRef.current) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-60 flex items-center justify-center bg-scrim p-6 font-sans"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[calc(100vh-48px)] w-full flex-col overflow-hidden rounded-xl border border-hairline-strong bg-canvas text-ink shadow-edge outline-none"
        style={{ maxWidth: width }}
      >
        <div className="flex items-start gap-2 pt-[18px] pr-3 pb-3 pl-5">
          <div className="flex flex-1 flex-col gap-0.5">
            <span id={titleId} className="text-body font-semibold">
              {title}
            </span>
            {sub && <span className="text-caption text-pretty text-ink-subtle">{sub}</span>}
          </div>
          <IconButton icon="x" title="Close" onClick={onClose} />
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 pt-1 pb-5">
          {children}
        </div>
        {footer && (
          <div className="flex justify-end gap-2 border-t border-hairline px-5 py-3">{footer}</div>
        )}
      </div>
    </div>
  );
}
