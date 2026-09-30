"use client";
import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Avatar,
  Button,
  Chip,
  Icon,
  MatchRing,
  Panel,
  ScoreBar,
  Segmented,
  Select,
  StatusBadge,
  TextArea,
  TextInput,
  Toggle,
  cx,
  type IconName,
} from "@ge/ui";
import {
  GITHUB_ROLES,
  README_CHECKS,
  README_SECTIONS,
  githubScore,
  newFileUrl,
  profileReadme,
  projectReadme,
  type GhRepo,
  type GithubRole,
  type Profile,
  type ReadmeSection,
} from "@ge/core";
import { addReposToResume, connectGithub } from "@/server/actions/profiles";
import type { GithubData } from "@/server/profiles";
import { BrandHeader, usePollWhile } from "./LinkedinProfile";
import { MarkdownView } from "./MarkdownView";

type Tab = "readme" | "pins" | "projects" | "context";
const FEATURES: [IconName, string, string][] = [
  [
    "file-text",
    "Profile README",
    "Generate a profile README from your resume and repositories, then commit it in one click.",
  ],
  [
    "pin",
    "Pinned repo guidance",
    "See which repositories to pin for your target role, and which to take down.",
  ],
  [
    "book-open",
    "Project READMEs",
    "Score each repository's README and generate a clear one with setup steps and results.",
  ],
  [
    "compass",
    "Profile context",
    "Your languages, skills backed by code, and which projects to carry onto your resume.",
  ],
];
/** Language bar colours by rank: accent for the main language, then quieter inks. */
const LANG_COLORS = [
  "bg-primary",
  "bg-ink-muted",
  "bg-ink-subtle",
  "bg-ink-tertiary",
  "bg-surface-4",
];

function repoStatus(r: GhRepo, draft: boolean, opened: boolean) {
  if (opened) return "README copied for GitHub";
  if (draft) return "Draft ready";
  return r.readmeScore >= 60
    ? "Needs small fixes"
    : r.readmeScore >= 30
      ? "Missing key sections"
      : "Almost empty";
}

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Clipboard can be blocked; the text is still on screen.
  }
}

export function GithubProfile({
  data,
  profile,
  targetRole,
}: {
  data: GithubData;
  profile: Profile;
  targetRole: string | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [login, setLogin] = useState(data.login ?? "");
  const [error, setError] = useState<string | null>(null);
  const importing = !!data.login && !data.snapshot;
  usePollWhile(importing);

  const snap = data.snapshot;
  const repos = useMemo(() => snap?.repos ?? [], [snap]);
  const handle = snap?.login ?? data.login ?? "";
  const [tab, setTab] = useState<Tab>("readme");
  const [role, setRole] = useState<GithubRole>(
    GITHUB_ROLES.find((r) => targetRole?.toLowerCase().includes(r.split(" ")[0]!.toLowerCase())) ??
      GITHUB_ROLES[0],
  );
  const [detailed, setDetailed] = useState(false);
  const [sections, setSections] = useState<Record<ReadmeSection, boolean>>({
    about: true,
    now: true,
    stack: true,
    projects: true,
    experience: false,
    contact: true,
  });
  const [readmeDraft, setReadmeDraft] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pins, setPins] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(repos.map((r) => [r.id, r.pinned])),
  );
  const [pinsOpened, setPinsOpened] = useState(false);
  const [cur, setCur] = useState(repos[0]?.id ?? "");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [opened, setOpened] = useState<Record<string, boolean>>({});
  const [projView, setProjView] = useState<"Preview" | "Markdown">("Preview");
  const [onResume, setOnResume] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      repos
        .filter((r) => r.suggest)
        .map((r) => [
          r.id,
          !profile.projects.some((p) => p.name.toLowerCase() === r.name.toLowerCase()),
        ]),
    ),
  );
  const [added, setAdded] = useState<number | null>(null);

  const generated = profileReadme({ profile, repos, login: handle, role, detailed, sections });
  const readme = readmeDraft ?? generated;
  const pinnedNow = repos.filter((r) => pins[r.id]);
  const score = githubScore(
    repos.map((r) => ({
      ...r,
      pinned: !!pins[r.id],
      readmeScore: drafts[r.id] ? 92 : r.readmeScore,
    })),
  );
  const cr = repos.find((r) => r.id === cur) ?? repos[0];
  const selected = repos.filter((r) => r.suggest && onResume[r.id]);
  const topics = new Set(repos.flatMap((r) => r.topics.map((t) => t.toLowerCase())));
  const resumeSkills = profile.skills.flatMap((g) => g.items);
  const backed = resumeSkills.filter((k) => topics.has(k.toLowerCase()));
  const badPins = pinnedNow.filter((r) => !r.suggest).length;

  const connect = () =>
    start(async () => {
      setError(null);
      try {
        await connectGithub(login);
        router.refresh();
      } catch {
        setError("That isn't a GitHub username.");
      }
    });

  return (
    <>
      <BrandHeader
        img="/github.png"
        title="GitHub optimization"
        sub="Paste your GitHub username. We read your repositories, languages and main resume, then help you write a profile README, choose what to pin, and fix project READMEs."
      />
      <Panel padded>
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            connect();
          }}
        >
          <div className="min-w-[220px] flex-1">
            <TextInput
              label="GitHub username"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              placeholder="e.g. ashmit27j"
            />
          </div>
          <Button type="submit" disabled={!login.trim() || pending || importing}>
            {pending || importing ? "Connecting…" : snap ? "Refresh" : "Connect"}
          </Button>
        </form>
        {error && (
          <p role="alert" className="m-0 text-small text-danger-ink">
            {error}
          </p>
        )}
      </Panel>

      {!snap ? (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-3">
          {FEATURES.map(([icon, title, body]) => (
            <div
              key={title}
              className="flex gap-3 rounded-lg border border-hairline bg-surface-1 p-4"
            >
              <span className="flex size-8 flex-none items-center justify-center rounded-sm border border-hairline bg-surface-2 text-ink-subtle">
                <Icon name={icon} size={16} />
              </span>
              <div className="flex flex-col gap-0.5">
                <span className="text-small font-medium">{title}</span>
                <span className="text-caption text-pretty text-ink-subtle">{body}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <Panel padded>
            <div className="flex flex-wrap items-center gap-4">
              <Avatar name={profile.contact.name} size={44} />
              <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-2">
                <div className="flex flex-wrap items-baseline gap-2">
                  <a
                    href={`https://github.com/${handle}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-body font-medium text-ink no-underline hover:underline"
                  >
                    @{handle}
                  </a>
                  <span className="text-caption text-ink-subtle">
                    {repos.length} public repositories · {repos.reduce((a, r) => a + r.stars, 0)}{" "}
                    stars · {snap.activity}
                  </span>
                </div>
                <div className="flex h-1.5 gap-0.5 overflow-hidden rounded-full" aria-hidden="true">
                  {snap.languages.map((l, i) => (
                    <span
                      key={l.name}
                      className={LANG_COLORS[i] ?? "bg-surface-4"}
                      style={{ width: `${l.pct}%` }}
                    />
                  ))}
                </div>
                <div className="flex flex-wrap gap-3">
                  {snap.languages.map((l, i) => (
                    <span
                      key={l.name}
                      className="inline-flex items-center gap-1.5 text-caption text-ink-subtle"
                    >
                      <span
                        className={cx("size-2 rounded-full", LANG_COLORS[i] ?? "bg-surface-4")}
                      />
                      {l.name} <span className="font-mono text-ink-tertiary">{l.pct}%</span>
                    </span>
                  ))}
                </div>
              </div>
              <MatchRing value={score} size={48} caption="GitHub profile score" />
            </div>
          </Panel>

          <Segmented
            label="GitHub"
            options={[
              { value: "readme", label: "Profile README" },
              { value: "pins", label: "Pinned repos" },
              { value: "projects", label: "Project READMEs" },
              { value: "context", label: "Profile context" },
            ]}
            value={tab}
            onChange={(v) => setTab(v as Tab)}
          />

          {tab === "readme" && (
            <div className="flex flex-wrap items-start gap-6">
              <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-3">
                <Panel
                  title="What to include"
                  sub="Built from your repositories and main resume"
                  padded
                >
                  <div className="flex flex-wrap gap-1.5">
                    {README_SECTIONS.map(([id, label, icon]) => (
                      <Chip
                        key={id}
                        active={sections[id]}
                        icon={icon as IconName}
                        onClick={() => {
                          setSections((s) => ({ ...s, [id]: !s[id] }));
                          setReadmeDraft(null);
                        }}
                      >
                        {label}
                      </Chip>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <Segmented
                      label="Length"
                      options={["Concise", "Detailed"]}
                      value={detailed ? "Detailed" : "Concise"}
                      onChange={(v) => {
                        setDetailed(v === "Detailed");
                        setReadmeDraft(null);
                      }}
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      iconLeft={<Icon name="refresh-cw" size={14} />}
                      onClick={() => setReadmeDraft(null)}
                    >
                      Regenerate
                    </Button>
                  </div>
                </Panel>
                <TextArea
                  aria-label="Profile README"
                  mono
                  rows={22}
                  value={readme}
                  onChange={(e) => setReadmeDraft(e.target.value)}
                  hint={
                    readmeDraft != null
                      ? "Edited by hand. Regenerate to start over."
                      : `Generated for a ${role.toLowerCase()} profile. Edit anything before committing.`
                  }
                />
              </div>
              <aside className="sticky top-[88px] flex min-w-0 flex-[1_1_420px] flex-col gap-3 max-lg:static">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-caption text-ink-subtle">
                    {handle}/{handle} · README.md
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      iconLeft={<Icon name="copy" size={14} />}
                      onClick={() => {
                        void copy(readme);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1500);
                      }}
                    >
                      {copied ? "Copied" : "Copy"}
                    </Button>
                    <Button
                      size="sm"
                      href={newFileUrl(handle, handle, "README.md", readme)}
                      target="_blank"
                    >
                      Commit to GitHub
                    </Button>
                  </div>
                </div>
                <Panel>
                  <div className="p-6">
                    <MarkdownView source={readme} />
                  </div>
                </Panel>
              </aside>
            </div>
          )}

          {tab === "pins" && (
            <Panel
              title="Pinned repositories"
              sub="Pin 4 to 6 repositories that show the work your target role asks for. Recruiters see these first."
              meta={`${pinnedNow.length} of 6 pinned`}
            >
              {repos.map((r) => (
                <div
                  key={r.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-hairline px-5 py-3.5"
                >
                  <div className="flex min-w-0 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-small">{r.name}</span>
                      {r.pinned && <StatusBadge tone="neutral">Pinned now</StatusBadge>}
                      <span className="text-caption text-ink-tertiary">
                        {r.lang} · {r.stars} stars
                      </span>
                    </div>
                    <span
                      className={cx(
                        "flex items-start gap-1.5 text-caption text-pretty",
                        r.suggest ? "text-ink-subtle" : "text-danger-ink",
                      )}
                    >
                      <Icon
                        name={r.suggest ? "circle-check" : "circle-minus"}
                        size={14}
                        className="mt-0.5"
                      />
                      {r.why}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-caption text-ink-subtle">Pin</span>
                    <Toggle
                      on={!!pins[r.id]}
                      onChange={(v) => {
                        setPins((p) => ({ ...p, [r.id]: v }));
                        setPinsOpened(false);
                      }}
                      label={`Pin ${r.name}`}
                    />
                  </div>
                </div>
              ))}
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                <span className="text-caption text-ink-subtle" aria-live="polite">
                  {pinsOpened
                    ? "On GitHub, choose Customize your pins and match this list."
                    : pinnedNow.length > 6
                      ? "GitHub allows up to 6 pins."
                      : badPins
                        ? `${badPins} pinned ${badPins === 1 ? "repository works" : "repositories work"} against you.`
                        : "Your pins match the suggestions."}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="tertiary"
                    size="sm"
                    onClick={() => {
                      setPins(Object.fromEntries(repos.map((r) => [r.id, r.suggest])));
                      setPinsOpened(false);
                    }}
                  >
                    Use suggestions
                  </Button>
                  <Button
                    size="sm"
                    disabled={pinnedNow.length === 0 || pinnedNow.length > 6}
                    href={`https://github.com/${handle}`}
                    target="_blank"
                    onClick={() => setPinsOpened(true)}
                  >
                    Apply pins
                  </Button>
                </div>
              </div>
            </Panel>
          )}

          {tab === "projects" && cr && (
            <div className="flex flex-wrap items-start gap-6">
              <div className="flex min-w-[240px] flex-[0_1_300px] flex-col gap-1">
                {repos.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    aria-pressed={r.id === cr.id}
                    onClick={() => setCur(r.id)}
                    className={cx(
                      "box-border flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2.5 text-left focus-visible:shadow-focus focus-visible:outline-none",
                      r.id === cr.id
                        ? "border-hairline-strong bg-surface-2"
                        : "border-transparent hover:bg-surface-1",
                    )}
                  >
                    <MatchRing value={drafts[r.id] ? 92 : r.readmeScore} size={32} label={false} />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="font-mono text-small text-ink">{r.name}</span>
                      <span className="text-caption text-ink-subtle">
                        {repoStatus(r, !!drafts[r.id], !!opened[r.id])}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
              <div className="flex min-w-0 flex-[1_1_480px] flex-col gap-3">
                {(() => {
                  const has = !!drafts[cr.id];
                  const k = has
                    ? README_CHECKS.length
                    : Math.round((cr.readmeScore / 100) * README_CHECKS.length);
                  return (
                    <Panel
                      title={cr.name}
                      sub="README checklist"
                      meta={`${k} of ${README_CHECKS.length}`}
                      padded
                    >
                      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-x-4 gap-y-2.5">
                        {README_CHECKS.map((label, i) => (
                          <span
                            key={label}
                            className={cx(
                              "flex items-center gap-2 text-small",
                              i < k ? "text-success-ink" : "text-danger-ink",
                            )}
                          >
                            <Icon name={i < k ? "circle-check" : "circle-x"} size={14} />
                            {label}
                          </span>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          iconLeft={<Icon name="sparkles" size={14} />}
                          onClick={() => {
                            setDrafts((d) => ({ ...d, [cr.id]: projectReadme(cr, handle) }));
                            setOpened((o) => ({ ...o, [cr.id]: false }));
                          }}
                        >
                          {has ? "Regenerate README" : "Generate README"}
                        </Button>
                        {has && (
                          <Button
                            size="sm"
                            href={`https://github.com/${handle}/${cr.name}/edit/HEAD/README.md`}
                            target="_blank"
                            onClick={() => {
                              void copy(drafts[cr.id]!);
                              setOpened((o) => ({ ...o, [cr.id]: true }));
                            }}
                          >
                            Open pull request
                          </Button>
                        )}
                      </div>
                      {opened[cr.id] && (
                        <span className="text-caption text-ink-subtle" role="status">
                          The README is copied. Paste it into GitHub&apos;s editor and choose Create
                          a new branch to open the pull request.
                        </span>
                      )}
                    </Panel>
                  );
                })()}
                {drafts[cr.id] && (
                  <>
                    <Segmented
                      label="View"
                      options={["Preview", "Markdown"]}
                      value={projView}
                      onChange={(v) => setProjView(v as typeof projView)}
                    />
                    {projView === "Preview" ? (
                      <Panel>
                        <div className="p-6">
                          <MarkdownView source={drafts[cr.id]!} />
                        </div>
                      </Panel>
                    ) : (
                      <TextArea
                        aria-label={`${cr.name} README`}
                        mono
                        rows={20}
                        value={drafts[cr.id]}
                        onChange={(e) => setDrafts((d) => ({ ...d, [cr.id]: e.target.value }))}
                      />
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {tab === "context" && (
            <div className="flex flex-wrap items-start gap-4">
              <div className="flex min-w-0 flex-[1.6_1_460px] flex-col gap-4">
                <Panel
                  title="Projects on your resume"
                  sub="Selected repositories are added to Projects on your main resume"
                  meta={`${selected.length} selected`}
                >
                  {repos
                    .filter((r) => r.suggest)
                    .map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between gap-3 border-b border-hairline px-5 py-3"
                      >
                        <span className="font-mono text-small">{r.name}</span>
                        <Toggle
                          on={!!onResume[r.id]}
                          onChange={(v) => {
                            setOnResume((s) => ({ ...s, [r.id]: v }));
                            setAdded(null);
                          }}
                          label={`Add ${r.name} to resume`}
                        />
                      </div>
                    ))}
                  <div className="flex flex-wrap items-center justify-end gap-3 px-5 py-3">
                    {added != null && (
                      <span className="text-caption text-ink-subtle" role="status">
                        {added ? (
                          <>
                            Added {added} to your{" "}
                            <Link href="/documents?view=main">main resume</Link>.
                          </>
                        ) : (
                          "Those projects are already on your resume."
                        )}
                      </span>
                    )}
                    <Button
                      size="sm"
                      disabled={selected.length === 0 || pending}
                      onClick={() =>
                        start(async () => {
                          setAdded(
                            await addReposToResume(
                              selected.map((r) => ({
                                name: r.name,
                                desc: r.desc,
                                topics: r.topics,
                              })),
                            ),
                          );
                        })
                      }
                    >
                      {selected.length
                        ? `Add ${selected.length} to Projects`
                        : "Select repositories"}
                    </Button>
                  </div>
                </Panel>
                <Panel
                  title="Resume skills backed by code"
                  sub="Highlighted skills appear in at least one public repository"
                  meta={`${backed.length} of ${resumeSkills.length}`}
                  padded
                >
                  <div className="flex flex-wrap gap-1.5">
                    {resumeSkills.map((k) => {
                      const on = backed.includes(k);
                      return (
                        <Chip key={k} active={on} icon={on ? "check" : undefined}>
                          {k}
                        </Chip>
                      );
                    })}
                  </div>
                </Panel>
              </div>
              <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-4">
                <Panel title="Target role" sub="Frames the README intro and pin suggestions" padded>
                  <Select
                    aria-label="Target role"
                    options={[...GITHUB_ROLES]}
                    value={role}
                    onChange={(e) => {
                      setRole(e.target.value as GithubRole);
                      setReadmeDraft(null);
                    }}
                  />
                </Panel>
                <Panel title="Languages by code volume" padded>
                  {snap.languages.map((l) => (
                    <ScoreBar
                      key={l.name}
                      label={l.name}
                      value={l.pct}
                      valueLabel={`${l.pct}%`}
                      dim
                    />
                  ))}
                </Panel>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
