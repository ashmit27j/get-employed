import type { ReactNode } from "react";
import { cx } from "@ge/ui";

/** Section heading inside a settings pane, with an optional one-line description and action. */
export function H2({
  children,
  first,
  sub,
  action,
}: {
  children: ReactNode;
  first?: boolean;
  sub?: string;
  action?: ReactNode;
}) {
  return (
    <div className={cx("mb-1 flex items-end justify-between gap-3", !first && "mt-8")}>
      <div className="flex min-w-0 flex-col gap-0.5">
        <h2 className="m-0 text-body font-semibold">{children}</h2>
        {sub && <p className="m-0 text-caption text-pretty text-ink-subtle">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

/** One setting: title and description on the left, the control on the right. */
export function Row({
  title,
  sub,
  children,
}: {
  title: string;
  sub?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-6 border-b border-hairline py-3.5 max-md:flex-wrap max-md:gap-3">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-small text-ink">{title}</span>
        {sub && <span className="text-caption text-pretty text-ink-subtle">{sub}</span>}
      </div>
      <div className="flex-none">{children}</div>
    </div>
  );
}
