"use client";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";
import { cx } from "../lib/cx";
import { Button } from "./Button";
import { Wordmark } from "./Foundations";
import { UiLink } from "./Link";

const reducedMotion = () =>
  typeof window !== "undefined" &&
  !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export interface NavLink {
  label: string;
  href: string;
}

/** Sticky 56px marketing nav. The active link gets the blue underline with glow. */
export function TopNav({
  links,
  active,
  homeHref = "/",
  signInHref,
  ctaHref,
  signInLabel = "Sign in",
  ctaLabel = "Get started",
}: {
  links: NavLink[];
  active?: string;
  homeHref?: string;
  signInHref: string;
  ctaHref: string;
  signInLabel?: string;
  ctaLabel?: string;
}) {
  return (
    <header className="sticky top-0 z-10 h-(--nav-height) border-b border-hairline bg-canvas">
      <div className="mx-auto box-border flex h-full max-w-page items-center gap-6 px-(--gutter)">
        <UiLink href={homeHref} aria-label="GetEmployed home" className="flex">
          <Wordmark size={17} />
        </UiLink>
        <nav aria-label="Main" className="flex flex-1 justify-center gap-1 max-lg:hidden">
          {links.map((l) => {
            const on = active === l.label;
            return (
              <UiLink
                key={l.label}
                href={l.href}
                aria-current={on ? "page" : undefined}
                className={cx(
                  "relative rounded-md px-2.5 py-2 text-small leading-none whitespace-nowrap hover:text-ink",
                  on ? "text-ink" : "text-ink-subtle",
                )}
              >
                {l.label}
                {on && (
                  <span className="absolute inset-x-2.5 -bottom-[11px] h-px bg-primary shadow-glow-underline" />
                )}
              </UiLink>
            );
          })}
        </nav>
        <div className="ml-auto flex gap-2">
          <Button variant="secondary" href={signInHref}>
            {signInLabel}
          </Button>
          <Button href={ctaHref}>{ctaLabel}</Button>
        </div>
      </div>
    </header>
  );
}

export interface FooterColumn {
  title: string;
  links: NavLink[];
}

const GITHUB_PATH =
  "M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4M9 18c-4.51 2-5-2-7-2";

export function GitHubMark({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={GITHUB_PATH} />
    </svg>
  );
}

export function Footer({
  columns,
  note = "© 2026 GetEmployed",
  githubUrl,
  logo,
}: {
  columns: FooterColumn[];
  note?: ReactNode;
  githubUrl?: string;
  /** Brand block; defaults to the Wordmark. The site passes the supplied wordmark artwork. */
  logo?: ReactNode;
}) {
  return (
    <footer className="border-t border-hairline px-8 py-16 text-caption text-ink-subtle">
      <div
        className="mx-auto grid max-w-page gap-8 max-lg:grid-cols-2!"
        style={{
          gridTemplateColumns: `minmax(160px,1.4fr) repeat(${columns.length},minmax(0,1fr))`,
        }}
      >
        <div className="flex flex-col gap-3">
          {logo ?? <Wordmark size={15} />}
          <span>{note}</span>
          {githubUrl && (
            <a
              href={githubUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-fit items-center gap-2 text-ink-subtle"
            >
              <GitHubMark />
              Star on GitHub
            </a>
          )}
        </div>
        {columns.map((c) => (
          <div key={c.title} className="flex flex-col gap-2.5">
            <span className="font-medium text-ink">{c.title}</span>
            {c.links.map((l) => {
              const external = /^https?:/.test(l.href);
              return (
                <UiLink
                  key={l.label}
                  href={l.href}
                  target={external ? "_blank" : undefined}
                  rel={external ? "noreferrer" : undefined}
                  className="w-fit text-ink-subtle"
                >
                  {l.label}
                </UiLink>
              );
            })}
          </div>
        ))}
      </div>
    </footer>
  );
}

function useInView(ref: RefObject<HTMLElement | null>, onEnter: () => void, amount = 0.15) {
  const latest = useRef(onEnter);
  useEffect(() => {
    latest.current = onEnter;
  });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          latest.current();
        }
      },
      { threshold: amount },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, amount]);
}

const noSubscribe = () => () => {};
/** True once running in the browser (false on the server and during hydration). */
function useHydrated(): boolean {
  return useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  );
}

/** Entrance: 32px rise, 8px blur → 0 over 1000ms ease-out-expo when scrolled into view. */
export function Reveal({
  children,
  delay = 0,
  y = 32,
  className,
  style,
}: {
  children: ReactNode;
  /** Seconds. */
  delay?: number;
  y?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // Visible on the server and for reduced motion; hidden only once we know we'll animate.
  const armed = useHydrated() && !reducedMotion();
  useInView(ref, () => {
    if (reducedMotion()) return;
    ref.current?.animate(
      [
        { opacity: 0, transform: `translateY(${y}px) scale(.98)`, filter: "blur(8px)" },
        { opacity: 1, transform: "none", filter: "blur(0px)" },
      ],
      { duration: 1000, delay: delay * 1000, easing: "cubic-bezier(0.16,1,0.3,1)", fill: "both" },
    );
  });
  return (
    <div ref={ref} className={className} style={{ opacity: armed ? 0 : 1, ...style }}>
      {children}
    </div>
  );
}

/** Marker wipe behind a phrase ("for engineers") once it is fully in view. */
export function Highlight({ children, delay = 450 }: { children: ReactNode; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [on, setOn] = useState(false);
  useInView(
    ref,
    () => {
      if (reducedMotion()) setOn(true);
      else setTimeout(() => setOn(true), delay);
    },
    1,
  );
  return (
    <span
      ref={ref}
      className="-mx-1 rounded-[2px] bg-[linear-gradient(var(--color-selection),var(--color-selection))] bg-left bg-no-repeat px-1 transition-[background-size] duration-700 ease-wipe"
      style={{ backgroundSize: `${on ? 100 : 0}% 100%` }}
    >
      {children}
    </span>
  );
}

/** 2px reading-progress bar pinned to the top of the page. */
export function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let frame = 0;
    const run = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (ref.current)
        ref.current.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
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
  }, []);
  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-100 h-0.5 origin-left scale-x-0 bg-primary shadow-glow-underline"
    />
  );
}
