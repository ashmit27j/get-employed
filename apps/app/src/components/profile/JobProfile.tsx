"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Button,
  Chip,
  Dropdown,
  Dropzone,
  Icon,
  IconButton,
  MatchRing,
  Modal,
  Panel,
  Segmented,
  TextArea,
  TextInput,
  Toggle,
  ToneBadge,
  cx,
  type IconName,
} from "@ge/ui";
import {
  MIN_SKILLS,
  PROFILE_SECTIONS,
  profileCompletion,
  type JobDetails,
  type LinkKind,
  type Profile,
  type ProfileSection,
  UNLOCK_PCT,
} from "@ge/core";
import { useShell } from "@/components/shell/ShellProvider";
import { saveJobProfile } from "@/server/actions/profile";
import { useUnsavedChanges } from "@/lib/useUnsavedChanges";
import { LockedBanner, Walkthrough, type WalkStep } from "./Walkthrough";

const STATUS = [
  "Undergraduate",
  "Postgraduate",
  "Recent graduate",
  "Working professional",
  "Career break",
];
const YEARS = Array.from({ length: 21 }, (_, i) => String(2031 - i));
const EXPERIENCE = ["Fresher", "Under 1 year", "1–3 years", "3–5 years", "5+ years"];
const AVAILABLE = [
  "Immediately",
  "Within 15 days",
  "Within 30 days",
  "Within 60 days",
  "After graduation",
];
const JOB_TYPES = ["Internship", "Full-time", "Part-time", "Contract"];
const WORK_MODES = ["Remote", "Hybrid", "On-site"];
const WORK_AUTH = [
  "Indian citizen",
  "Citizen of another country",
  "Need visa sponsorship",
  "Authorized to work in the US",
  "Authorized to work in the EU/UK",
];
const PRONOUNS = ["Prefer not to say", "he/him", "she/her", "they/them"];
const ENTRY_TYPES = ["Internship", "Full-time", "Part-time", "Contract", "Freelance"];
const LEVELS = ["Native", "Fluent", "Professional", "Conversational", "Basic"];
const DOC_TYPES = ["Resume", "Cover letter", "Transcript", "Certificate", "Offer letter", "Other"];
const DOC_ICON: Record<string, IconName> = {
  Resume: "file-text",
  "Cover letter": "mail",
  Transcript: "scroll-text",
  Certificate: "award",
  "Offer letter": "file-check",
};
const LINKS: [LinkKind, string, IconName | `img:${string}`, string][] = [
  ["linkedin", "LinkedIn", "img:/linkedin.svg", "linkedin.com/in/…"],
  ["github", "GitHub", "img:/github.png", "github.com/…"],
  ["portfolio", "Portfolio", "globe", "yourname.dev"],
  ["leetcode", "LeetCode", "code", "leetcode.com/u/…"],
  ["other", "Other", "link", "Behance, Kaggle, blog…"],
];
const TIER_TONE = { Strong: "success", Good: "primary", Basic: "warning" } as const;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function Section({ id, children }: { id: ProfileSection; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20 max-[1279px]:scroll-mt-[120px]">
      {children}
    </section>
  );
}

/** Pill-shaped option with a check when selected (status, job type, work mode). */
function ChoiceChip({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cx(
        "box-border inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border text-small transition-colors duration-(--duration-fast) ease-standard focus-visible:shadow-focus focus-visible:outline-none",
        on
          ? "border-primary-line bg-primary-soft pr-3 pl-2.5 font-medium text-primary-100"
          : "border-hairline-strong bg-surface-2 px-3 text-ink-muted hover:text-ink",
      )}
    >
      {on && <Icon name="check" size={14} className="text-primary" />}
      {label}
    </button>
  );
}

function AddRowButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <div className="px-5 py-4">
      <button
        type="button"
        onClick={onClick}
        className="box-border flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-hairline-strong text-small text-ink-muted transition-colors duration-(--duration-base) hover:border-primary-line hover:bg-primary-soft hover:text-ink focus-visible:shadow-focus focus-visible:outline-none"
      >
        <Icon name="plus" size={15} className="text-primary" />
        {children}
      </button>
    </div>
  );
}

/** A collapsible entry: summary row with edit and remove, and its fields when open. */
function EntryRow({
  lead,
  title,
  sub,
  open,
  onToggle,
  onRemove,
  preview,
  children,
}: {
  lead: ReactNode;
  title: string;
  sub: string;
  open: boolean;
  onToggle: () => void;
  onRemove: () => void;
  preview?: string;
  children: ReactNode;
}) {
  return (
    <div className={cx("border-b border-hairline", open && "bg-surface-2")}>
      <div className="flex items-center gap-2 py-3 pr-3 pl-5">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left focus-visible:outline-none"
        >
          <span className="box-border inline-flex size-8 flex-none items-center justify-center rounded-md border border-hairline-strong bg-surface-2 text-small font-semibold text-ink">
            {lead}
          </span>
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate text-small font-medium text-ink">{title}</span>
            <span className="truncate text-caption text-ink-subtle">{sub}</span>
          </span>
        </button>
        <IconButton
          icon={open ? "chevron-up" : "pencil"}
          title={open ? "Collapse" : "Edit"}
          onClick={onToggle}
        />
        <IconButton icon="trash-2" title="Remove" onClick={onRemove} />
      </div>
      {!open && preview && (
        <p className="m-0 pr-5 pb-3.5 pl-16 text-small leading-[1.55] text-pretty text-ink-muted max-md:pl-5">
          {preview}
        </p>
      )}
      {open && (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3.5 pt-1 pr-5 pb-5 pl-16 max-md:pl-5">
          {children}
        </div>
      )}
    </div>
  );
}

function DocModal({
  library,
  attached,
  onClose,
  onAdd,
}: {
  library: { id: string; name: string; meta: string }[];
  attached: string[];
  onClose: () => void;
  onAdd: (docs: JobDetails["documents"]) => void;
}) {
  const [tab, setTab] = useState<"From Documents" | "Upload file">("From Documents");
  const [pick, setPick] = useState<string[]>([]);
  const [type, setType] = useState("Certificate");
  const [up, setUp] = useState<{
    state: "idle" | "uploading" | "done";
    name?: string;
    size?: string;
    key?: string;
    error?: string;
  }>({ state: "idle" });
  const upload = async (file: File) => {
    setUp({ state: "uploading", name: file.name });
    const body = new FormData();
    body.append("file", file);
    const res = await fetch("/api/uploads/document", { method: "POST", body });
    const json = (await res.json().catch(() => ({}))) as { key?: string; error?: string };
    if (!res.ok || !json.key)
      return setUp({ state: "idle", error: json.error ?? "That upload didn't work. Try again." });
    setUp({
      state: "done",
      name: file.name,
      size: `${(file.size / 1_048_576).toFixed(1)} MB`,
      key: json.key,
    });
  };
  const today = new Date();
  const confirm = () => {
    if (tab === "From Documents")
      onAdd(
        library
          .filter((d) => pick.includes(d.id))
          .map((d) => ({
            id: d.id,
            name: d.name,
            type: "Resume",
            meta: `From Documents · ${d.meta}`,
            resumeId: d.id,
          })),
      );
    else if (up.key)
      onAdd([
        {
          id: up.key,
          name: up.name!,
          type,
          meta: `Uploaded · ${up.size} · ${MONTHS[today.getMonth()]} ${today.getDate()}`,
          key: up.key,
        },
      ]);
  };
  return (
    <Modal
      open
      onClose={onClose}
      title="Add document"
      sub="Attach a file you already have in Documents, or upload a new one."
      width={560}
      footer={
        <>
          <Button variant="tertiary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={confirm}
            disabled={tab === "From Documents" ? pick.length === 0 : up.state !== "done"}
          >
            {tab === "From Documents"
              ? pick.length > 1
                ? `Attach ${pick.length} files`
                : "Attach"
              : "Upload"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Segmented
          label="Source"
          options={["From Documents", "Upload file"]}
          value={tab}
          onChange={(v) => setTab(v as typeof tab)}
        />
        {tab === "From Documents" ? (
          <>
            <div className="flex flex-col overflow-hidden rounded-md border border-hairline">
              {library.map((d) => {
                const already = attached.includes(d.id);
                const sel = already || pick.includes(d.id);
                return (
                  <button
                    key={d.id}
                    type="button"
                    disabled={already}
                    aria-pressed={sel}
                    onClick={() =>
                      setPick((p) =>
                        p.includes(d.id) ? p.filter((x) => x !== d.id) : [...p, d.id],
                      )
                    }
                    className={cx(
                      "flex items-center gap-3 border-b border-hairline px-3.5 py-3 text-left last:border-b-0 focus-visible:bg-surface-2 focus-visible:outline-none",
                      already ? "cursor-default opacity-55" : "cursor-pointer",
                      sel && !already && "bg-primary-soft",
                    )}
                  >
                    <span
                      className={cx(
                        "inline-flex size-[18px] flex-none items-center justify-center rounded-xs text-on-primary",
                        sel ? "bg-primary" : "border border-hairline-tertiary",
                      )}
                    >
                      {sel && <Icon name="check" size={12} />}
                    </span>
                    <span className="flex flex-1 flex-col gap-0.5">
                      <span className="text-small text-ink">{d.name}</span>
                      <span className="text-caption text-ink-subtle">
                        {already ? `${d.meta} · already attached` : d.meta}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
            <Link
              href="/documents"
              className="text-caption text-ink-subtle no-underline hover:text-ink"
            >
              Manage documents →
            </Link>
          </>
        ) : (
          <>
            <Dropzone
              title="Drop a file here"
              hint="PDF, DOCX or image, up to 10 MB"
              accept=".pdf,.docx,.png,.jpg"
              buttonLabel="Choose file"
              state={up.state}
              fileName={up.name}
              fileSize={up.size}
              progress={up.state === "uploading" ? 60 : 100}
              onFile={(f) => void upload(f)}
              onRemove={() => setUp({ state: "idle" })}
            />
            {up.error && (
              <p role="alert" className="m-0 text-small text-danger-ink">
                {up.error}
              </p>
            )}
            <Dropdown label="Document type" options={DOC_TYPES} value={type} onChange={setType} />
          </>
        )}
      </div>
    </Modal>
  );
}

let newId = 0;
const nextKey = () => `new-${++newId}`;

const WELCOMED = "ge-profile-welcomed";

export function JobProfile({
  initial,
  library,
  locked: initialLocked,
  firstName,
}: {
  initial: { doc: Profile; details: JobDetails };
  library: { id: string; name: string; meta: string }[];
  /** A new account: the rest of the app opens once this profile is saved at UNLOCK_PCT. */
  locked: boolean;
  firstName: string;
}) {
  const router = useRouter();
  const { setDockOpen } = useShell();
  const [doc, setDoc] = useState(initial.doc);
  const [d, setD] = useState(initial.details);
  // What the server has; edits are only stored when Save is selected.
  const [saved, setSaved] = useState(() =>
    JSON.stringify({ doc: initial.doc, details: initial.details }),
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [locked, setLocked] = useState(initialLocked);
  const [walk, setWalk] = useState<WalkStep>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  // Stable keys for list entries, so open/closed state follows the entry.
  const [keys, setKeys] = useState(() => ({
    education: initial.doc.education.map(nextKey),
    experience: initial.doc.experience.map(nextKey),
    certifications: initial.doc.certifications.map(nextKey),
  }));
  const [showSalary, setShowSalary] = useState(false);
  const [skillDraft, setSkillDraft] = useState<string | null>(null);
  const [docModal, setDocModal] = useState(false);
  const [active, setActive] = useState<ProfileSection>("basics");

  const dirty = JSON.stringify({ doc, details: d }) !== saved;
  const save = async (): Promise<boolean> => {
    setSaving(true);
    setSaveError(null);
    try {
      const r = await saveJobProfile({ doc, details: d });
      setSaved(JSON.stringify({ doc, details: d }));
      if (r.unlocked) {
        setLocked(false);
        setWalk("unlocked");
        router.refresh();
      } else if (walk === "ready") setWalk(null);
      return true;
    } catch {
      setSaveError("We couldn't save your profile. Check the highlighted fields and try again.");
      return false;
    } finally {
      setSaving(false);
    }
  };
  const discard = () => {
    const base = JSON.parse(saved) as { doc: Profile; details: JobDetails };
    setDoc(base.doc);
    setD(base.details);
  };
  const leaveGuard = useUnsavedChanges(dirty, save);
  const editDoc = (next: Profile) => setDoc(next);
  const editDetails = (patch: Partial<JobDetails>) => setD((cur) => ({ ...cur, ...patch }));
  const contact = (patch: Partial<Profile["contact"]>) =>
    editDoc({ ...doc, contact: { ...doc.contact, ...patch } });

  type ListKey = "education" | "experience" | "certifications";
  const setItem = <K extends ListKey>(key: K, i: number, patch: Partial<Profile[K][number]>) =>
    editDoc({ ...doc, [key]: doc[key].map((x, j) => (j === i ? { ...x, ...patch } : x)) });
  const addItem = <K extends ListKey>(key: K, item: Profile[K][number]) => {
    const k = nextKey();
    setKeys((ks) => ({ ...ks, [key]: [...ks[key], k] }));
    setOpen((o) => ({ ...o, [k]: true }));
    editDoc({ ...doc, [key]: [...doc[key], item] });
  };
  const removeItem = (key: ListKey, i: number) => {
    setKeys((ks) => ({ ...ks, [key]: ks[key].filter((_, j) => j !== i) }));
    editDoc({ ...doc, [key]: doc[key].filter((_, j) => j !== i) });
  };
  const toggle = (k: string) => setOpen((o) => ({ ...o, [k]: !o[k] }));

  const allSkills = doc.skills.flatMap((g) => g.items);
  const addSkill = (name: string) => {
    const v = name.trim();
    if (!v || allSkills.some((s) => s.toLowerCase() === v.toLowerCase())) return;
    const tools = doc.skills.findIndex((g) => /tools/i.test(g.name));
    const i = tools === -1 ? doc.skills.length - 1 : tools;
    editDoc({
      ...doc,
      skills:
        i === -1
          ? [{ name: "Skills", items: [v] }]
          : doc.skills.map((g, j) => (j === i ? { ...g, items: [...g.items, v] } : g)),
    });
  };
  const removeSkill = (name: string) =>
    editDoc({
      ...doc,
      skills: doc.skills.map((g) => ({ ...g, items: g.items.filter((s) => s !== name) })),
    });

  const c = profileCompletion(doc, d);
  const studying = d.status === "Undergraduate" || d.status === "Postgraduate";
  const initials = doc.contact.name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const heroMeta: [IconName, string][] = [
    ["map-pin", doc.contact.loc],
    ["graduation-cap", d.status ? `${d.status}${d.year ? ` · class of ${d.year}` : ""}` : ""],
    ["user-round", d.pronouns !== "Prefer not to say" ? d.pronouns : ""],
    ["calendar", d.availableFrom ? `Available ${d.availableFrom.toLowerCase()}` : ""],
  ].filter((m): m is [IconName, string] => !!m[1]);

  // Scroll spy for the section navigation.
  useEffect(() => {
    const els = PROFILE_SECTIONS.map(([id]) => document.getElementById(id)).filter(
      (e): e is HTMLElement => !!e,
    );
    const io = new IntersectionObserver(
      (entries) => {
        const top = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (top) setActive(top.target.id as ProfileSection);
      },
      { rootMargin: "-120px 0px -60% 0px", threshold: 0 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  // First visit of a new account: the welcome card, once per device.
  useEffect(() => {
    if (!initialLocked) return;
    try {
      if (localStorage.getItem(WELCOMED)) return;
    } catch {
      // Storage blocked: show it anyway.
    }
    const t = setTimeout(() => setWalk("welcome"), 250);
    return () => clearTimeout(t);
  }, [initialLocked]);

  // Reaching the bottom with enough filled in: prompt to save and unlock.
  const readyToUnlock = locked && c.pct >= UNLOCK_PCT;
  useEffect(() => {
    const el = bottomRef.current;
    if (!el || !readyToUnlock) return;
    const io = new IntersectionObserver(([e]) => {
      if (e?.isIntersecting) setWalk((w) => w ?? "ready");
    });
    io.observe(el);
    return () => io.disconnect();
  }, [readyToUnlock]);
  const closeWalk = () => {
    if (walk === "welcome") {
      try {
        localStorage.setItem(WELCOMED, "1");
      } catch {
        // Storage blocked: it may show again next visit.
      }
    }
    setWalk(null);
  };
  const useAi = () => {
    closeWalk();
    setDockOpen(true);
  };

  const go = (id: ProfileSection) => {
    const el = document.getElementById(id);
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    setActive(id);
  };

  const inputs = "grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4";
  return (
    <>
      {/* Narrow screens: section pills under the top bar. */}
      <div className="sticky top-14 z-4 border-b border-hairline bg-canvas min-[1280px]:hidden">
        <nav
          aria-label="Profile sections"
          className="mx-auto box-border flex max-w-[1200px] gap-1.5 overflow-x-auto px-6 py-2.5 max-md:px-4"
        >
          {PROFILE_SECTIONS.map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              onClick={(e) => {
                e.preventDefault();
                go(id);
              }}
              aria-current={active === id ? "true" : undefined}
              className={cx(
                "box-border inline-flex h-[30px] flex-none items-center gap-1.5 rounded-full border px-3 text-small whitespace-nowrap no-underline",
                active === id
                  ? "border-primary-line bg-primary-soft text-primary-100"
                  : "border-hairline bg-surface-1 text-ink-muted",
              )}
            >
              {c.done[id] ? (
                <Icon name="circle-check" size={15} className="text-primary" />
              ) : (
                <span className="box-border size-[15px] flex-none rounded-full border-[1.5px] border-dashed border-warning-ink" />
              )}
              {label}
            </a>
          ))}
        </nav>
      </div>

      <main className="mx-auto box-border grid w-full max-w-[1200px] grid-cols-1 items-start gap-8 px-8 pt-8 pb-24 max-md:px-4 max-md:pt-5 min-[1280px]:grid-cols-[minmax(0,1fr)_220px]">
        <div className="flex min-w-0 flex-col gap-5">
          <section className="overflow-hidden rounded-lg border border-hairline bg-surface-1 shadow-edge">
            <div className="flex flex-wrap items-center gap-5 p-6 max-md:p-4">
              <span className="box-border flex size-[72px] flex-none items-center justify-center rounded-full border border-hairline-strong bg-surface-3 text-title font-semibold text-ink">
                {initials}
              </span>
              <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-1.5">
                <h1 className="m-0 text-headline leading-[1.15] font-semibold tracking-[-0.8px] text-ink">
                  {doc.contact.name}
                </h1>
                <span className="text-body leading-normal text-pretty text-ink-muted">
                  {d.headline}
                </span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {heroMeta.map(([icon, label]) => (
                    <span
                      key={icon}
                      className="box-border inline-flex h-[26px] items-center gap-1.5 rounded-full border border-hairline bg-surface-2 px-2.5 text-caption whitespace-nowrap text-ink-muted"
                    >
                      <Icon name={icon} size={13} className="text-ink" />
                      {label}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex flex-none items-center gap-2">
                <Button
                  variant="secondary"
                  iconLeft={<Icon name="sparkles" size={15} className="text-primary" />}
                  onClick={useAi}
                >
                  Edit with AI
                </Button>
                <Button disabled={!dirty || saving} onClick={() => void save()}>
                  {saving ? "Saving…" : dirty ? "Save" : "Saved"}
                </Button>
              </div>
            </div>
          </section>

          {locked && <LockedBanner pct={c.pct} onUseAi={useAi} />}

          <section className="flex items-center gap-5 rounded-lg border border-hairline bg-surface-1 px-6 py-5 shadow-edge max-md:px-4">
            <MatchRing value={c.pct} size={64} />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="flex flex-wrap items-center gap-2.5">
                <span className="text-body font-semibold text-ink">Profile strength</span>
                <ToneBadge tone={TIER_TONE[c.tier]}>{c.tier}</ToneBadge>
              </span>
              <span className="text-small text-pretty text-ink-subtle">
                Complete profiles rank higher in recruiter search and fill applications with fewer
                gaps.
              </span>
            </div>
          </section>

          <Section id="basics">
            <Panel
              icon="user-round"
              title="Basics"
              sub="Name and contact details recruiters see first."
              padded
            >
              <div className={inputs}>
                <TextInput
                  label="Full name"
                  value={doc.contact.name}
                  onChange={(e) => contact({ name: e.target.value })}
                />
                <Dropdown
                  label="Pronouns"
                  options={PRONOUNS}
                  value={d.pronouns}
                  onChange={(v) => editDetails({ pronouns: v })}
                />
              </div>
              <TextInput
                label="Headline"
                value={d.headline}
                onChange={(e) => editDetails({ headline: e.target.value })}
                hint="One line. Shown on outreach and at the top of your resume."
              />
              <div className={inputs}>
                <TextInput
                  label="Email"
                  type="email"
                  value={doc.contact.email}
                  onChange={(e) => contact({ email: e.target.value })}
                />
                <TextInput
                  label="Phone"
                  type="tel"
                  value={doc.contact.phone}
                  onChange={(e) => contact({ phone: e.target.value })}
                />
                <TextInput
                  label="Current city"
                  value={doc.contact.loc}
                  onChange={(e) => contact({ loc: e.target.value })}
                />
                <TextInput
                  label="Date of birth"
                  type="date"
                  value={d.dob}
                  onChange={(e) => editDetails({ dob: e.target.value })}
                />
              </div>
            </Panel>
          </Section>

          <Section id="status">
            <Panel
              icon="graduation-cap"
              title="Current status"
              sub="Decides whether you see internships, new-grad or experienced roles."
              padded
            >
              <div className="flex flex-col gap-2.5">
                <span className="text-small font-medium text-ink-muted">Status</span>
                <div className="flex flex-wrap gap-2">
                  {STATUS.map((s) => (
                    <ChoiceChip
                      key={s}
                      label={s}
                      on={d.status === s}
                      onClick={() => editDetails({ status: s })}
                    />
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
                <Dropdown
                  label={studying ? "Expected graduation year" : "Graduation year"}
                  options={YEARS}
                  value={d.year}
                  onChange={(v) => editDetails({ year: v })}
                />
                <Dropdown
                  label="Total experience"
                  options={EXPERIENCE}
                  value={d.experience}
                  onChange={(v) => editDetails({ experience: v })}
                />
                <Dropdown
                  label="Available from"
                  options={AVAILABLE}
                  value={d.availableFrom}
                  onChange={(v) => editDetails({ availableFrom: v })}
                />
              </div>
            </Panel>
          </Section>

          <Section id="prefs">
            <Panel
              icon="sliders-horizontal"
              title="Job preferences"
              sub="Filters your feed. Salary fields are never shown to employers."
              padded
            >
              <TextInput
                label="Target roles"
                value={d.roles}
                onChange={(e) => editDetails({ roles: e.target.value })}
                hint="Comma separated"
              />
              <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
                {(
                  [
                    ["Job type", "jobTypes", JOB_TYPES],
                    ["Work mode", "workModes", WORK_MODES],
                  ] as const
                ).map(([label, key, options]) => (
                  <div key={key} className="flex flex-col gap-2.5">
                    <span className="text-small font-medium text-ink-muted">{label}</span>
                    <div className="flex flex-wrap gap-2">
                      {options.map((o) => {
                        const on = d[key].includes(o);
                        return (
                          <ChoiceChip
                            key={o}
                            label={o}
                            on={on}
                            onClick={() =>
                              editDetails({
                                [key]: on ? d[key].filter((x) => x !== o) : [...d[key], o],
                              })
                            }
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
                <TextInput
                  label="Preferred locations"
                  value={d.locations}
                  onChange={(e) => editDetails({ locations: e.target.value })}
                />
                <Dropdown
                  label="Work authorization"
                  options={WORK_AUTH}
                  value={d.workAuth}
                  onChange={(v) => editDetails({ workAuth: v })}
                />
              </div>
              <div className="flex flex-col gap-3.5 rounded-lg border border-hairline px-4 pt-3 pb-4 shadow-edge">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-caption text-ink-subtle">
                    <Icon name="lock" size={13} className="text-primary" />
                    Private to you. Used only to rank roles by pay.
                  </span>
                  <IconButton
                    icon={showSalary ? "eye-off" : "eye"}
                    title={showSalary ? "Hide salary" : "Show salary"}
                    onClick={() => setShowSalary(!showSalary)}
                  />
                </div>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
                  <TextInput
                    label="Expected salary"
                    type={showSalary ? "text" : "password"}
                    value={d.expectedSalary}
                    onChange={(e) => editDetails({ expectedSalary: e.target.value })}
                    placeholder="e.g. 8 LPA"
                    autoComplete="off"
                  />
                  <TextInput
                    label="Current salary (optional)"
                    type={showSalary ? "text" : "password"}
                    value={d.currentSalary}
                    onChange={(e) => editDetails({ currentSalary: e.target.value })}
                    placeholder="Leave blank if not working"
                    autoComplete="off"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="flex flex-col gap-0.5">
                  <span className="text-small font-medium text-ink">Open to relocating</span>
                  <span className="text-caption text-ink-subtle">
                    Shows on-site roles outside your preferred locations.
                  </span>
                </span>
                <Toggle
                  on={d.relocate}
                  onChange={(relocate) => editDetails({ relocate })}
                  label="Open to relocating"
                />
              </div>
            </Panel>
          </Section>

          <Section id="education">
            <Panel
              icon="school"
              title="Education"
              meta={`${doc.education.length} ${doc.education.length === 1 ? "entry" : "entries"}`}
            >
              {doc.education.map((e, i) => {
                const k = keys.education[i]!;
                return (
                  <EntryRow
                    key={k}
                    lead={<Icon name="graduation-cap" size={16} />}
                    title={[e.degree, e.field].filter(Boolean).join(", ") || "New education"}
                    sub={
                      [e.school, e.dates, e.score].filter(Boolean).join(" · ") ||
                      "Add institution and dates"
                    }
                    open={!!open[k]}
                    onToggle={() => toggle(k)}
                    onRemove={() => removeItem("education", i)}
                  >
                    <TextInput
                      label="Institution"
                      value={e.school}
                      onChange={(ev) => setItem("education", i, { school: ev.target.value })}
                    />
                    <TextInput
                      label="Degree"
                      value={e.degree}
                      onChange={(ev) => setItem("education", i, { degree: ev.target.value })}
                    />
                    <TextInput
                      label="Field of study"
                      value={e.field ?? ""}
                      onChange={(ev) => setItem("education", i, { field: ev.target.value })}
                    />
                    <TextInput
                      label="Start – end"
                      value={e.dates}
                      placeholder="2023 – 2027"
                      onChange={(ev) => setItem("education", i, { dates: ev.target.value })}
                    />
                    <TextInput
                      label="Grade"
                      value={e.score}
                      placeholder="8.4 CGPA or 86%"
                      onChange={(ev) => setItem("education", i, { score: ev.target.value })}
                    />
                  </EntryRow>
                );
              })}
              <AddRowButton
                onClick={() =>
                  addItem("education", { school: "", degree: "", field: "", dates: "", score: "" })
                }
              >
                Add education
              </AddRowButton>
            </Panel>
          </Section>

          <Section id="experience">
            <Panel icon="briefcase" title="Experience" sub="Internships, jobs and freelance work.">
              {doc.experience.map((x, i) => {
                const k = keys.experience[i]!;
                return (
                  <EntryRow
                    key={k}
                    lead={(x.co || x.role || "?").trim()[0]?.toUpperCase()}
                    title={[x.role, x.co].filter(Boolean).join(" · ") || "New experience"}
                    sub={x.dates || "Add dates"}
                    open={!!open[k]}
                    onToggle={() => toggle(k)}
                    onRemove={() => removeItem("experience", i)}
                    preview={x.summary}
                  >
                    <TextInput
                      label="Title"
                      value={x.role}
                      onChange={(ev) => setItem("experience", i, { role: ev.target.value })}
                    />
                    <TextInput
                      label="Company"
                      value={x.co}
                      onChange={(ev) => setItem("experience", i, { co: ev.target.value })}
                    />
                    <Dropdown
                      label="Type"
                      options={ENTRY_TYPES}
                      value={x.type ?? "Internship"}
                      onChange={(v) => setItem("experience", i, { type: v })}
                    />
                    <TextInput
                      label="Start – end"
                      value={x.dates}
                      placeholder="May 2025 – Jul 2025"
                      onChange={(ev) => setItem("experience", i, { dates: ev.target.value })}
                    />
                    <div className="col-span-full">
                      <TextArea
                        label="What you did"
                        rows={3}
                        value={x.summary ?? ""}
                        onChange={(ev) => setItem("experience", i, { summary: ev.target.value })}
                      />
                    </div>
                  </EntryRow>
                );
              })}
              <AddRowButton
                onClick={() =>
                  addItem("experience", {
                    role: "",
                    co: "",
                    type: "Internship",
                    dates: "",
                    summary: "",
                    bullets: [],
                  })
                }
              >
                Add experience
              </AddRowButton>
            </Panel>
          </Section>

          <Section id="skills">
            <Panel
              icon="wrench"
              title="Skills and languages"
              sub="Add at least five skills to match against job descriptions."
              padded
            >
              <div className="flex flex-col gap-2.5">
                <span className="flex items-baseline justify-between gap-3">
                  <span className="text-small font-medium text-ink-muted">Skills</span>
                  <span className="font-mono text-caption text-ink-subtle">
                    {c.skills} / {MIN_SKILLS} min
                  </span>
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {allSkills.map((s) => (
                    <Chip key={s} onRemove={() => removeSkill(s)} removeLabel={`Remove ${s}`}>
                      {s}
                    </Chip>
                  ))}
                  {skillDraft != null ? (
                    <form
                      className="inline-flex"
                      onSubmit={(e) => {
                        e.preventDefault();
                        addSkill(skillDraft);
                        setSkillDraft("");
                      }}
                    >
                      <input
                        autoFocus
                        value={skillDraft}
                        onChange={(e) => setSkillDraft(e.target.value)}
                        onBlur={() => {
                          addSkill(skillDraft);
                          setSkillDraft(null);
                        }}
                        onKeyDown={(e) => e.key === "Escape" && setSkillDraft(null)}
                        placeholder="Skill name"
                        aria-label="Add a skill"
                        className="box-border h-7 w-[140px] rounded-full border border-primary-line bg-surface-2 px-3 text-small text-ink outline-none"
                      />
                    </form>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSkillDraft("")}
                      className="box-border inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-full border border-dashed border-hairline-strong pr-3 pl-2.5 text-small text-ink-muted hover:border-primary-line hover:bg-primary-soft hover:text-ink focus-visible:shadow-focus focus-visible:outline-none"
                    >
                      <Icon name="plus" size={13} className="text-primary" />
                      Add
                    </button>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2.5 border-t border-hairline pt-4">
                <span className="text-small font-medium text-ink-muted">Languages</span>
                {d.languages.map((l, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-[minmax(0,1fr)_minmax(140px,200px)_32px] items-center gap-2.5"
                  >
                    <TextInput
                      aria-label="Language"
                      placeholder="Language"
                      value={l.name}
                      onChange={(e) =>
                        editDetails({
                          languages: d.languages.map((x, j) =>
                            j === i ? { ...x, name: e.target.value } : x,
                          ),
                        })
                      }
                    />
                    <Dropdown
                      options={LEVELS}
                      value={l.level}
                      onChange={(v) =>
                        editDetails({
                          languages: d.languages.map((x, j) => (j === i ? { ...x, level: v } : x)),
                        })
                      }
                    />
                    <IconButton
                      icon="trash-2"
                      title="Remove language"
                      onClick={() =>
                        editDetails({ languages: d.languages.filter((_, j) => j !== i) })
                      }
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    editDetails({
                      languages: [...d.languages, { name: "", level: "Professional" }],
                    })
                  }
                  className="inline-flex h-7 cursor-pointer items-center gap-1.5 self-start text-small text-ink-muted hover:text-ink focus-visible:shadow-focus focus-visible:outline-none"
                >
                  <Icon name="plus" size={14} className="text-primary" />
                  Add language
                </button>
              </div>
            </Panel>
          </Section>

          <Section id="certs">
            <Panel icon="award" title="Certifications and licenses">
              {doc.certifications.map((x, i) => {
                const k = keys.certifications[i]!;
                return (
                  <EntryRow
                    key={k}
                    lead={<Icon name="badge-check" size={16} />}
                    title={x.name || "New certification"}
                    sub={
                      [x.issuer, x.date && `Issued ${x.date}`].filter(Boolean).join(" · ") ||
                      "Add issuer and date"
                    }
                    open={!!open[k]}
                    onToggle={() => toggle(k)}
                    onRemove={() => removeItem("certifications", i)}
                  >
                    <TextInput
                      label="Name"
                      value={x.name}
                      onChange={(ev) => setItem("certifications", i, { name: ev.target.value })}
                    />
                    <TextInput
                      label="Issuer"
                      value={x.issuer}
                      onChange={(ev) => setItem("certifications", i, { issuer: ev.target.value })}
                    />
                    <TextInput
                      label="Issued"
                      value={x.date}
                      placeholder="Mar 2026"
                      onChange={(ev) => setItem("certifications", i, { date: ev.target.value })}
                    />
                    <TextInput
                      label="Expires"
                      value={x.expires ?? ""}
                      placeholder="No expiry"
                      onChange={(ev) => setItem("certifications", i, { expires: ev.target.value })}
                    />
                    <TextInput
                      label="Credential ID"
                      value={x.credentialId ?? ""}
                      onChange={(ev) =>
                        setItem("certifications", i, { credentialId: ev.target.value })
                      }
                    />
                    <TextInput
                      label="Credential URL"
                      value={x.url ?? ""}
                      placeholder="https://"
                      onChange={(ev) => setItem("certifications", i, { url: ev.target.value })}
                    />
                  </EntryRow>
                );
              })}
              <AddRowButton
                onClick={() =>
                  addItem("certifications", {
                    name: "",
                    issuer: "",
                    date: "",
                    expires: "",
                    credentialId: "",
                    url: "",
                  })
                }
              >
                Add certification
              </AddRowButton>
            </Panel>
          </Section>

          <Section id="links">
            <Panel
              icon="link-2"
              title="Links"
              sub="Added to your resume header and outreach signature."
            >
              {LINKS.map(([k, label, icon, placeholder]) => {
                const has = !!d.links[k]?.trim();
                return (
                  <div
                    key={k}
                    className="grid grid-cols-[32px_minmax(80px,120px)_minmax(0,1fr)] items-center gap-3 border-b border-hairline px-5 py-2.5 last:border-b-0 max-md:grid-cols-[32px_minmax(0,1fr)] max-md:px-4"
                  >
                    <span
                      className={cx(
                        "box-border flex size-8 items-center justify-center rounded-md border",
                        has
                          ? "border-primary-line bg-primary-soft text-primary"
                          : "border-hairline-strong bg-surface-2 text-ink",
                      )}
                    >
                      {icon.startsWith("img:") ? (
                        // eslint-disable-next-line @next/next/no-img-element -- small brand icons, as in the sidebar
                        <img
                          src={icon.slice(4)}
                          alt=""
                          width={16}
                          height={16}
                          className="block rounded-[3px]"
                        />
                      ) : (
                        <Icon name={icon as IconName} size={16} />
                      )}
                    </span>
                    <span className="text-small font-medium text-ink">{label}</span>
                    <TextInput
                      aria-label={`${label} link`}
                      className="max-md:col-span-full"
                      value={d.links[k] ?? ""}
                      placeholder={placeholder}
                      onChange={(e) => editDetails({ links: { ...d.links, [k]: e.target.value } })}
                    />
                  </div>
                );
              })}
            </Panel>
          </Section>

          <Section id="documents">
            <Panel
              icon="folder-open"
              title="Documents"
              sub="Attached when you apply. Pick from Documents or upload a file."
            >
              {d.documents.map((x) => (
                <div
                  key={x.id}
                  className="grid grid-cols-[32px_minmax(0,1fr)_32px] items-center gap-3 border-b border-hairline py-3 pr-3 pl-5"
                >
                  <span className="box-border flex size-8 items-center justify-center rounded-md border border-hairline-strong bg-surface-2 text-ink">
                    <Icon name={DOC_ICON[x.type] ?? "file"} size={16} />
                  </span>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate text-small font-medium text-ink">{x.name}</span>
                    <span className="truncate text-caption text-ink-subtle">{x.meta}</span>
                  </span>
                  <IconButton
                    icon="trash-2"
                    title="Remove document"
                    onClick={() =>
                      editDetails({ documents: d.documents.filter((y) => y.id !== x.id) })
                    }
                  />
                </div>
              ))}
              <AddRowButton onClick={() => setDocModal(true)}>Add document</AddRowButton>
            </Panel>
          </Section>

          <Section id="voluntary">
            <Panel
              icon="shield-check"
              title="Voluntary disclosures"
              sub="Optional. Only used to fill employer forms that ask. Never shown on your profile."
              padded
            >
              <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
                <Dropdown
                  label="Gender"
                  options={["Prefer not to say", "Woman", "Man", "Non-binary", "Self-describe"]}
                  value={d.gender}
                  onChange={(v) => editDetails({ gender: v })}
                />
                <Dropdown
                  label="Disability"
                  options={["Prefer not to say", "No", "Yes"]}
                  value={d.disability}
                  onChange={(v) => editDetails({ disability: v })}
                />
              </div>
            </Panel>
          </Section>
          <div ref={bottomRef} aria-hidden="true" className="h-px" />
        </div>

        <aside className="sticky top-[84px] hidden flex-col gap-3 min-[1280px]:flex">
          <div className="flex items-baseline justify-between px-2.5">
            <span className="text-caption font-medium tracking-[0.4px] text-ink-subtle uppercase">
              Sections
            </span>
            <span className="font-mono text-caption text-primary-200">
              {c.doneCount}/{PROFILE_SECTIONS.length}
            </span>
          </div>
          <nav aria-label="Profile sections" className="flex flex-col gap-0.5">
            {PROFILE_SECTIONS.map(([id, label]) => {
              const on = active === id;
              return (
                <a
                  key={id}
                  href={`#${id}`}
                  aria-current={on ? "true" : undefined}
                  onClick={(e) => {
                    e.preventDefault();
                    go(id);
                  }}
                  className={cx(
                    "relative flex h-[34px] items-center gap-2.5 rounded-sm px-2.5 text-small no-underline hover:bg-surface-1 hover:text-ink",
                    on ? "bg-surface-2 font-medium text-ink" : "text-ink-subtle",
                  )}
                >
                  <span
                    className={cx(
                      "absolute inset-y-2 left-0 w-0.5 rounded-[2px]",
                      on && "bg-primary",
                    )}
                  />
                  {c.done[id] ? (
                    <Icon name="circle-check" size={15} className="text-primary" />
                  ) : (
                    <span className="box-border size-[15px] flex-none rounded-full border-[1.5px] border-dashed border-warning-ink" />
                  )}
                  <span className="min-w-0 flex-1">{label}</span>
                </a>
              );
            })}
          </nav>
        </aside>
      </main>

      {dirty && (
        <div
          role="region"
          aria-label="Unsaved changes"
          className="sticky bottom-4 z-10 mx-auto mb-4 box-border flex w-[min(640px,calc(100%-32px))] flex-wrap items-center gap-3 rounded-lg border border-hairline-strong bg-surface-2 px-4 py-3 shadow-edge max-md:bottom-[72px]"
        >
          <Icon name="circle-alert" size={16} className="flex-none text-warning-ink" />
          <span className="min-w-0 flex-1 text-small text-ink">
            {saveError ?? "You have unsaved changes."}
          </span>
          <Button variant="tertiary" size="sm" disabled={saving} onClick={discard}>
            Discard
          </Button>
          <Button size="sm" disabled={saving} onClick={() => void save()}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      )}
      {leaveGuard}
      <Walkthrough
        step={walk}
        firstName={firstName}
        pct={c.pct}
        onClose={closeWalk}
        onUseAi={useAi}
        onSave={() => void save()}
        onOpenJobs={() => router.push("/jobs")}
      />

      {docModal && (
        <DocModal
          library={library}
          attached={d.documents.map((x) => x.resumeId ?? x.id)}
          onClose={() => setDocModal(false)}
          onAdd={(docs) => {
            editDetails({ documents: [...d.documents, ...docs] });
            setDocModal(false);
          }}
        />
      )}
    </>
  );
}
