import type { ReactNode } from "react";
import { Container, cx } from "@ge/ui";

/** Blueprint wrapper: full-bleed top rule plus a centred column with hatched gutters. */
export function GridFrame({ children, rule = true }: { children: ReactNode; rule?: boolean }) {
  return (
    <div className="ge-frame" data-rule={rule ? "" : undefined}>
      <div className="ge-col">{children}</div>
    </div>
  );
}

/** Full-bleed hairlines above and below a row, with an optional mono annotation. */
export function Rule({
  label,
  children,
  className,
}: {
  label?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("flex max-w-full flex-col items-start", className)}>
      {label && (
        <div
          aria-hidden="true"
          className="mb-2 max-w-full truncate font-mono text-caption leading-none text-ink-tertiary opacity-80"
        >
          {label}
        </div>
      )}
      <div className="ge-rule max-w-full">{children}</div>
    </div>
  );
}

/** A page section inside the grid frame. */
export function Section({
  children,
  id,
  top = "section",
  bottom = "none",
  rule = true,
  className,
}: {
  children: ReactNode;
  id?: string;
  top?: "section" | "tight" | "none";
  bottom?: "section" | "tight" | "none" | number;
  rule?: boolean;
  className?: string;
}) {
  return (
    <GridFrame rule={rule}>
      <Container id={id} top={top} bottom={bottom} className={className}>
        {children}
      </Container>
    </GridFrame>
  );
}

export function SectionIntro({
  eyebrow,
  title,
  className,
}: {
  eyebrow: string;
  title: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("mb-12 flex flex-col gap-4", className)}>
      <div className="text-eyebrow font-medium text-ink-subtle uppercase">{eyebrow}</div>
      {title}
    </div>
  );
}
