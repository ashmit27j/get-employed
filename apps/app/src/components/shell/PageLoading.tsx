"use client";
import { usePathname } from "next/navigation";
import { NAV } from "./nav";
import { PageBody, Topbar, navIdFor } from "./AppShell";

const LABELS = new Map(NAV.flatMap((g) => g.items).map((i) => [i.id, i.label]));
LABELS.set("assistant", "Assistant");

const block = "rounded-lg border border-hairline bg-surface-1";

/** Shown inside the shell while the next page renders, so a nav click responds at once. */
export function PageLoading() {
  const label = LABELS.get(navIdFor(usePathname())) ?? "";
  return (
    <>
      <Topbar crumbs={[{ label }]} />
      <PageBody>
        <div role="status" aria-label={`Loading ${label}`} className="flex flex-col gap-4">
          <div className={`${block} h-10 w-2/5`} />
          <div className={`${block} h-28`} />
          <div className={`${block} h-28`} />
          <div className={`${block} h-28`} />
        </div>
      </PageBody>
    </>
  );
}
