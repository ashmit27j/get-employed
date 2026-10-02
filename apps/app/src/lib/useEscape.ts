"use client";
import { useEffect, useRef } from "react";

/** Calls onEscape when Escape is pressed while `active` (popover menus whose focus stays on the trigger). */
export function useEscape(active: boolean, onEscape: () => void) {
  const latest = useRef(onEscape);
  useEffect(() => {
    latest.current = onEscape;
  });
  useEffect(() => {
    if (!active) return;
    const key = (e: KeyboardEvent) => e.key === "Escape" && latest.current();
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [active]);
}
