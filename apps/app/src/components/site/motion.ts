"use client";
import { useEffect, useSyncExternalStore, type RefObject } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && !!window.matchMedia?.(QUERY).matches;
}

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

/** Tracks prefers-reduced-motion. False during server render. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, prefersReducedMotion, () => false);
}

/** Runs `fn` on scroll and resize (once per frame). Skipped entirely for reduced motion. */
export function useScrollFx<T extends HTMLElement>(
  ref: RefObject<T | null>,
  fn: (el: T, rect: DOMRect, viewportHeight: number) => void,
) {
  useEffect(() => {
    if (prefersReducedMotion()) return;
    let frame = 0;
    const run = () => {
      frame = 0;
      const el = ref.current;
      if (el) fn(el, el.getBoundingClientRect(), window.innerHeight);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(run);
    };
    run();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(frame);
    };
    // The effect is set up once; `fn` only reads the element and window.
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
