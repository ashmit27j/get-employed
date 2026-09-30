"use client";
import { useCallback, useMemo, useSyncExternalStore } from "react";

/** A small JSON value in localStorage (per-device UI state), shared between components. */
export function useStoredJson<T>(key: string, fallback: T): [T, (v: T) => void] {
  const subscribe = useCallback(
    (cb: () => void) => {
      window.addEventListener(`ge-store:${key}`, cb);
      window.addEventListener("storage", cb);
      return () => {
        window.removeEventListener(`ge-store:${key}`, cb);
        window.removeEventListener("storage", cb);
      };
    },
    [key],
  );
  const raw = useSyncExternalStore(
    subscribe,
    () => {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    () => null,
  );
  const value = useMemo<T>(() => {
    if (!raw) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
    // `fallback` is a literal at each call site; re-parsing only when the stored string changes is enough.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raw]);
  const set = useCallback(
    (v: T) => {
      try {
        localStorage.setItem(key, JSON.stringify(v));
      } catch {
        // Storage unavailable: keep working without persistence.
      }
      window.dispatchEvent(new Event(`ge-store:${key}`));
    },
    [key],
  );
  return [value, set];
}
