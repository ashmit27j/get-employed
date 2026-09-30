// Plain <img>: @ge/ui is framework-agnostic and the brand marks are small static PNGs.
import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { cx } from "../lib/cx";
import { initials } from "../lib/tone";

/** Brand mark + "GetEmployed" in Inter 600. Each app serves the mark at /ge-mark.png. */
export function Wordmark({
  size = 18,
  markSrc = "/ge-mark.png",
  className,
}: {
  size?: number;
  markSrc?: string;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center font-sans leading-none font-semibold text-ink",
        className,
      )}
      style={{ gap: size * 0.4, fontSize: size, letterSpacing: -size * 0.03 }}
    >
      <img
        src={markSrc}
        alt=""
        aria-hidden="true"
        width={size * 1.1}
        height={size * 1.1}
        className="block object-contain"
      />
      GetEmployed
    </span>
  );
}

/** The supplied wordmark artwork, served by each app at /ge-wordmark.png. */
export function BrandWordmark({
  height = 36,
  src = "/ge-wordmark.png",
  className,
}: {
  height?: number;
  src?: string;
  className?: string;
}) {
  return (
    <img src={src} alt="GetEmployed" className={cx("block w-auto", className)} style={{ height }} />
  );
}

type Spacing = "section" | "tight" | "none" | number;
const pad = (v: Spacing) =>
  typeof v === "number"
    ? v
    : v === "section"
      ? "var(--space-section)"
      : v === "tight"
        ? "var(--space-section-sm)"
        : 0;

/** Page section: 1280px container, 24px gutter, 120px (or 72px "tight") top spacing. */
export function Container({
  children,
  id,
  top = "section",
  bottom = "none",
  className,
}: {
  children: ReactNode;
  id?: string;
  top?: Spacing;
  bottom?: Spacing;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={cx("mx-auto box-border max-w-page px-(--gutter)", className)}
      style={{ paddingTop: pad(top), paddingBottom: pad(bottom) }}
    >
      {children}
    </section>
  );
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cx("text-eyebrow font-medium text-ink-subtle uppercase", className)}>
      {children}
    </div>
  );
}

/** Section H2. size "md" is the 48px heading used in split layouts. Scales down under 1024px. */
export function SectionHeading({
  children,
  size = "lg",
  as: Tag = "h2",
  className,
  ...rest
}: {
  children: ReactNode;
  size?: "lg" | "md";
  as?: ElementType;
  className?: string;
} & HTMLAttributes<HTMLHeadingElement>) {
  return (
    <Tag
      className={cx(
        "m-0 font-sans font-semibold text-balance",
        size === "md"
          ? "text-section-sm max-lg:text-[clamp(32px,4.6vw,48px)]"
          : "text-section max-lg:text-[clamp(36px,5.5vw,56px)]",
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded-xs border border-hairline-strong px-1.5 font-mono text-micro tracking-normal text-ink-subtle">
      {children}
    </kbd>
  );
}

export function Avatar({ name, size = 28, src }: { name: string; size?: number; src?: string }) {
  return (
    <span
      aria-hidden="true"
      className="box-border inline-flex flex-none items-center justify-center overflow-hidden rounded-full border border-hairline-strong bg-surface-3 font-medium text-ink-muted"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
    >
      {src ? <img src={src} alt="" className="size-full object-cover" /> : initials(name)}
    </span>
  );
}

/** Company placeholder logo: the first letter on a surface-3 tile. */
export function CoLogo({ name, size = 32 }: { name: string; size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="box-border inline-flex flex-none items-center justify-center rounded-md border border-hairline bg-surface-3 font-semibold text-ink-muted"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
    >
      {name[0] ?? ""}
    </span>
  );
}
