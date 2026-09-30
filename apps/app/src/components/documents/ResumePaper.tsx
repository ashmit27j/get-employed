"use client";
import {
  Fragment,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import type { Profile } from "@ge/core";

/**
 * Paginated A4 resume preview (ResumePaper in prototype/ge-app.js). Blocks are measured off-screen
 * and flowed onto 595×842 pages, then the page is scaled to the container width. `maxPages`
 * shrinks the type (down to 78%) to fit. Sizes here are document typography in A4 points, not UI.
 */

type Head = "rule" | "smallcaps" | "plain" | "bar";
interface TemplateStyle {
  font: string;
  align: "center" | "left" | "split";
  nameSize: number;
  head: Head;
  fs: number;
}
export const TEMPLATE_STYLE: Record<string, TemplateStyle> = {
  classic: { font: "var(--font-text)", align: "center", nameSize: 18, head: "rule", fs: 9.5 },
  latex: {
    font: "'CMU Serif','Latin Modern Roman','Computer Modern',Georgia,'Times New Roman',serif",
    align: "center",
    nameSize: 21,
    head: "smallcaps",
    fs: 10,
  },
  compact: { font: "var(--font-text)", align: "split", nameSize: 15, head: "plain", fs: 8.6 },
  modern: { font: "var(--font-text)", align: "left", nameSize: 22, head: "bar", fs: 9.5 },
};
const PAPER = { W: 595, H: 842, px: 44, py: 40 };
const INK = "var(--color-paper-ink)";
const MUTED = "var(--color-ink-tertiary)";
const RULE = "var(--color-paper-rule)";
const HIGHLIGHT: CSSProperties = {
  background: "var(--color-glow-soft)",
  boxShadow: "inset 0 -1px 0 var(--color-primary)",
};

interface Block {
  k: string;
  n: ReactNode;
}

function blocks(d: Profile, id: string, t: TemplateStyle, hi: Set<string>): Block[] {
  const f = t.fs;
  const c = d.contact;
  const line = [c.email, c.phone, c.loc, ...c.links].filter(Boolean).join(" · ");
  const head =
    t.align === "split" ? (
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: 12,
          borderBottom: `1px solid ${RULE}`,
          paddingBottom: 6,
        }}
      >
        <span style={{ fontSize: t.nameSize, fontWeight: 600 }}>{c.name}</span>
        <span style={{ color: MUTED, textAlign: "right", maxWidth: "62%" }}>{line}</span>
      </div>
    ) : (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 3,
          textAlign: t.align === "left" ? "left" : "center",
        }}
      >
        <span
          style={{
            fontSize: t.nameSize,
            fontWeight: id === "latex" ? 500 : 600,
            letterSpacing: id === "modern" ? "-0.5px" : "-0.2px",
          }}
        >
          {c.name}
        </span>
        <span style={{ color: MUTED }}>{line}</span>
      </div>
    );
  const H2 = (txt: string) => {
    const base: CSSProperties = { marginTop: id === "compact" ? 4 : 8 };
    if (t.head === "rule")
      return (
        <div
          style={{
            ...base,
            fontWeight: 600,
            letterSpacing: "0.5px",
            textTransform: "uppercase",
            fontSize: f * 0.95,
            borderBottom: `1px solid ${RULE}`,
            paddingBottom: 2,
          }}
        >
          {txt}
        </div>
      );
    if (t.head === "smallcaps")
      return (
        <div
          style={{
            ...base,
            fontVariant: "small-caps",
            fontSize: f * 1.3,
            letterSpacing: "0.3px",
            borderBottom: `0.75px solid ${INK}`,
            paddingBottom: 1,
          }}
        >
          {txt.toLowerCase()}
        </div>
      );
    if (t.head === "bar")
      return (
        <div
          style={{
            ...base,
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontWeight: 600,
            fontSize: f * 1.1,
          }}
        >
          <span style={{ width: 14, height: 2, background: INK }} />
          {txt.charAt(0) + txt.slice(1).toLowerCase()}
        </div>
      );
    return (
      <div
        style={{
          ...base,
          fontWeight: 600,
          letterSpacing: "0.6px",
          textTransform: "uppercase",
          fontSize: f * 0.9,
          color: MUTED,
        }}
      >
        {txt}
      </div>
    );
  };
  const row = (l: ReactNode, r: ReactNode) => (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
      {l}
      <span style={{ whiteSpace: "nowrap", color: id === "modern" ? MUTED : "inherit" }}>{r}</span>
    </div>
  );
  const clean = (bs: string[]) => bs.filter((b) => b.trim());
  const bullets = (bs: string[]) =>
    clean(bs).map((b, i) => (
      <div key={i} style={{ display: "grid", gridTemplateColumns: "10px 1fr" }}>
        <span>•</span>
        <span style={hi.has(b) ? HIGHLIGHT : undefined}>{b}</span>
      </div>
    ));
  const stack = (children: ReactNode) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>{children}</div>
  );

  const B: Block[] = [{ k: "head", n: head }];
  const add = (k: string, n: ReactNode) => B.push({ k, n });
  if (d.summary.trim()) {
    add("h-sum", H2("SUMMARY"));
    add(
      "sum",
      <span style={{ textWrap: "pretty", ...(hi.has(d.summary) ? HIGHLIGHT : {}) }}>
        {d.summary}
      </span>,
    );
  }
  if (d.education.length) {
    add("h-edu", H2("EDUCATION"));
    d.education.forEach((e, i) =>
      add(
        `e${i}`,
        row(
          <span>
            <b>{e.school}</b> · {e.degree}
            {e.score ? ` · ${e.score}` : ""}
          </span>,
          e.dates,
        ),
      ),
    );
  }
  if (d.experience.length) {
    add("h-exp", H2("EXPERIENCE"));
    d.experience.forEach((x, i) =>
      add(
        `x${i}`,
        stack(
          <>
            {row(<b>{[x.role, x.co].filter(Boolean).join(", ")}</b>, x.dates)}
            {bullets(x.bullets)}
          </>,
        ),
      ),
    );
  }
  if (d.projects.length) {
    add("h-proj", H2("PROJECTS"));
    d.projects.forEach((x, i) =>
      add(
        `p${i}`,
        stack(
          <>
            <span>
              <b>{x.name}</b>
              {x.stack ? ` · ${x.stack}` : ""}
            </span>
            {bullets(x.bullets)}
          </>,
        ),
      ),
    );
  }
  const skills = d.skills.filter((g) => g.items.length);
  if (skills.length) {
    add("h-sk", H2("SKILLS"));
    skills.forEach(({ name, items }, i) => {
      const text = items.join(", ");
      add(
        `s${i}`,
        <span style={hi.has(`${name}: ${text}`) ? HIGHLIGHT : undefined}>
          <b>{name}: </b>
          {text}
        </span>,
      );
    });
  }
  const certs = d.certifications.filter((x) => x.name);
  if (certs.length) {
    add("h-cert", H2("CERTIFICATIONS"));
    certs.forEach((x, i) =>
      add(
        `c${i}`,
        row(
          <span>
            <b>{x.name}</b>
            {x.issuer ? ` · ${x.issuer}` : ""}
          </span>,
          x.date,
        ),
      ),
    );
  }
  const ach = clean(d.achievements);
  if (ach.length) {
    add("h-ach", H2("ACHIEVEMENTS"));
    ach.forEach((a, i) => add(`a${i}`, bullets([a])[0]));
  }
  if (d.leadership.length) {
    add("h-lead", H2("LEADERSHIP & ACTIVITIES"));
    d.leadership.forEach((x, i) =>
      add(
        `l${i}`,
        stack(
          <>
            {row(<b>{x.role + (x.org ? `, ${x.org}` : "")}</b>, x.dates)}
            {bullets(x.bullets)}
          </>,
        ),
      ),
    );
  }
  return B;
}

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    setW(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

export function ResumePaper({
  doc,
  template = "classic",
  maxPages,
  thumb,
  crop = 0.58,
  highlights,
  onPages,
  gap = 16,
}: {
  doc: Profile;
  template?: string;
  maxPages?: number;
  /** First page only, cropped to `crop` of its height (cards). */
  thumb?: boolean;
  crop?: number;
  /** Texts to highlight (accepted rewrites). */
  highlights?: string[];
  onPages?: (n: number) => void;
  gap?: number;
}) {
  const t = TEMPLATE_STYLE[template] ?? TEMPLATE_STYLE.classic!;
  const [ref, w] = useWidth<HTMLDivElement>();
  const measure = useRef<HTMLDivElement>(null);
  const g = template === "compact" ? 4 : 6;
  const hi = new Set(highlights ?? []);
  const B = blocks(doc, template, t, hi);
  const key = `${template}|${maxPages ?? 0}|${JSON.stringify(doc)}|${[...hi].join("¦")}`;
  const [lay, setLay] = useState<{ key: string | null; fs: number; pages: number[][] | null }>({
    key: null,
    fs: 1,
    pages: null,
  });
  const fsNow = lay.key === key ? lay.fs : 1;

  useLayoutEffect(() => {
    const el = measure.current;
    if (!el) return;
    const kids = [...el.children] as HTMLElement[];
    const inner = PAPER.H - 2 * PAPER.py;
    const pages: number[][] = [[]];
    let y = 0;
    kids.forEach((k, i) => {
      const cur = pages[pages.length - 1]!;
      const h = k.offsetHeight;
      // Keep a heading with the block after it.
      const next = k.dataset.head != null && kids[i + 1] ? kids[i + 1]!.offsetHeight + g : 0;
      const need = h + (cur.length ? g : 0);
      if (cur.length && y + need + next > inner) {
        pages.push([i]);
        y = h;
      } else {
        cur.push(i);
        y += need;
      }
    });
    if (maxPages && pages.length > maxPages && fsNow > 0.78) {
      setLay({ key, fs: +(fsNow - 0.04).toFixed(2), pages: null });
      return;
    }
    if (lay.key !== key || JSON.stringify(lay.pages) !== JSON.stringify(pages))
      setLay({ key, fs: fsNow, pages });
  }, [key, fsNow, maxPages, g, lay.key, lay.pages]);

  const pages = lay.key === key && lay.pages ? lay.pages : [B.map((_, i) => i)];
  useEffect(() => {
    onPages?.(pages.length);
  }, [pages.length, onPages]);

  const s = w ? w / PAPER.W : 0;
  const base: CSSProperties = {
    boxSizing: "border-box",
    background: "var(--color-paper)",
    color: INK,
    fontFamily: t.font,
    fontSize: t.fs * fsNow,
    lineHeight: 1.42,
    display: "flex",
    flexDirection: "column",
    gap: g,
  };
  const show = thumb ? pages.slice(0, 1) : pages;
  return (
    <div ref={ref} className="relative flex w-full flex-col" style={{ gap }} data-resume-paper="">
      <div aria-hidden="true" className="absolute size-0 overflow-hidden">
        <div ref={measure} style={{ ...base, width: PAPER.W - 2 * PAPER.px, visibility: "hidden" }}>
          {B.map((b) => (
            <div key={b.k} data-head={b.k.startsWith("h-") ? "" : undefined}>
              {b.n}
            </div>
          ))}
        </div>
      </div>
      {show.map((ids, pi) => (
        <div
          key={pi}
          className="relative w-full overflow-hidden bg-paper"
          style={{
            height: PAPER.H * s * (thumb ? crop : 1),
            borderRadius: thumb ? "var(--radius-sm) var(--radius-sm) 0 0" : "var(--radius-md)",
          }}
          data-resume-page=""
        >
          {s > 0 && (
            <div
              style={{
                ...base,
                position: "absolute",
                left: 0,
                top: 0,
                width: PAPER.W,
                height: PAPER.H,
                padding: `${PAPER.py}px ${PAPER.px}px`,
                overflow: "hidden",
                transform: `scale(${s})`,
                transformOrigin: "0 0",
              }}
            >
              {ids.map((i) => (
                <Fragment key={B[i]!.k}>
                  <div>{B[i]!.n}</div>
                </Fragment>
              ))}
            </div>
          )}
          {!thumb && show.length > 1 && (
            <span className="absolute right-2.5 bottom-2 font-mono text-micro text-ink-tertiary">
              {pi + 1} / {show.length}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
