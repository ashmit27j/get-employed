"use client";
import { Fragment, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Avatar,
  Button,
  CoLogo,
  ConfidenceMeter,
  Icon,
  IconButton,
  MatchRing,
  Panel,
  SalaryBadge,
  ScoreBar,
  cx,
} from "@ge/ui";
import { mentions, timeAgo } from "@ge/core";
import { PageBody } from "@/components/shell/AppShell";
import { addProfileSkill } from "@/server/actions/profile";
import { toggleSaveJob } from "@/server/actions/jobs";
import type { JobDetail } from "@/server/jobs";
import { salaryProps } from "./JobRow";

const MODE_LABEL = { "on-site": "On-site", hybrid: "Hybrid", remote: "Remote" } as const;

type Block = { kind: "p"; text: string } | { kind: "ul"; items: string[] };
type Section = { heading: string | null; blocks: Block[] };

/** "## " starts a section, "- " lines form a list, anything else is a paragraph. */
export function parseDescription(text: string): Section[] {
  const sections: Section[] = [];
  let cur: Section = { heading: null, blocks: [] };
  const push = () => cur.blocks.length && sections.push(cur);
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith("## ")) {
      push();
      cur = { heading: line.slice(3), blocks: [] };
    } else if (/^[-*•]\s+/.test(line)) {
      const item = line.replace(/^[-*•]\s+/, "");
      const last = cur.blocks.at(-1);
      if (last?.kind === "ul") last.items.push(item);
      else cur.blocks.push({ kind: "ul", items: [item] });
    } else cur.blocks.push({ kind: "p", text: line });
  }
  push();
  return sections;
}

function SectionBody({ section }: { section: Section }) {
  return (
    <section className="flex flex-col gap-2">
      {section.heading && <h2 className="m-0 text-body font-semibold">{section.heading}</h2>}
      {section.blocks.map((b, i) =>
        b.kind === "p" ? (
          <p key={i} className="m-0 text-small leading-[1.6] text-pretty text-ink-muted">
            {b.text}
          </p>
        ) : (
          <ul
            key={i}
            className="m-0 flex list-disc flex-col gap-1.5 pl-5 marker:text-ink-tertiary text-small leading-[1.6] text-ink-muted"
          >
            {b.items.map((it) => (
              <li key={it}>{it}</li>
            ))}
          </ul>
        ),
      )}
    </section>
  );
}

function Requirements({ rows }: { rows: JobDetail["requirements"] }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="m-0 text-body font-semibold">Requirements</h2>
      <div className="flex flex-col overflow-hidden rounded-md border border-hairline">
        {rows.map((r) => (
          <div
            key={r.skill}
            className="grid grid-cols-[20px_minmax(0,1fr)_auto] items-center gap-3 border-b border-hairline px-3 py-2.5 text-small last:border-b-0"
          >
            <Icon
              name={r.missing ? "circle-dashed" : "circle-check"}
              size={16}
              className={r.missing ? "text-ink-tertiary" : "text-primary"}
            />
            <span className="text-ink">
              {r.skill}
              <span className="sr-only">{r.missing ? " (missing)" : " (matched)"}</span>
            </span>
            <span className="text-caption text-ink-subtle">{r.evidence}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Stated or estimated range against the market p25–p75 band. */
function SalaryBand({
  salary,
  market,
}: {
  salary: NonNullable<JobDetail["job"]["salary"]>;
  market: JobDetail["market"];
}) {
  const values = [salary.min, salary.max, ...(market ? [market.p25, market.p75] : [])];
  const lo = Math.max(0, Math.floor((Math.min(...values) - 2) / 4) * 4);
  const hi = Math.ceil((Math.max(...values) + 2) / 4) * 4;
  const pct = (v: number) => `${((v - lo) / (hi - lo)) * 100}%`;
  const width = (a: number, b: number) => `${((b - a) / (hi - lo)) * 100}%`;
  return (
    <div className="flex flex-col gap-2" aria-hidden="true">
      <div className="relative h-6">
        <div className="absolute inset-x-0 top-[11px] h-0.5 rounded-full bg-surface-3" />
        {market && (
          <div
            className="absolute top-2 h-2 rounded-full bg-surface-4"
            style={{ left: pct(market.p25), width: width(market.p25, market.p75) }}
          />
        )}
        <div
          className={cx(
            "absolute top-1.5 box-border h-3 rounded-full",
            salary.type === "stated" ? "bg-primary" : "border border-dashed border-primary bg-glow",
          )}
          style={{ left: pct(salary.min), width: width(salary.min, salary.max) }}
        />
      </div>
      <div className="flex justify-between font-mono text-caption text-ink-tertiary">
        <span>₹{lo}</span>
        <span>₹{Math.round((lo + hi) / 2)}</span>
        <span>₹{hi} LPA</span>
      </div>
    </div>
  );
}

export function JobDetailView({ detail, nowIso }: { detail: JobDetail; nowIso: string }) {
  const { job, contact, breakdown: b, market } = detail;
  const router = useRouter();
  const now = useMemo(() => new Date(nowIso), [nowIso]);
  const [saved, setSaved] = useState(job.saved);
  const [claimed, setClaimed] = useState<string[]>([]);
  const [, start] = useTransition();
  const sections = useMemo(() => parseDescription(detail.description), [detail.description]);
  // Claimed skills still listed as missing until the refreshed data arrives.
  const pending = claimed.filter((c) => job.missing.includes(c));
  const reqs = detail.requirements.map((r) =>
    pending.includes(r.skill) ? { ...r, missing: false, evidence: "Listed in skills" } : r,
  );
  const missing = job.missing.filter((m) => !pending.includes(m));
  // Requirements sit before Benefits, as on the careers pages we parse.
  const benefitsAt = sections.findIndex((s) => /benefit|perk/i.test(s.heading ?? ""));
  const reqAt = benefitsAt === -1 ? sections.length : benefitsAt;
  const found = contact.status === "found";
  const verified = found && /smtp|verified by/i.test(contact.method ?? "");
  const people = contact.companyCount;
  const outreach = `/mailbox?box=outbox&job=${job.id}`;

  const save = () => {
    setSaved(!saved);
    start(async () => setSaved((await toggleSaveJob(job.id)).saved));
  };
  const claim = (skill: string) => {
    setClaimed((c) => [...c, skill]);
    start(async () => {
      await addProfileSkill(skill);
      router.refresh();
    });
  };

  const steps: { label: string; icon: "circle-check" | "loader" | "circle-dashed"; on: boolean }[] =
    [
      { label: "Company domain resolved", icon: "circle-check", on: true },
      found
        ? {
            label: `${people} ${people === 1 ? "person" : "people"} on the hiring team found`,
            icon: "circle-check",
            on: true,
          }
        : { label: "Looking for the hiring team", icon: "loader", on: false },
      verified
        ? { label: "Email verified by SMTP handshake", icon: "circle-check", on: true }
        : {
            label: found && contact.method ? contact.method : "Email not verified yet",
            icon: "circle-dashed",
            on: false,
          },
    ];

  return (
    <PageBody className="gap-8!">
      <div className="flex flex-wrap items-start gap-4">
        <CoLogo name={job.company} size={48} />
        <div className="flex min-w-[260px] flex-1 flex-col gap-2 max-md:min-w-0">
          <h1 className="m-0 text-headline leading-[1.15] font-semibold tracking-[-0.8px]">
            {job.title}
          </h1>
          <div className="flex flex-wrap gap-2 text-small text-ink-subtle">
            <span className="text-ink-muted">{job.company}</span>
            <span>·</span>
            <span>{job.location}</span>
            <span>·</span>
            <span>{MODE_LABEL[job.mode]}</span>
            <span>·</span>
            <span>{job.experience}</span>
            <span>·</span>
            <span>
              Posted {timeAgo(job.postedAt, now)} ago via {job.sourceLabel}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <IconButton
            icon={saved ? "bookmark-check" : "bookmark"}
            title={saved ? "Saved to tracker" : "Save to tracker"}
            active={saved}
            onClick={save}
            size={36}
          />
          <Button variant="secondary" href={outreach}>
            Reach out
          </Button>
          <Button href={`/documents?view=tailor&job=${job.id}`}>Tailor resume</Button>
        </div>
      </div>

      <div className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[2_1_520px] flex-col gap-6">
          <Panel title="Job description" meta="Parsed from the careers page">
            <div className="flex flex-col gap-6 p-6 max-md:p-4">
              {sections.length === 0 && <Requirements rows={reqs} />}
              {sections.map((s, i) => (
                <Fragment key={i}>
                  {i === reqAt && <Requirements rows={reqs} />}
                  <SectionBody section={s} />
                </Fragment>
              ))}
              {sections.length > 0 && reqAt === sections.length && <Requirements rows={reqs} />}
            </div>
          </Panel>
        </div>

        <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-4">
          <Panel title="Match breakdown" padded>
            <div className="flex items-center gap-4">
              {job.score != null ? (
                <MatchRing value={job.score} size={80} />
              ) : (
                <span className="grid size-20 flex-none place-items-center rounded-full border border-dashed border-hairline-strong font-mono text-small text-ink-tertiary">
                  –
                </span>
              )}
              <p className="m-0 text-small text-pretty text-ink-muted">
                {job.reason ??
                  "We're scoring this role against your profile. Check back in a minute."}
              </p>
            </div>
            <ScoreBar
              label="Required skills"
              value={b.skills.value}
              valueLabel={`${b.skills.have + pending.length} of ${b.skills.total}`}
            />
            <ScoreBar label="Experience level" value={b.experience} />
            <ScoreBar label="Location and mode" value={b.location} />
            <ScoreBar
              label="Project relevance"
              value={b.projects}
              gain={b.gain}
              note={b.gainNote ?? undefined}
            />
          </Panel>

          {missing.length > 0 && (
            <Panel
              title="Missing skills"
              sub="Mentioned in the JD, not found in your profile"
              padded
            >
              {missing.map((m) => (
                <div key={m} className="flex items-center gap-3">
                  <div className="flex flex-1 flex-col">
                    <span className="text-small text-ink">{m}</span>
                    <span className="text-caption text-ink-subtle">
                      Mentioned{" "}
                      {1 + detail.description.split(/\r?\n/).filter((l) => mentions(l, m)).length}×
                      in the JD · often paired with {job.skills.find((s) => s !== m) ?? m}
                    </span>
                  </div>
                  <Button variant="tertiary" size="sm" onClick={() => claim(m)}>
                    I have this
                  </Button>
                </div>
              ))}
            </Panel>
          )}

          {job.salary && (
            <Panel title="Salary" padded>
              <SalaryBadge {...salaryProps(job.salary)} />
              <SalaryBand salary={job.salary} market={market} />
              <p className="m-0 text-caption leading-[1.5] text-pretty text-ink-subtle">
                {job.salary.type === "stated"
                  ? `Stated in the posting.${market ? ` Grey band shows the market p25–p75 for similar roles in ${job.location}.` : ""}`
                  : `Estimated from ${job.salary.samples} offers for similar roles in ${job.location} over the last 12 months. ${job.salary.confidence}% confidence${market ? "; the grey band is the market p25–p75." : "."}`}
              </p>
            </Panel>
          )}

          <Panel
            title="Contact discovery"
            meta={
              found
                ? people > 1
                  ? `1 of ${people} people`
                  : "1 person"
                : contact.status === "searching"
                  ? "Searching…"
                  : "No contact yet"
            }
            padded
          >
            <div className="flex flex-col gap-2 text-small">
              {steps.map((st) => (
                <div key={st.label} className="flex items-center gap-2 text-ink-muted">
                  <Icon
                    name={st.icon}
                    size={16}
                    className={cx(
                      st.on
                        ? "text-primary"
                        : st.icon === "loader"
                          ? "text-ink-subtle"
                          : "text-ink-tertiary",
                      st.icon === "loader" && "motion-safe:animate-spin",
                    )}
                  />
                  <span>{st.label}</span>
                </div>
              ))}
            </div>
            {found && contact.name && (
              <>
                <div className="flex items-center gap-3 rounded-md border border-hairline bg-surface-2 p-3">
                  <Avatar name={contact.name} size={32} />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="text-small text-ink">{contact.name}</span>
                    <span className="text-caption text-ink-subtle">{contact.role}</span>
                  </div>
                  {contact.confidence != null && <ConfidenceMeter value={contact.confidence} />}
                </div>
                <Button variant="secondary" size="sm" fullWidth href={outreach}>
                  Draft outreach email
                </Button>
              </>
            )}
          </Panel>
        </div>
      </div>
    </PageBody>
  );
}
