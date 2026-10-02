"use client";
import { Fragment, useEffect, useRef, useState } from "react";
import { Button, Icon, StatusBadge, Tag, TextInput } from "@ge/ui";
import { CHIP_TYPE_LABEL, parseSearchQuery } from "@ge/core";
import { SIGN_UP_URL } from "@/lib/site";
import { Rule } from "./Frame";
import { useReducedMotion, useScrollFx } from "./motion";

/**
 * "Unemployed? Let's fix that." wipes in, then wipes out and lands on
 * "Get employed. Skip the legwork." Screen readers get one stable label.
 */
function HeroHeadline() {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const a = setTimeout(() => setPhase(1), 5500);
    const b = setTimeout(() => setPhase(2), 6200);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, []);
  const out = phase === 1 ? " ge-wipeout" : "";
  return (
    <h1
      aria-label="Unemployed? Get employed and skip the legwork."
      className="m-0 flex max-w-[900px] flex-col items-start text-hero font-semibold max-lg:text-[clamp(44px,7.5vw,80px)] max-lg:tracking-[clamp(-3px,-0.036em,-1.4px)]"
    >
      {phase < 2 ? (
        <Fragment key="a">
          <span
            aria-hidden="true"
            className={`ge-wipe${out}`}
            style={{ animationDelay: phase ? "0s" : "0.1s" }}
          >
            <span className="ge-un">Un</span>
            <span className="ge-sel">employed</span>?
          </span>
          <span
            aria-hidden="true"
            className={`ge-wipe${out}`}
            style={{ animationDelay: phase ? "0.08s" : "0.9s" }}
          >
            Let&apos;s fix that.
          </span>
        </Fragment>
      ) : (
        <Fragment key="b">
          <span aria-hidden="true" className="ge-wipe" style={{ animationDelay: "0s" }}>
            Get{" "}
            <span className="ge-sel" style={{ animationDelay: "0.9s" }}>
              employed
            </span>
            .
          </span>
          <span aria-hidden="true" className="ge-wipe" style={{ animationDelay: "0.3s" }}>
            Skip the legwork.
          </span>
        </Fragment>
      )}
    </h1>
  );
}

const EXAMPLES = [
  "React internships in Bengaluru, remote-friendly",
  "Backend roles in Pune, 12 LPA+, 2 years of Go",
  "Data analyst, fresher, Hyderabad or remote",
];

/** The hero search is the demo: it types examples and parses them into filter chips live. */
function HeroSearch() {
  const reduced = useReducedMotion();
  const [q, setQ] = useState("");
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    if (!auto || reduced) return;
    let ex = 0;
    let i = 0;
    let t: ReturnType<typeof setTimeout>;
    const tick = () => {
      const s = EXAMPLES[ex]!;
      if (i <= s.length) {
        setQ(s.slice(0, i));
        i++;
        t = setTimeout(tick, i === 1 ? 900 : 42);
      } else {
        t = setTimeout(() => {
          ex = (ex + 1) % EXAMPLES.length;
          i = 0;
          tick();
        }, 2600);
      }
    };
    tick();
    return () => clearTimeout(t);
  }, [auto, reduced]);

  const stop = () => {
    if (auto) {
      setAuto(false);
      setQ("");
    }
  };
  // Reduced motion: no typing animation, just the first example until the user types.
  const shown = reduced && auto ? EXAMPLES[0]! : q;
  const chips = parseSearchQuery(shown);

  return (
    <div className="flex w-[720px] max-w-full flex-none flex-col gap-3.5">
      <form
        action={SIGN_UP_URL}
        method="get"
        onFocusCapture={stop}
        className="flex w-full gap-2 max-md:flex-col"
      >
        <TextInput
          aria-label="Describe the job you want"
          value={shown}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Describe the job you want, in your own words"
          iconLeft={<Icon name="search" />}
          className="min-w-0 flex-1"
        />
        <Button type="submit">Search jobs</Button>
      </form>
      <div aria-live="polite" className="flex min-h-6 flex-wrap items-center gap-1.5">
        <span className="mr-1 font-mono text-micro text-ink-tertiary">
          {chips.length ? "FILTERS" : "TYPED IN, FILTERED OUT"}
        </span>
        {chips.map((c) => (
          <span key={c.type + c.label} className="ge-fade inline-flex">
            <Tag label={CHIP_TYPE_LABEL[c.type]}>{c.label}</Tag>
          </span>
        ))}
      </div>
    </div>
  );
}

export function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  useScrollFx(ref, (el) => {
    const p = Math.min(1, Math.max(0, window.scrollY / 520));
    el.style.opacity = String(1 - p * 0.7);
    el.style.transform = `translateY(${-p * 40}px) scale(${1 - p * 0.04})`;
  });
  return (
    <div ref={ref} className="flex origin-top-left flex-col items-start gap-6">
      <StatusBadge tone="success">40,000+ verified roles this week</StatusBadge>
      <Rule>
        <HeroHeadline />
      </Rule>
      <Rule>
        <p className="m-0 max-w-[560px] text-lead leading-[1.5] text-ink-muted">
          Search in plain English, get a tailored resume and an outreach email for every match, and
          practise the interview before it happens.
        </p>
      </Rule>
      <Rule className="self-stretch">
        <div className="py-6">
          <HeroSearch />
        </div>
      </Rule>
    </div>
  );
}
