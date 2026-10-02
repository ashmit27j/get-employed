"use client";
import { Fragment, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, IconButton, cx } from "@ge/ui";
import type { ShellData } from "@/server/shell";
import { AssistantPanel } from "@/components/assistant/AssistantPanel";
import { SettingsDialog, openSettings } from "@/components/settings/SettingsDialog";
import type { NavId } from "./nav";
import { DOCK, useIsMobile, useShell } from "./ShellProvider";
import { DesktopSidebar, MobileDrawer, MobileTabBar } from "./Sidebar";

const ROUTES: [string, NavId][] = [
  ["/jobs", "jobs"],
  ["/tracker", "tracker"],
  ["/mailbox", "outbox"],
  ["/documents", "resume"],
  ["/interview", "interview"],
  ["/assistant", "assistant"],
  ["/profiles/linkedin", "linkedin"],
  ["/profiles/github", "github"],
  ["/profile", "jobprofile"],
];

function navIdFor(pathname: string): NavId {
  return (
    ROUTES.find(([prefix]) => pathname === prefix || pathname.startsWith(prefix + "/"))?.[1] ??
    "jobs"
  );
}

/** Sidebar (or tab bar + drawer on mobile), keyboard shortcuts and the assistant dock. */
export function AppShell({ data, children }: { data: ShellData; children: ReactNode }) {
  const pathname = usePathname();
  const active = navIdFor(pathname);
  const mobile = useIsMobile();
  const { collapsed, setCollapsed, dockOpen, setDockOpen, dockWidth, setFocusMode } = useShell();
  // A locked account starts with the sidebar tucked away, so the profile has the room.
  useEffect(() => {
    if (!data.locked) return;
    setFocusMode(true);
    return () => setFocusMode(false);
  }, [data.locked, setFocusMode]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      const k = e.key.toLowerCase();
      if (k === "b") {
        e.preventDefault();
        setCollapsed(!collapsed);
      } else if (k === "j" && active !== "assistant") {
        e.preventDefault();
        setDockOpen(!dockOpen);
      } else if (k === ",") {
        e.preventDefault();
        openSettings();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [collapsed, setCollapsed, dockOpen, setDockOpen, active]);

  const docked = dockOpen && !mobile && active !== "assistant";
  return (
    <div
      className="flex min-h-screen bg-canvas text-ink max-md:pb-14"
      style={docked ? { paddingRight: dockWidth } : undefined}
    >
      {mobile ? (
        <>
          <MobileDrawer active={active} data={data} />
          <MobileTabBar active={active} locked={data.locked} />
        </>
      ) : (
        <DesktopSidebar active={active} data={data} />
      )}
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      {dockOpen && active !== "assistant" && <ChatDock userName={data.user.name} />}
      <SettingsDialog />
    </div>
  );
}

function ChatDock({ userName }: { userName: string }) {
  const { setDockOpen, dockWidth, setDockWidth } = useShell();
  const mobile = useIsMobile();
  const [dragging, setDragging] = useState(false);
  useEffect(() => {
    if (!dragging) return;
    const move = (e: MouseEvent) => setDockWidth(window.innerWidth - e.clientX);
    const up = () => setDragging(false);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [dragging, setDockWidth]);
  return (
    <aside
      aria-label="Assistant"
      className="fixed top-0 right-0 bottom-0 z-45 box-border flex max-w-screen flex-col border-l border-hairline bg-canvas text-ink"
      style={{ width: mobile ? "100vw" : dockWidth }}
    >
      {!mobile && (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize assistant"
          aria-valuemin={DOCK.min}
          aria-valuemax={DOCK.max}
          aria-valuenow={dockWidth}
          tabIndex={0}
          onMouseDown={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") setDockWidth(dockWidth + 24);
            if (e.key === "ArrowRight") setDockWidth(dockWidth - 24);
          }}
          className="absolute top-0 bottom-0 -left-1 z-1 w-2 cursor-col-resize"
        />
      )}
      <div className="flex h-14 flex-none items-center gap-2 border-b border-hairline pr-2 pl-4">
        <Icon name="sparkles" size={16} className="text-primary" />
        <span className="flex-1 text-small font-medium">Assistant</span>
        <IconButton icon="maximize-2" title="Open in Assistant" href="/assistant" />
        <IconButton icon="x" title="Close assistant" onClick={() => setDockOpen(false)} />
      </div>
      <AssistantPanel userName={userName} />
    </aside>
  );
}

export interface Crumb {
  label: string;
  href?: string;
}

/**
 * Page top bar: breadcrumbs, page actions and "Ask assistant". On mobile it shows a back button
 * (when there is a parent) or the menu button, and the current page title.
 */
export function Topbar({ crumbs, children }: { crumbs: Crumb[]; children?: ReactNode }) {
  const pathname = usePathname();
  const mobile = useIsMobile();
  const { collapsed, dockOpen, setDockOpen, setDrawerOpen, assistantDisabled } = useShell();
  const onAssistant = navIdFor(pathname) === "assistant";
  const current = crumbs[crumbs.length - 1]!;
  const parent = crumbs.length > 1 ? crumbs[crumbs.length - 2] : undefined;
  const disabledTitle = assistantDisabled
    ? "Assistant is off during an interview session"
    : undefined;

  if (mobile) {
    return (
      <header className="sticky top-0 z-5 box-border flex h-14 flex-none items-center gap-1 border-b border-hairline bg-canvas px-1">
        {parent?.href ? (
          <IconButton
            icon="chevron-left"
            title={`Back to ${parent.label}`}
            href={parent.href}
            size={44}
          />
        ) : (
          <IconButton icon="menu" title="Open menu" onClick={() => setDrawerOpen(true)} size={44} />
        )}
        <div className="flex min-w-0 flex-1 flex-col leading-[1.2]">
          {parent && (
            <span className="truncate text-micro tracking-normal text-ink-tertiary">
              {crumbs
                .slice(0, -1)
                .map((c) => c.label)
                .join(" / ")}
            </span>
          )}
          <span className="truncate text-small font-medium text-ink">{current.label}</span>
        </div>
        {children}
        {!onAssistant && (
          <span
            title={disabledTitle}
            className={cx("inline-flex", assistantDisabled && "pointer-events-none opacity-35")}
          >
            <IconButton
              icon="sparkles"
              title="Ask assistant"
              onClick={() => setDockOpen(!dockOpen)}
              active
              size={44}
            />
          </span>
        )}
      </header>
    );
  }
  return (
    <header
      className={cx(
        "sticky top-0 z-5 box-border flex h-14 flex-none items-center gap-3 border-b border-hairline bg-canvas pr-4 transition-[padding] duration-220 ease-standard",
        collapsed ? "pl-16" : "pl-8",
      )}
    >
      <nav aria-label="Breadcrumb" className="flex min-w-0 flex-1 items-center gap-2 text-small">
        {crumbs.map((c, i) => (
          <Fragment key={i}>
            {i > 0 && <Icon name="chevron-right" size={14} className="text-ink-tertiary" />}
            {c.href && i < crumbs.length - 1 ? (
              <Link href={c.href} className="whitespace-nowrap text-ink-subtle hover:text-ink">
                {c.label}
              </Link>
            ) : (
              <span
                aria-current={i === crumbs.length - 1 ? "page" : undefined}
                className={cx(
                  "truncate whitespace-nowrap",
                  i === crumbs.length - 1 ? "text-ink" : "text-ink-subtle",
                )}
              >
                {c.label}
              </span>
            )}
          </Fragment>
        ))}
      </nav>
      {children}
      {!onAssistant && !dockOpen && (
        <button
          type="button"
          onClick={() => setDockOpen(true)}
          disabled={assistantDisabled}
          title={disabledTitle}
          className="box-border inline-flex h-8 cursor-pointer items-center gap-2 rounded-md border border-hairline px-2.5 text-small text-ink-subtle hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Icon name="sparkles" size={14} className="text-primary" />
          Ask assistant
        </button>
      )}
    </header>
  );
}

/** Standard page body under the top bar. */
export function PageBody({
  children,
  wide,
  className,
}: {
  children: ReactNode;
  wide?: boolean;
  className?: string;
}) {
  return (
    <main
      className={cx(
        // One container for every page: same width, gutters and top spacing. `wide` is for
        // side-by-side editors (Documents).
        "mx-auto box-border flex w-full flex-col gap-6 px-8 pt-8 pb-24 max-md:px-4 max-md:pt-5",
        wide ? "max-w-[1360px]" : "max-w-[1200px]",
        className,
      )}
    >
      {children}
    </main>
  );
}
