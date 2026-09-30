"use client";
/* eslint-disable @next/next/no-img-element -- small brand icons for LinkedIn/GitHub nav items */
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Avatar, Icon, IconButton, Kbd, Wordmark, cx, type IconName } from "@ge/ui";
import { authClient } from "@/lib/auth-client";
import { useTheme } from "@/lib/theme";
import type { ShellData } from "@/server/shell";
import { AINav } from "./ChatNav";
import { ACCOUNT_MENU, MOBILE_TABS, NAV, type NavEntry, type NavId } from "./nav";
import { useShell } from "./ShellProvider";

const row = "transition-colors duration-(--duration-base) ease-standard";

function NavGlyph({ icon, active }: { icon: NavEntry["icon"]; active: boolean }) {
  if (icon.startsWith("img:"))
    return (
      <img
        src={icon.slice(4)}
        alt=""
        width={16}
        height={16}
        className="block flex-none rounded-[3px]"
      />
    );
  return <Icon name={icon as IconName} size={16} className={active ? "text-primary" : undefined} />;
}

function NavItem({
  entry,
  active,
  badge,
  tall,
}: {
  entry: NavEntry;
  active: boolean;
  badge?: number;
  tall?: boolean;
}) {
  return (
    <Link
      href={entry.href}
      aria-current={active ? "page" : undefined}
      className={cx(
        "flex items-center gap-2.5 rounded-sm px-2.5 text-small",
        row,
        tall ? "h-11" : "h-8",
        active
          ? "bg-surface-2 text-ink shadow-hairline"
          : "text-ink-subtle hover:bg-surface-1 hover:text-ink",
      )}
    >
      <NavGlyph icon={entry.icon} active={active} />
      <span className="flex-1">{entry.label}</span>
      {badge ? (
        <span className="min-w-[18px] rounded-full bg-surface-3 px-1.5 text-center font-mono text-micro tracking-normal text-ink">
          {badge}
        </span>
      ) : null}
    </Link>
  );
}

/** "Documents" with its two sub-pages: main resume and tailored resumes. */
function DocumentsNav({ active, tall }: { active: boolean; tall?: boolean }) {
  const view = useSearchParams().get("view");
  const sub = view === "list" || view === "tailor" ? "list" : "main";
  const [open, setOpen] = useState(active);
  const child = (label: string, href: string, on: boolean) => (
    <Link
      href={href}
      aria-current={on ? "page" : undefined}
      className={cx(
        "block truncate rounded-sm px-2.5 py-1.5 text-ui",
        row,
        on ? "bg-surface-2 text-ink" : "text-ink-subtle hover:bg-surface-1 hover:text-ink",
      )}
    >
      {label}
    </Link>
  );
  return (
    <div className="flex flex-col">
      <div
        className={cx(
          "group/doc flex items-center gap-2.5 rounded-sm px-2.5 text-small",
          row,
          tall ? "h-11" : "h-8",
          active
            ? "bg-surface-2 text-ink shadow-hairline"
            : "text-ink-subtle hover:bg-surface-1 hover:text-ink",
        )}
      >
        <button
          type="button"
          aria-label={open ? "Hide document tabs" : "Show document tabs"}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          className="inline-flex size-4 flex-none cursor-pointer"
        >
          <Icon
            name="file-text"
            size={16}
            className={cx("group-hover/doc:hidden", active && "text-primary")}
          />
          <Icon
            name="chevron-down"
            size={16}
            className={cx(
              "hidden transition-transform group-hover/doc:block",
              !open && "-rotate-90",
            )}
          />
        </button>
        <Link href="/documents" className="flex-1 text-inherit hover:text-inherit">
          Documents
        </Link>
      </div>
      {open && (
        <div className="relative flex flex-col gap-px py-1 pl-7">
          <span
            aria-hidden="true"
            className="absolute top-0 bottom-1 left-[17px] w-px bg-hairline-strong"
          />
          {child("Main resume", "/documents?view=main", active && sub === "main")}
          {child("Tailored resumes", "/documents?view=list", active && sub === "list")}
        </div>
      )}
    </div>
  );
}

function HomeNav({
  active,
  draftCount,
  tall,
}: {
  active: NavId;
  draftCount: number;
  tall?: boolean;
}) {
  return (
    <nav
      aria-label="Workspace"
      className="flex flex-1 flex-col gap-6 overflow-x-hidden overflow-y-auto px-3 py-1"
    >
      {NAV.map(({ group, items }) => (
        <div key={group} className="flex flex-col gap-0.5">
          <div className="px-2.5 pt-1 pb-2 text-caption font-medium tracking-(--text-eyebrow--letter-spacing) text-ink-tertiary uppercase">
            {group}
          </div>
          {items.map((e) =>
            e.id === "resume" ? (
              <DocumentsNav key={e.id} active={active === e.id} tall={tall} />
            ) : (
              <NavItem
                key={e.id}
                entry={e}
                active={active === e.id}
                tall={tall}
                badge={e.badge === "drafts" ? draftCount : undefined}
              />
            ),
          )}
        </div>
      ))}
    </nav>
  );
}

function AccountMenu({ email, onClose }: { email: string; onClose: () => void }) {
  const router = useRouter();
  const [theme, setTheme] = useTheme();
  // "System" shows the toggle for whichever theme is on screen now.
  const dark =
    theme === "dark" ||
    (theme === "system" && !window.matchMedia("(prefers-color-scheme: light)").matches);
  const item =
    "box-border flex w-full cursor-pointer items-center gap-2.5 rounded-sm px-2.5 py-2 text-left text-small text-ink hover:bg-surface-3 hover:text-ink";
  return (
    <div
      role="menu"
      className="absolute inset-x-2 bottom-[calc(100%+6px)] z-30 box-border flex flex-col gap-px rounded-lg border border-hairline bg-surface-2 p-1 shadow-edge"
    >
      <div className="truncate px-2.5 pt-2 pb-1.5 text-caption text-ink-tertiary">{email}</div>
      {ACCOUNT_MENU.map((m) => (
        <a key={m.label} href={m.href} role="menuitem" onClick={onClose} className={item}>
          <Icon name={m.icon} size={15} className="text-ink-subtle" />
          <span className="flex-1">{m.label}</span>
          {m.kbd && <Kbd>{m.kbd}</Kbd>}
        </a>
      ))}
      <button
        type="button"
        role="menuitem"
        className={item}
        onClick={() => setTheme(dark ? "light" : "dark")}
      >
        <Icon name={dark ? "sun" : "moon"} size={15} className="text-ink-subtle" />
        {dark ? "Light mode" : "Dark mode"}
      </button>
      <div aria-hidden="true" className="mx-1.5 my-1 h-px bg-hairline" />
      <button
        type="button"
        role="menuitem"
        className={item}
        onClick={async () => {
          await authClient.signOut();
          onClose();
          router.push("/signin");
          router.refresh();
        }}
      >
        <Icon name="log-out" size={15} className="text-ink-subtle" />
        Log out
      </button>
    </div>
  );
}

function AccountFooter({ user, mobile }: { user: ShellData["user"]; mobile?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const key = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", down);
    window.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("mousedown", down);
      window.removeEventListener("keydown", key);
    };
  }, [open]);
  return (
    <div
      ref={ref}
      className={cx(
        "relative flex items-center gap-1 border-t border-hairline",
        mobile ? "p-3 pb-[calc(12px+env(safe-area-inset-bottom))]" : "p-2",
      )}
    >
      {open && <AccountMenu email={user.email} onClose={() => setOpen(false)} />}
      <button
        type="button"
        title="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className={cx(
          "box-border flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 rounded-sm px-2 py-1.5 text-left",
          row,
          open ? "bg-surface-1" : "hover:bg-surface-1",
        )}
      >
        <Avatar name={user.name} src={user.image ?? undefined} size={mobile ? 32 : 28} />
        <div className="flex min-w-0 flex-1 flex-col text-caption">
          <span className="text-ui text-ink">{user.name}</span>
          <span className="truncate text-ink-tertiary">{user.email}</span>
        </div>
        <Icon name="chevron-down" size={14} className="text-ink-tertiary" />
      </button>
    </div>
  );
}

function SidebarTabs() {
  const { sidebarTab, setSidebarTab } = useShell();
  const opts: ["home" | "ai", IconName, string][] = [
    ["home", "house", "Home"],
    ["ai", "sparkles", "AI"],
  ];
  return (
    <div
      role="tablist"
      aria-label="Sidebar section"
      className="mx-3 mt-2 mb-3 flex flex-none gap-0.5 rounded-md border border-hairline bg-surface-1"
    >
      {opts.map(([id, icon, label]) => {
        const on = sidebarTab === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => setSidebarTab(id)}
            className={cx(
              "inline-flex h-7 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-sm text-small font-medium",
              row,
              on ? "bg-surface-3 text-ink shadow-hairline" : "text-ink-subtle hover:text-ink",
            )}
          >
            <Icon
              name={icon}
              size={14}
              className={on && id === "ai" ? "text-primary" : undefined}
            />
            {label}
          </button>
        );
      })}
    </div>
  );
}

export function DesktopSidebar({ active, data }: { active: NavId; data: ShellData }) {
  const { collapsed, setCollapsed, sidebarTab, setSidebarTab } = useShell();
  const [hover, setHover] = useState(false);
  // The assistant page always shows the chat list.
  useEffect(() => {
    if (active === "assistant" && sidebarTab !== "ai") setSidebarTab("ai");
  }, [active, sidebarTab, setSidebarTab]);
  const expanded = !collapsed;
  return (
    <>
      {collapsed && (
        <div
          className="fixed top-3 left-3 z-21"
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
        >
          <span className="relative inline-flex">
            <span className="inline-flex rounded-sm border border-hairline bg-canvas">
              <IconButton
                icon="panel-left-open"
                title="Show sidebar"
                onClick={() => setCollapsed(false)}
                size={30}
              />
            </span>
            {hover && (
              <div
                role="tooltip"
                className="absolute top-[calc(100%+6px)] left-0 z-22 flex items-center gap-2 rounded-sm border border-hairline-strong bg-surface-3 px-2 py-1.5 whitespace-nowrap"
              >
                <span className="text-caption text-ink">Show sidebar</span>
                <Kbd>Ctrl+B</Kbd>
              </div>
            )}
          </span>
        </div>
      )}
      <div
        className={cx(
          "top-0 left-0 h-screen flex-none overflow-hidden transition-[width] duration-220 ease-standard",
          collapsed ? "fixed z-20 w-0" : "sticky w-[232px]",
        )}
        aria-hidden={!expanded}
      >
        <aside
          inert={!expanded}
          className={cx(
            "box-border flex h-full w-[232px] flex-col border-r border-hairline bg-canvas transition-[transform,opacity] duration-220 ease-standard",
            expanded ? "opacity-100" : "-translate-x-6 opacity-0",
          )}
        >
          <div className="flex h-14 flex-none items-center justify-between pr-3 pl-4">
            <Link
              href="/"
              title="GetEmployed website"
              className="inline-flex text-inherit hover:text-inherit"
            >
              <Wordmark size={16} />
            </Link>
            <IconButton
              icon="panel-left-close"
              title="Collapse sidebar"
              onClick={() => setCollapsed(true)}
            />
          </div>
          {data.locked && <LockedNote />}
          <div
            inert={data.locked}
            className={cx("flex min-h-0 flex-1 flex-col", data.locked && "opacity-40")}
          >
            <SidebarTabs />
            {sidebarTab === "home" ? (
              <HomeNav active={active} draftCount={data.draftCount} />
            ) : (
              <AINav threads={data.threads} groups={data.groups} active={active === "assistant"} />
            )}
          </div>
          <AccountFooter user={data.user} />
        </aside>
      </div>
    </>
  );
}

/** Shown above the navigation while a new account's Job Profile is incomplete. */
function LockedNote() {
  return (
    <div className="mx-3 mb-3 flex gap-2 rounded-md border border-primary-line bg-primary-soft px-3 py-2.5 text-caption text-ink-muted">
      <Icon name="lock" size={14} className="mt-px flex-none text-primary" />
      Finish your Job Profile to unlock the rest of the app.
    </div>
  );
}

export function MobileTabBar({ active, locked }: { active: NavId; locked: boolean }) {
  const { setDrawerOpen } = useShell();
  const inTabs = MOBILE_TABS.some((t) => t.id === active);
  const cell = (on: boolean) =>
    cx(
      "relative flex h-14 min-w-0 flex-1 cursor-pointer flex-col items-center justify-center gap-1 text-micro leading-none font-medium tracking-normal",
      on ? "text-ink hover:text-ink" : "text-ink-subtle hover:text-ink",
    );
  const bar = (
    <span
      aria-hidden="true"
      className="absolute inset-x-[30%] top-0 h-0.5 rounded-b-[2px] bg-primary shadow-glow-underline"
    />
  );
  return (
    <nav
      aria-label="Primary"
      inert={locked}
      className={cx(
        "fixed inset-x-0 bottom-0 z-25 box-border flex border-t border-hairline bg-canvas pb-[env(safe-area-inset-bottom)]",
        locked && "opacity-40",
      )}
    >
      {MOBILE_TABS.map((t) => {
        const on = active === t.id;
        return (
          <Link
            key={t.id}
            href={t.href}
            aria-current={on ? "page" : undefined}
            className={cell(on)}
          >
            {on && bar}
            <Icon name={t.icon} size={20} className={on ? "text-primary" : undefined} />
            {t.label}
          </Link>
        );
      })}
      <button type="button" onClick={() => setDrawerOpen(true)} className={cell(!inTabs)}>
        {!inTabs && bar}
        <Icon name="menu" size={20} className={!inTabs ? "text-primary" : undefined} />
        More
      </button>
    </nav>
  );
}

export function MobileDrawer({ active, data }: { active: NavId; data: ShellData }) {
  const { drawerOpen: open, setDrawerOpen } = useShell();
  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => e.key === "Escape" && setDrawerOpen(false);
    window.addEventListener("keydown", key);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", key);
      document.body.style.overflow = "";
    };
  }, [open, setDrawerOpen]);
  return (
    <>
      <div
        aria-hidden="true"
        onClick={() => setDrawerOpen(false)}
        className={cx(
          "fixed inset-0 z-40 bg-scrim transition-opacity duration-220 ease-standard",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />
      <aside
        aria-label="Navigation"
        inert={!open}
        className={cx(
          "fixed top-0 bottom-0 left-0 z-41 box-border flex w-[min(300px,86vw)] flex-col border-r border-hairline bg-canvas text-ink transition-transform duration-220 ease-standard",
          !open && "-translate-x-full",
        )}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("a")) setDrawerOpen(false);
        }}
      >
        <div className="flex h-14 flex-none items-center justify-between border-b border-hairline pr-2 pl-4">
          <Link href="/" className="inline-flex text-inherit hover:text-inherit">
            <Wordmark size={16} />
          </Link>
          <IconButton icon="x" title="Close menu" onClick={() => setDrawerOpen(false)} size={44} />
        </div>
        <div className="flex flex-1 flex-col overflow-hidden pt-3">
          {data.locked && <LockedNote />}
          <div
            inert={data.locked}
            className={cx("flex min-h-0 flex-1 flex-col", data.locked && "opacity-40")}
          >
            <HomeNav active={active} draftCount={data.draftCount} tall />
          </div>
        </div>
        <AccountFooter user={data.user} mobile />
      </aside>
    </>
  );
}
