"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { NAV_HOME_COOKIE } from "./nav";

/** Per-device UI state for the app shell. Persisted in localStorage (docs/data-model.md). */
interface ShellState {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  sidebarTab: "home" | "ai";
  setSidebarTab: (v: "home" | "ai") => void;
  drawerOpen: boolean;
  setDrawerOpen: (v: boolean) => void;
  dockOpen: boolean;
  setDockOpen: (v: boolean) => void;
  dockWidth: number;
  setDockWidth: (v: number) => void;
  /** Disables the assistant (e.g. during a live interview). */
  assistantDisabled: boolean;
  setAssistantDisabled: (v: boolean) => void;
  /** Collapses the sidebar for a focused session without saving it; off restores the saved state. */
  setFocusMode: (on: boolean) => void;
}

const Ctx = createContext<ShellState | null>(null);

export const DOCK = { initial: 400, min: 320, max: 720 };
const KEYS = { collapsed: "ge-sidebar-collapsed", tab: "ge-sidebar-tab", dock: "ge-dock-width" };

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Private mode or blocked storage: the UI still works, it just doesn't remember.
  }
}

/** A localStorage-backed value that is SSR-safe and shared across hook instances. */
function useStored<T>(key: string, parse: (raw: string | null) => T): [T, (v: T) => void] {
  const subscribe = useCallback(
    (cb: () => void) => {
      const on = (e: Event) => {
        if (!(e instanceof StorageEvent) || e.key === key) cb();
      };
      window.addEventListener("storage", on);
      window.addEventListener(`ge-store:${key}`, on);
      return () => {
        window.removeEventListener("storage", on);
        window.removeEventListener(`ge-store:${key}`, on);
      };
    },
    [key],
  );
  const raw = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => null,
  );
  const value = useMemo(() => parse(raw), [raw, parse]);
  const set = useCallback(
    (v: T) => {
      write(key, typeof v === "string" ? v : JSON.stringify(v));
      window.dispatchEvent(new Event(`ge-store:${key}`));
    },
    [key],
  );
  return [value, set];
}

const parseBool = (raw: string | null) => raw === "true" || raw === "1";
const parseTab = (raw: string | null): "home" | "ai" => (raw === "ai" ? "ai" : "home");
const parseWidth = (raw: string | null) => {
  const n = Number(raw);
  return n ? Math.min(DOCK.max, Math.max(DOCK.min, n)) : DOCK.initial;
};

export function ShellProvider({ children }: { children: ReactNode }) {
  const [storedCollapsed, setStoredCollapsed] = useStored(KEYS.collapsed, parseBool);
  // A session's collapse lives only in memory, so a reload or closed tab never leaves it stuck.
  const [override, setOverride] = useState<boolean | null>(null);
  const collapsed = override ?? storedCollapsed;
  const setCollapsed = useCallback(
    (v: boolean) => (override != null ? setOverride(v) : setStoredCollapsed(v)),
    [override, setStoredCollapsed],
  );
  const setFocusMode = useCallback((on: boolean) => setOverride(on ? true : null), []);
  const [sidebarTab, setSidebarTab] = useStored(KEYS.tab, parseTab);
  // Arriving from `/` while signed in (proxy.ts) always opens on the Home tab.
  useEffect(() => {
    if (!document.cookie.split("; ").includes(`${NAV_HOME_COOKIE}=1`)) return;
    document.cookie = `${NAV_HOME_COOKIE}=; path=/; max-age=0`;
    setSidebarTab("home");
  }, [setSidebarTab]);
  const [dockWidth, setWidth] = useStored(KEYS.dock, parseWidth);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dockOpen, setDockOpenRaw] = useState(false);
  const [assistantDisabled, setAssistantDisabled] = useState(false);

  const setDockOpen = useCallback(
    (v: boolean) => {
      if (v && assistantDisabled) return;
      setDockOpenRaw(v);
      // Opening the dock collapses the sidebar to make room (prototype behaviour).
      if (v) setCollapsed(true);
    },
    [assistantDisabled, setCollapsed],
  );
  const setDockWidth = useCallback(
    (v: number) => setWidth(Math.min(DOCK.max, Math.max(DOCK.min, Math.round(v)))),
    [setWidth],
  );

  const value = useMemo<ShellState>(
    () => ({
      collapsed,
      setCollapsed,
      sidebarTab,
      setSidebarTab,
      drawerOpen,
      setDrawerOpen,
      // A disabled assistant hides the dock without forgetting it was open.
      dockOpen: dockOpen && !assistantDisabled,
      setDockOpen,
      dockWidth,
      setDockWidth,
      assistantDisabled,
      setAssistantDisabled,
      setFocusMode,
    }),
    [
      collapsed,
      setCollapsed,
      sidebarTab,
      setSidebarTab,
      drawerOpen,
      dockOpen,
      setDockOpen,
      dockWidth,
      setDockWidth,
      assistantDisabled,
      setFocusMode,
    ],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useShell(): ShellState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useShell must be used inside <ShellProvider>");
  return v;
}

const MOBILE_QUERY = "(max-width: 767px)";
function subscribeMobile(cb: () => void) {
  const mq = window.matchMedia(MOBILE_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
/** True under 768px, where the app switches to the tab bar and drawer. */
export function useIsMobile(): boolean {
  return useSyncExternalStore(
    subscribeMobile,
    () => window.matchMedia(MOBILE_QUERY).matches,
    () => false,
  );
}
