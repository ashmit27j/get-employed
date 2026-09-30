"use client";
/* eslint-disable @next/next/no-img-element -- static brand and source icons */
import { useEffect, useRef, useState } from "react";
import {
  Accordion,
  Button,
  Card,
  CodeWindow,
  Highlight,
  Icon,
  Reveal,
  SectionHeading,
  SourceChip,
  StatusBadge,
  Tag,
  TestimonialCard,
  cx,
  type IconName,
} from "@ge/ui";
import { REPO_URL, SIGN_UP_URL } from "@/lib/site";
import { Section, SectionIntro } from "./Frame";
import { ProductTour } from "./ProductTour";
import { StepFigure, type StepKind } from "./StepFigure";
import { prefersReducedMotion, useReducedMotion, useScrollFx } from "./motion";

/** Product tour inside the screenshot frame; tilts flat as it scrolls into view. */
export function TourSection() {
  const ref = useRef<HTMLDivElement>(null);
  useScrollFx(ref, (el, r, vh) => {
    const p = Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.75)));
    el.style.transform = `perspective(1400px) rotateX(${((1 - p) * 16).toFixed(2)}deg) scale(${(0.9 + p * 0.1).toFixed(3)})`;
    el.style.opacity = String(0.35 + p * 0.65);
  });
  return (
    <Section top="tight">
      <div ref={ref} className="origin-top will-change-transform">
        <Card variant="screenshot" className="block max-md:p-2">
          <ProductTour />
        </Card>
      </div>
    </Section>
  );
}

const STEPS: [StepKind, string, string, string][] = [
  [
    "search",
    "Search",
    "Describe the job in plain English",
    "Type “backend roles in Bengaluru, 12 LPA+, remote-friendly”. It becomes filter chips you can edit.",
  ],
  [
    "match",
    "Match",
    "A match score for every role",
    "Each job is scored 0–100 against your profile, with a one-line reason and the skills you’re missing.",
  ],
  [
    "tailor",
    "Tailor",
    "A resume written for the role",
    "Bullets are rewritten per job. You review the diff and the ATS score before anything is saved.",
  ],
  [
    "outreach",
    "Reach out",
    "Email the person who’s hiring",
    "Drafts wait in your outbox with the contact’s email and a confidence score. Nothing sends until you approve.",
  ],
  [
    "track",
    "Track",
    "Every application on one board",
    "Found, tailored, sent, replied, interview, offer. Cards move as replies come in.",
  ],
  [
    "practice",
    "Practice",
    "Rehearse the interview out loud",
    "A live voice mock interview, then a report on communication, accuracy, structure and confidence.",
  ],
];

function Step({
  step: [kind, eyebrow, title, body],
  i,
}: {
  step: (typeof STEPS)[number];
  i: number;
}) {
  const [on, setOn] = useState(false);
  return (
    <div
      data-step=""
      onMouseEnter={() => setOn(true)}
      onMouseLeave={() => setOn(false)}
      className={cx(
        "px-8 pt-8 pb-10",
        // 3 columns ≥1024, 2 columns 768–1023, 1 column below.
        "lg:border-hairline lg:[&:nth-child(n+4)]:border-t lg:[&:not(:nth-child(3n+1))]:border-l",
        "max-lg:border-hairline max-lg:[&:nth-child(n+3)]:border-t max-lg:[&:nth-child(even)]:border-l",
        "max-md:border-l-0! max-md:px-0 max-md:py-8 max-md:[&:nth-child(n+2)]:border-t",
      )}
    >
      <Reveal delay={(i % 3) * 0.08}>
        <div
          className={cx(
            "flex flex-col gap-3 transition-transform duration-300 ease-out-expo",
            on && "-translate-y-1.5",
          )}
        >
          <div
            className={cx(
              "font-mono text-micro transition-colors duration-300",
              on ? "text-primary" : "text-ink-tertiary",
            )}
          >
            {`0${i + 1} · ${eyebrow.toUpperCase()}`}
          </div>
          <StepFigure kind={kind} active={on} />
          <div className="mt-3 text-body font-medium text-ink">{title}</div>
          <p className="m-0 max-w-[320px] text-small text-pretty text-ink-subtle">{body}</p>
        </div>
      </Reveal>
    </div>
  );
}

export function HowItWorks() {
  return (
    <Section id="how">
      <Reveal>
        <SectionIntro
          eyebrow="How it works"
          title={
            <SectionHeading className="max-w-[760px]">
              From one sentence to a booked interview.
            </SectionHeading>
          }
        />
      </Reveal>
      <div className="grid grid-cols-3 max-lg:grid-cols-2 max-md:grid-cols-1">
        {STEPS.map((s, i) => (
          <Step key={s[0]} step={s} i={i} />
        ))}
      </div>
    </Section>
  );
}

const SOURCES: [string, IconName | `si:${string}` | undefined][] = [
  ["LinkedIn", "si:linkedin"],
  ["Google Careers", "si:google"],
  ["Naukri", undefined],
  ["Indeed", "si:indeed"],
  ["Glassdoor", "si:glassdoor"],
  ["Wellfound", undefined],
  ["Instahyre", undefined],
  ["Cutshort", undefined],
  ["Foundit", undefined],
  ["Internshala", undefined],
  ["Hirist", undefined],
  ["Careers pages", "building-2"],
];

export function SourceCarousel() {
  const [paused, setPaused] = useState(false);
  return (
    <Section top="tight">
      <Reveal>
        <div className="flex flex-col items-center gap-6">
          <div className="text-small text-ink-subtle">
            Listings pulled from the boards you already use
          </div>
          <div
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            className="w-full overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_14%,black_86%,transparent)]"
          >
            <div className="flex flex-col gap-3">
              {[0, 6].map((off, r) => {
                const row = [...SOURCES.slice(off), ...SOURCES.slice(0, off)];
                return (
                  <div
                    key={r}
                    className="ge-track flex w-max"
                    style={{
                      marginLeft: -r * 70,
                      animationDelay: `${-r * 9}s`,
                      animationDuration: `${45 + r * 6}s`,
                      animationPlayState: paused ? "paused" : "running",
                    }}
                    aria-hidden={r === 1 || undefined}
                  >
                    {[...row, ...row].map(([name, icon], i) => (
                      <div key={i} className="pr-3" aria-hidden={i >= row.length || undefined}>
                        <SourceChip name={name} icon={icon} />
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}

const cell = "flex flex-col gap-2.5 rounded-md border border-hairline bg-canvas p-4 text-ui";
const RUBRIC: [string, number][] = [
  ["Communication", 82],
  ["Technical accuracy", 74],
  ["Structure", 68],
  ["Confidence", 79],
];

export function Features() {
  const cards: [string, string, React.ReactNode][] = [
    [
      "Job feed",
      "Know why a role fits before you open it",
      <div key="feed" className={cell}>
        <div className="flex items-baseline justify-between">
          <div>
            <div className="font-medium text-ink">Backend Engineer · Razorpay</div>
            <div className="text-ink-subtle">Bengaluru · ₹18–26 LPA</div>
          </div>
          <div className="font-mono text-headline text-primary">92</div>
        </div>
        <div className="text-ink-muted">Your Go and Kafka projects cover 4 of 5 requirements.</div>
        <div className="flex gap-1.5">
          <Tag>Missing: Kubernetes</Tag>
          <Tag>gRPC</Tag>
        </div>
      </div>,
    ],
    [
      "Resume tailor",
      "See every rewritten line",
      <div key="tailor" className={cx(cell, "font-mono text-caption")}>
        <div className="text-ink-tertiary line-through">
          − Worked on backend APIs for college fest app
        </div>
        <div className="text-ink">
          + Built a Go REST API serving 12k users during a 3-day college fest
        </div>
        <div className="mt-1 flex justify-between font-sans text-ui text-ink-subtle">
          <span>ATS score</span>
          <span>
            <span className="text-ink-tertiary">71 → </span>
            <span className="text-primary">89</span>
          </span>
        </div>
      </div>,
    ],
    [
      "Outbox",
      "Approve each email with one click",
      <div key="outbox" className={cell}>
        <div className="flex justify-between text-ink-subtle">
          <span>To: ananya.k@zepto.co</span>
          <span className="font-mono">94% match</span>
        </div>
        <div className="text-ink">Hi Ananya, I saw the SDE-1 opening on the payments team…</div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" tabIndex={-1}>
            Edit
          </Button>
          <Button size="sm" tabIndex={-1}>
            Approve & send
          </Button>
        </div>
      </div>,
    ],
    [
      "Interview report",
      "Scores you can improve on",
      <div key="report" className={cell}>
        {RUBRIC.map(([label, v]) => (
          <div
            key={label}
            className="grid grid-cols-[140px_1fr_28px] items-center gap-2.5 text-ink-muted"
          >
            <span>{label}</span>
            <span className="h-1 overflow-hidden rounded-[2px] bg-surface-3">
              <span
                className="block h-full bg-primary"
                style={{ width: `${v}%`, opacity: 0.4 + v / 200 }}
              />
            </span>
            <span className="text-right font-mono">{v}</span>
          </div>
        ))}
      </div>,
    ],
  ];
  return (
    <Section>
      <Reveal>
        <SectionIntro
          eyebrow="Inside the app"
          title={
            <SectionHeading className="max-w-[760px]">
              Built <Highlight>for Engineers</Highlight>, by Engineers.
            </SectionHeading>
          }
        />
      </Reveal>
      <div className="mb-[72px] grid grid-cols-2 gap-4 max-md:grid-cols-1">
        {cards.map(([eyebrow, title, ui], i) => (
          <Reveal key={eyebrow} delay={(i % 2) * 0.08} className="h-full">
            <Card eyebrow={eyebrow} title={title} className="h-full gap-4">
              <div aria-hidden="true" className="contents">
                {ui}
              </div>
            </Card>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

export function SelfHost() {
  const points = [
    "Same app as the hosted version",
    "Your own LLM and email API keys",
    "No usage limits",
    "Your data stays on your machine",
  ];
  const prompt = <span className="text-ink-tertiary">$ </span>;
  const ok = <span className="text-primary">✓</span>;
  return (
    <Section id="selfhost">
      <div className="mb-[72px] grid grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] items-center gap-12 max-lg:grid-cols-1 max-lg:gap-8">
        <Reveal>
          <div className="flex flex-col items-start gap-5">
            <StatusBadge>Open source</StatusBadge>
            <SectionHeading size="md">
              Run it yourself <Highlight>for free</Highlight>.
            </SectionHeading>
            <p className="m-0 max-w-[480px] text-lead leading-[1.6] text-ink-subtle">
              Clone the repo, add your keys, start it with Docker Compose. Everything the hosted
              plan does, without the quotas.
            </p>
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0 text-body text-ink-muted">
              {points.map((p) => (
                <li key={p} className="flex items-center gap-2.5">
                  <Icon name="check" size={14} className="text-primary" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <CodeWindow>
            {prompt}git clone {REPO_URL}.git{"\n"}
            {prompt}cd get-employed && cp .env.example .env{"\n"}
            {prompt}docker compose -f docker-compose.selfhost.yml up -d{"\n"}
            {ok} web ready on http://localhost:4000{"\n"}
            {ok} worker scraping 12 sources{"\n"}
            {ok} db healthy
          </CodeWindow>
        </Reveal>
      </div>
    </Section>
  );
}

const TESTIMONIALS: [string, string, string][] = [
  [
    "I described what I wanted in one sentence and had thirty matched roles with reasons. Three interviews in two weeks.",
    "Aditi Sharma",
    "SDE-1, hired at a Bengaluru fintech",
  ],
  [
    "The mock interviews were tough in a useful way. My structure score went from 54 to 81 before the real one.",
    "Rohan Iyer",
    "Backend Engineer, Pune",
  ],
  [
    "I approved every outreach email myself and still got replies from two hiring managers in the first week.",
    "Sneha Reddy",
    "Final-year CSE, Hyderabad",
  ],
];

export function Testimonials() {
  return (
    <Section bottom={96}>
      <Reveal>
        <SectionHeading className="mb-10">
          From candidates <Highlight>like you</Highlight>
        </SectionHeading>
      </Reveal>
      <div className="grid grid-cols-3 gap-4 max-lg:grid-cols-2 max-md:grid-cols-1">
        {TESTIMONIALS.map(([quote, name, role], i) => (
          <Reveal key={name} delay={i * 0.08} className="grid h-full">
            <TestimonialCard quote={quote} name={name} role={role} />
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

const FAQS = [
  {
    q: "Is it free?",
    a: "Yes. The free plan includes 5 saved searches, 20 tailored resumes and 50 outreach emails a month, plus one mock interview. Pro removes the limits.",
  },
  {
    q: "What’s the difference between hosted and self-hosted?",
    a: "It’s the same product. The self-hosted version runs on your machine with Docker Compose, uses your own API keys, and has no limits.",
  },
  {
    q: "Will it send emails without asking me?",
    a: "No. Every draft waits in your outbox until you approve it.",
  },
  {
    q: "Where do the jobs come from?",
    a: "Public listings on job boards and company careers pages, de-duplicated and refreshed daily.",
  },
  {
    q: "Is it only for India?",
    a: "It starts with roles and salary data in India. More regions are planned.",
  },
];

export function FAQ() {
  return (
    <Section>
      <div className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-12 max-lg:grid-cols-1 max-lg:gap-8">
        <Reveal>
          <div className="flex flex-col gap-4">
            <div className="text-eyebrow font-medium text-ink-subtle uppercase">FAQ</div>
            <SectionHeading size="md">Questions</SectionHeading>
          </div>
        </Reveal>
        <Reveal delay={0.08}>
          <Accordion items={FAQS} />
        </Reveal>
      </div>
    </Section>
  );
}

/** Final CTA: "Get employed." letters rise in one by one, then "employed." gets the marker. */
export function FinalCTA() {
  const heading = useRef<HTMLHeadingElement>(null);
  const reduced = useReducedMotion();
  const [animatedIn, setMarked] = useState(false);
  const marked = animatedIn || reduced;
  const words: [string, boolean][] = [
    ["Get", false],
    ["employed.", true],
  ];
  useEffect(() => {
    const el = heading.current;
    if (!el) return;
    if (prefersReducedMotion()) return;
    const letters = [...el.querySelectorAll<HTMLElement>("[data-l]")];
    letters.forEach((l) => (l.style.opacity = "0"));
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        letters.forEach((l, i) =>
          l.animate(
            [
              { opacity: 0, transform: "translateY(70%) rotate(8deg)", filter: "blur(10px)" },
              { opacity: 1, transform: "none", filter: "blur(0px)" },
            ],
            {
              duration: 900,
              delay: i * 40,
              easing: "cubic-bezier(0.16,1,0.3,1)",
              fill: "forwards",
            },
          ),
        );
        setTimeout(() => setMarked(true), 1100);
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Section bottom="section">
      <section className="relative flex flex-col items-center gap-8 overflow-hidden rounded-2xl border border-hairline bg-surface-1 px-12 py-28 text-center max-md:px-6 max-md:py-[72px]">
        <h2
          ref={heading}
          aria-label="Get employed."
          className="m-0 flex flex-wrap justify-center gap-x-[0.25em] text-cta font-semibold max-lg:text-[clamp(56px,10vw,104px)] max-lg:tracking-[-0.04em]"
        >
          {words.map(([w, hi]) => (
            <span
              key={w}
              aria-hidden="true"
              className={cx(
                "relative inline-flex text-ink",
                hi &&
                  "-mx-1 rounded-[2px] bg-[linear-gradient(var(--color-selection),var(--color-selection))] bg-left bg-no-repeat px-1 transition-[background-size] duration-700 ease-wipe",
              )}
              style={hi ? { backgroundSize: `${marked ? 100 : 0}% 100%` } : undefined}
            >
              {w.split("").map((c, i) => (
                <span key={i} data-l="" className="inline-block">
                  {c}
                </span>
              ))}
            </span>
          ))}
        </h2>
        <p className="m-0 text-lead text-ink-subtle">
          <strong className="font-semibold text-ink">
            <Highlight>Free</Highlight>
          </strong>{" "}
          to start. No credit card. Or self-host it tonight.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener"
            className="inline-flex h-9 items-center gap-2 rounded-full bg-surface-4 px-4 text-small font-medium whitespace-nowrap text-ink hover:text-ink"
          >
            <img
              src="/github.png"
              alt=""
              aria-hidden="true"
              width={16}
              height={16}
              className="block size-4 object-contain"
            />
            View on GitHub
          </a>
          <Button href={SIGN_UP_URL}>Get started</Button>
        </div>
      </section>
    </Section>
  );
}
