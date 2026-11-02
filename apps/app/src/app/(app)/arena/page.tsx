import type { Metadata } from "next";
import Link from "next/link";
import { ARENAS, timeAgo } from "@ge/core";
import { Button, Icon, PageHeader, cx } from "@ge/ui";
import { ArenaUnavailable } from "@/components/arena/parts";
import { PageBody, Topbar } from "@/components/shell/AppShell";
import { isArenaAdmin } from "@/server/arena";
import { loadArenaHub } from "@/server/arena-pages";
import { requireOnboardedUser } from "@/server/session";

export const metadata: Metadata = { title: "Coding Arena" };

export default async function ArenaHubPage() {
  const user = await requireOnboardedUser();
  const hub = await loadArenaHub(user.id);
  const now = new Date();
  return (
    <>
      <Topbar crumbs={[{ label: "Coding Arena" }]}>
        {isArenaAdmin(user.id) && (
          <Button variant="tertiary" size="sm" href="/arena/admin">
            Problem setter
          </Button>
        )}
      </Topbar>
      <PageBody>
        <PageHeader
          title="Coding Arena"
          sub="Practise for online assessments and technical interviews. Your code runs in a sandbox and is judged against hidden tests, with hints first and a full editorial whenever you want it."
        />
        {!hub.ok ? (
          <ArenaUnavailable status={hub.status} message={hub.message} />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
              {hub.data.cards.map((c) => {
                const a = ARENAS[c.id];
                const pct = c.total ? Math.round((c.done / c.total) * 100) : 0;
                return (
                  <Link
                    key={c.id}
                    href={`/arena/${c.id}`}
                    className="group box-border flex flex-col gap-4 rounded-lg border border-hairline bg-surface-1 p-6 text-ink shadow-edge transition-colors duration-(--duration-base) ease-standard hover:border-hairline-strong hover:bg-surface-2 hover:text-ink"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex size-10 flex-none items-center justify-center rounded-md border border-hairline bg-surface-2 text-ink-subtle group-hover:text-primary">
                        <Icon name={a.icon} size={18} />
                      </span>
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="text-body font-medium">{a.label}</span>
                        <span className="text-small text-pretty text-ink-subtle">
                          {a.description}
                        </span>
                      </div>
                      <Icon
                        name="arrow-right"
                        size={16}
                        className="mt-1 text-ink-tertiary group-hover:text-ink"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-baseline justify-between text-caption text-ink-subtle">
                        <span>{a.kind === "judged" ? "Problems solved" : "Sets attempted"}</span>
                        <span className="font-mono text-ink-muted">
                          {c.done} / {c.total}
                        </span>
                      </div>
                      <div
                        role="progressbar"
                        aria-label={`${a.label} progress`}
                        aria-valuenow={pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        className="h-1 overflow-hidden rounded-full bg-surface-3"
                      >
                        <div
                          className={cx("h-full rounded-full", pct ? "bg-primary" : "")}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
            {hub.data.recent.length > 0 && (
              <section className="flex flex-col gap-3">
                <h2 className="m-0 text-small font-medium text-ink">Recently solved</h2>
                <ul className="m-0 flex list-none flex-col divide-y divide-hairline rounded-lg border border-hairline bg-surface-1 p-0">
                  {hub.data.recent.map((r) => (
                    <li key={r.slug}>
                      <Link
                        href={`/arena/problems/${r.slug}`}
                        className="flex items-center gap-3 px-4 py-3 text-small text-ink hover:bg-surface-2 hover:text-ink"
                      >
                        <Icon name="circle-check" size={16} className="text-success-ink" />
                        <span className="flex-1 truncate">{r.title}</span>
                        <span className="text-caption text-ink-subtle">
                          {ARENAS[r.arena].label}
                        </span>
                        <span className="w-10 text-right font-mono text-caption text-ink-tertiary">
                          {timeAgo(r.solvedAt, now)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </PageBody>
    </>
  );
}
