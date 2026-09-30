"use client";
import { useCallback, useSyncExternalStore } from "react";

export type ThemeChoice = "dark" | "light" | "system";
const KEY = "ge-theme";
const EVENT = "ge-theme";

/** Runs in <head> before first paint so the page never flashes the wrong theme. */
export const THEME_SCRIPT = `try{var t=localStorage.getItem("${KEY}")||"dark";if(t==="system")t=matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";document.documentElement.dataset.theme=t}catch(e){}`;

function read(): ThemeChoice {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "system" ? v : "dark";
  } catch {
    return "dark";
  }
}

function apply(choice: ThemeChoice) {
  const light =
    choice === "light" ||
    (choice === "system" && matchMedia("(prefers-color-scheme: light)").matches);
  document.documentElement.dataset.theme = light ? "light" : "dark";
}

function subscribe(cb: () => void) {
  const mq = matchMedia("(prefers-color-scheme: light)");
  const onSystem = () => {
    if (read() === "system") apply("system");
    cb();
  };
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  mq.addEventListener("change", onSystem);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
    mq.removeEventListener("change", onSystem);
  };
}

/** The saved theme choice (per device) and a setter that applies it immediately. */
export function useTheme(): [ThemeChoice, (t: ThemeChoice) => void] {
  const choice = useSyncExternalStore(subscribe, read, () => "dark" as const);
  const set = useCallback((t: ThemeChoice) => {
    try {
      localStorage.setItem(KEY, t);
    } catch {
      // Blocked storage: the change still applies for this page.
    }
    apply(t);
    window.dispatchEvent(new Event(EVENT));
  }, []);
  return [choice, set];
}
