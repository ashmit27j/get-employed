"use client";
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "./motion";

/**
 * Isometric line drawings for the six "How it works" steps (prototype/marketing/Figures.jsx).
 * Hairline strokes with one primary-stroked element; they rise on hover and parallax with the mouse.
 */

type Point = [number, number, number];
const iso = (x: number, y: number, z: number): [number, number] => [
  (x - y) * 0.866,
  (x + y) * 0.5 - z,
];
const pts = (a: Point[]) =>
  a
    .map((p) =>
      iso(...p)
        .map((n) => n.toFixed(1))
        .join(","),
    )
    .join(" ");

type Box = {
  t: "box";
  x: number;
  y: number;
  z: number;
  w: number;
  d: number;
  h: number;
  k: number;
  hi?: boolean;
};
type Ell = { t: "ell"; z: number; r: number; k: number; hi?: boolean; fill?: boolean };
type Line = { t: "ln"; a: Point; b: Point; k: number; hi?: boolean };
type Item = Box | Ell | Line;

const box = (
  x: number,
  y: number,
  z: number,
  w: number,
  d: number,
  h: number,
  k: number,
  hi?: boolean,
): Box => ({
  t: "box",
  x,
  y,
  z,
  w,
  d,
  h,
  k,
  hi,
});
const ell = (z: number, r: number, k: number, hi?: boolean, fill?: boolean): Ell => ({
  t: "ell",
  z,
  r,
  k,
  hi,
  fill,
});
const ln = (a: Point, b: Point, k: number, hi?: boolean): Line => ({ t: "ln", a, b, k, hi });

export type StepKind = "search" | "match" | "tailor" | "outreach" | "track" | "practice";

const SCENES: Record<StepKind, (s: number) => Item[]> = {
  search: (s) => {
    const it: Item[] = [];
    for (let i = 0; i < 6; i++)
      it.push(box(-50, -50, i * (7 + 5 * s), 100, 100, 3, 2 + i * 2, i === 5));
    const top = 5 * (7 + 5 * s) + 3;
    it.push(ell(top + 14 + 16 * s, 32, 16, true), ell(top + 14 + 16 * s, 20, 18, true));
    return it;
  },
  match: (s) => [
    box(-44, -44, 18 + 30 * s, 38, 38, 38, 16, true),
    box(6, -44, 0, 38, 38, 38, 6),
    box(-44, 6, 0, 38, 38, 38, 6),
    box(6, 6, -6 * s, 38, 38, 38, 3),
  ],
  tailor: (s) => {
    const it: Item[] = [box(-55, -40, 0, 110, 80, 4, 3)];
    for (let i = 0; i < 4; i++)
      it.push(ln([-45, -28 + i * 16, 4], [40 - (i % 2) * 28, -28 + i * 16, 4], 3));
    const z = 30 + 22 * s;
    it.push(box(-45, -50, z, 110, 80, 4, 14, true));
    for (let i = 0; i < 4; i++)
      it.push(ln([-35, -38 + i * 16, z + 4], [55 - (i % 2) * 18, -38 + i * 16, z + 4], 14, true));
    return it;
  },
  outreach: (s) => {
    const it: Item[] = [];
    for (let i = 0; i < 10; i++)
      it.push(box(-60 + i * (12 + 4 * s), -40, 0, 2, 80, 85 - i * 7, 14 - i * 1.2, i === 0));
    return it;
  },
  track: (s) =>
    [28, 46, 36, 64, 22].map((h, i) =>
      box(-75 + i * 30, -20, 0, 20, 40, h * (1 + 0.35 * s), 4 + i * 2.5, i === 3),
    ),
  practice: (s) => {
    const it: Item[] = [];
    [76, 60, 44, 28].forEach((r, i) =>
      it.push(ell(-(3 - i) * 6 * s, r * (1 + 0.12 * s), 2 + i * 3, false, i === 3)),
    );
    it.push(box(-12, -12, 0, 24, 24, 36 + 24 * s, 16, true));
    return it;
  },
};

function Shape({ it, mx, my, on }: { it: Item; mx: number; my: number; on: boolean }) {
  const transform = `translate(${(mx * it.k).toFixed(2)} ${(my * it.k).toFixed(2)})`;
  const stroke = it.hi
    ? "var(--color-primary)"
    : on
      ? "var(--color-ink-subtle)"
      : "var(--color-ink-tertiary)";
  const base = {
    stroke,
    strokeWidth: 1,
    strokeLinejoin: "round" as const,
    transition: "stroke .3s",
  };
  if (it.t === "box") {
    const { x, y, z, w, d, h } = it;
    const top = pts([
      [x, y, z + h],
      [x + w, y, z + h],
      [x + w, y + d, z + h],
      [x, y + d, z + h],
    ]);
    const left = pts([
      [x, y + d, z],
      [x + w, y + d, z],
      [x + w, y + d, z + h],
      [x, y + d, z + h],
    ]);
    const right = pts([
      [x + w, y, z],
      [x + w, y + d, z],
      [x + w, y + d, z + h],
      [x + w, y, z + h],
    ]);
    return (
      <g transform={transform} style={base}>
        <polygon points={left} fill="var(--color-canvas)" />
        <polygon points={right} fill="var(--color-canvas)" />
        <polygon points={top} fill={it.hi ? "var(--color-surface-2)" : "var(--color-surface-1)"} />
      </g>
    );
  }
  if (it.t === "ell") {
    const [cx, cy] = iso(0, 0, it.z);
    return (
      <ellipse
        transform={transform}
        cx={cx}
        cy={cy}
        rx={it.r * 1.2247}
        ry={it.r * 0.7071}
        style={base}
        fill={it.fill ? "var(--color-canvas)" : "none"}
      />
    );
  }
  const [x1, y1] = iso(...it.a);
  const [x2, y2] = iso(...it.b);
  return (
    <line transform={transform} x1={x1} y1={y1} x2={x2} y2={y2} style={{ ...base, opacity: 0.8 }} />
  );
}

/** Eases mouse offset (mx, my in -1..1) and the hover amount (s) towards their targets. */
function useMouseLerp(ref: React.RefObject<HTMLDivElement | null>, active: boolean) {
  const [v, setV] = useState({ mx: 0, my: 0, s: 0 });
  const target = useRef({ mx: 0, my: 0, s: 0 });
  const cur = useRef({ mx: 0, my: 0, s: 0 });
  const raf = useRef(0);
  const kick = useRef(() => {});
  useEffect(() => {
    const tick = () => {
      const c = cur.current;
      const t = target.current;
      let moving = false;
      for (const k of ["mx", "my", "s"] as const) {
        const d = t[k] - c[k];
        if (Math.abs(d) > 0.002) {
          c[k] += d * 0.1;
          moving = true;
        } else c[k] = t[k];
      }
      setV({ ...c });
      raf.current = moving ? requestAnimationFrame(tick) : 0;
    };
    kick.current = () => {
      if (!raf.current) raf.current = requestAnimationFrame(tick);
    };
    const host = ref.current?.closest("[data-step]");
    if (!host || prefersReducedMotion()) return;
    const move = (e: Event) => {
      const { clientX, clientY } = e as MouseEvent;
      const r = host.getBoundingClientRect();
      target.current.mx = clamp((clientX - (r.left + r.width / 2)) / (r.width / 2));
      target.current.my = clamp((clientY - (r.top + r.height / 2)) / (r.height / 2));
      kick.current();
    };
    const out = () => {
      target.current.mx = 0;
      target.current.my = 0;
      kick.current();
    };
    host.addEventListener("mousemove", move);
    host.addEventListener("mouseleave", out);
    return () => {
      host.removeEventListener("mousemove", move);
      host.removeEventListener("mouseleave", out);
      cancelAnimationFrame(raf.current);
      raf.current = 0;
    };
  }, [ref]);
  useEffect(() => {
    target.current.s = active ? 1 : 0;
    if (prefersReducedMotion()) {
      cur.current.s = target.current.s;
      setV({ ...cur.current });
    } else kick.current();
  }, [active]);
  return v;
}
const clamp = (n: number) => Math.max(-1, Math.min(1, n));

export function StepFigure({ kind, active }: { kind: StepKind; active: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const { mx, my, s } = useMouseLerp(ref, active);
  const items = SCENES[kind](s);
  return (
    <div ref={ref} className="flex h-[210px] items-center justify-center">
      <svg
        viewBox="-125 -150 250 220"
        className="h-full w-full max-w-[280px] overflow-visible"
        aria-hidden="true"
      >
        {items.map((it, i) => (
          <Shape key={i} it={it} mx={mx} my={my} on={active} />
        ))}
      </svg>
    </div>
  );
}
