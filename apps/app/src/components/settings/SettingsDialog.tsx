"use client";
import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { Icon, IconButton, cx } from "@ge/ui";
import { loadSettingsDialog, type SettingsData } from "@/server/actions/settings";
import {
  FeedbackDialog,
  SETTINGS_LABEL,
  SETTINGS_NAV,
  SettingsPane,
  type SettingsTab,
} from "./Settings";

/*
 * Settings open as a dialog over the current page, addressed by the URL hash:
 * #settings/general, #settings/account, … (like claude.ai/#settings/general). #settings/feedback
 * opens the feedback form. Links anywhere can point at these hashes.
 */
const TABS = Object.keys(SETTINGS_LABEL) as SettingsTab[];

function parse(hash: string): SettingsTab | "feedback" | null {
  const m = /^#settings(?:\/([a-z]+))?$/.exec(hash);
  if (!m) return null;
  const tab = m[1] === "usage" ? "billing" : (m[1] ?? "general");
  if (tab === "feedback") return "feedback";
  return (TABS as string[]).includes(tab) ? (tab as SettingsTab) : "general";
}

const subscribe = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
};

export function openSettings(tab: SettingsTab | "feedback" = "general") {
  window.location.hash = `settings/${tab}`;
}

function clearHash() {
  history.replaceState(history.state, "", location.pathname + location.search);
  window.dispatchEvent(new HashChangeEvent("hashchange"));
}

export function SettingsDialog() {
  const hashRoute = useSyncExternalStore(
    subscribe,
    () => parse(location.hash),
    () => null,
  );
  // The dialog stays open until closed on purpose: a server refresh (after saving a setting)
  // makes Next's router rewrite the URL without our hash, which must not close it.
  const [route, setRoute] = useState<ReturnType<typeof parse>>(null);
  if (hashRoute && hashRoute !== route) setRoute(hashRoute);
  const close = () => {
    setRoute(null);
    clearHash();
  };
  useEffect(() => {
    if (route && !parse(location.hash))
      history.replaceState(
        history.state,
        "",
        `${location.pathname}${location.search}#settings/${route}`,
      );
  });
  const [data, setData] = useState<SettingsData | null>(null);
  const [failed, setFailed] = useState(false);
  const [q, setQ] = useState("");
  const [version, setVersion] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(close);
  useEffect(() => {
    closeRef.current = close;
  });
  const titleId = useId();
  const open = route != null && route !== "feedback";

  const load = useCallback(() => {
    loadSettingsDialog()
      .then((d) => {
        setFailed(false);
        setData(d);
        setVersion((v) => v + 1);
      })
      .catch(() => setFailed(true));
  }, []);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const all = document.querySelectorAll('[role="dialog"][aria-modal="true"]');
      if (all[all.length - 1] === dialogRef.current) closeRef.current();
    };
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [open]);

  if (route === "feedback") return <FeedbackDialog onClose={close} />;
  if (!open) return null;

  const query = q.trim().toLowerCase();
  const nav = SETTINGS_NAV.map(
    ([title, items]) =>
      [
        title,
        items.filter((n) => !query || `${n.label} ${n.keywords}`.toLowerCase().includes(query)),
      ] as const,
  ).filter(([, items]) => items.length);

  return (
    <div
      onClick={close}
      className="fixed inset-0 z-50 flex items-center justify-center bg-scrim p-6 font-sans max-md:p-0"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="relative grid h-[min(720px,calc(100vh-48px))] w-[min(1000px,100%)] grid-cols-[232px_minmax(0,1fr)] overflow-hidden rounded-xl border border-hairline-strong bg-canvas text-ink shadow-edge outline-none max-md:h-full max-md:grid-cols-1 max-md:grid-rows-[auto_minmax(0,1fr)] max-md:rounded-none max-md:border-0"
      >
        <aside className="flex min-h-0 flex-col gap-4 border-r border-hairline bg-surface-1 p-3 max-md:gap-2 max-md:border-r-0 max-md:border-b max-md:pt-3 max-md:pr-14">
          <h2 className="m-0 px-2 pt-1.5 text-lead font-semibold max-md:pt-0.5">Settings</h2>
          <label className="box-border flex h-8 flex-none items-center gap-2 rounded-md border border-hairline-strong bg-canvas px-2.5 max-md:hidden">
            <Icon name="search" size={14} className="text-ink-subtle" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search settings"
              aria-label="Search settings"
              className="min-w-0 flex-1 bg-transparent text-small text-ink outline-none placeholder:text-ink-tertiary"
            />
          </label>
          <div className="flex min-h-0 flex-col gap-4 overflow-y-auto max-md:flex-row max-md:gap-1 max-md:overflow-x-auto">
            {nav.map(([title, items]) => (
              <nav
                key={title}
                aria-label={title}
                className="flex flex-col gap-0.5 max-md:flex-row max-md:gap-1"
              >
                <span className="px-2 pb-1 text-caption text-ink-tertiary max-md:hidden">
                  {title}
                </span>
                {items.map((n) => {
                  const on = route === n.id;
                  return (
                    <a
                      key={n.id}
                      href={`#settings/${n.id}`}
                      aria-current={on ? "page" : undefined}
                      className={cx(
                        "flex h-8 flex-none items-center gap-2.5 rounded-sm px-2 text-small whitespace-nowrap no-underline hover:bg-surface-2 hover:text-ink focus-visible:shadow-focus focus-visible:outline-none",
                        on ? "bg-surface-3 text-ink" : "text-ink-subtle",
                      )}
                    >
                      <Icon name={n.icon} size={16} />
                      {n.label}
                    </a>
                  );
                })}
              </nav>
            ))}
            {nav.length === 0 && (
              <span className="px-2 text-caption text-ink-subtle">No settings match.</span>
            )}
          </div>
        </aside>
        <div className="flex min-h-0 flex-col">
          <header className="flex h-14 flex-none items-center justify-between gap-3 border-b border-hairline pr-3 pl-8 max-md:hidden">
            <h1 id={titleId} className="m-0 text-body font-semibold">
              {SETTINGS_LABEL[route]}
            </h1>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto px-8 pt-6 pb-10 max-md:px-4 max-md:pt-4">
            {data ? (
              // Remounts only after a reload from the server; edits update `data` in place.
              <SettingsPane
                key={version}
                tab={route}
                data={data}
                update={(fn) => setData((d) => d && fn(d))}
                onChanged={load}
              />
            ) : failed ? (
              <p role="alert" className="m-0 text-small text-danger-ink">
                We couldn&apos;t load your settings. Close this and try again.
              </p>
            ) : (
              <p role="status" className="m-0 text-small text-ink-subtle">
                Loading your settings…
              </p>
            )}
          </div>
        </div>
        <IconButton
          icon="x"
          title="Close settings"
          onClick={close}
          className="absolute top-3 right-3"
        />
      </div>
    </div>
  );
}
