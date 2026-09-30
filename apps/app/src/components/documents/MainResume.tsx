"use client";
import { useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Chip,
  IconButton,
  MatchRing,
  PageHeader,
  Panel,
  Segmented,
  TextArea,
  TextInput,
  cx,
} from "@ge/ui";
import { atsScore, templateName, toLatex, type Profile } from "@ge/core";
import { saveMainLatex, saveMainResume, setMainTemplate } from "@/server/actions/documents";
import type { MainResume as MainResumeData } from "@/server/documents";
import { AssistantHint, LatexEditor, TemplatePicker } from "./DocBlocks";
import { PreviewAside, ToolIcon, exportResume } from "./PreviewAside";

const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const SAVE_DELAY = 800;

type Entry = Record<string, unknown>;

/** Fields for one list entry, its bullets and a remove button. */
function EntryEditor({
  fields,
  value,
  onField,
  bullets,
  onBullets,
  onRemove,
  removeLabel,
}: {
  fields: [string, string][];
  value: Entry;
  onField: (key: string, v: string) => void;
  bullets?: string[];
  onBullets?: (b: string[]) => void;
  onRemove: () => void;
  removeLabel: string;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-hairline pb-4">
      <div className="flex items-start gap-2">
        <div className="grid flex-1 grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3">
          {fields.map(([key, label]) => (
            <TextInput
              key={key}
              label={label}
              value={String(value[key] ?? "")}
              onChange={(e) => onField(key, e.target.value)}
            />
          ))}
        </div>
        <span className="pt-6">
          <IconButton icon="trash-2" title={removeLabel} onClick={onRemove} size={32} />
        </span>
      </div>
      {bullets && onBullets && (
        <>
          {bullets.map((b, i) => (
            <TextArea
              key={i}
              aria-label={`Bullet ${i + 1}`}
              rows={2}
              value={b}
              onChange={(e) => onBullets(bullets.map((x, j) => (j === i ? e.target.value : x)))}
              placeholder="Describe what you did and the result"
            />
          ))}
          <button
            type="button"
            onClick={() => onBullets([...bullets, ""])}
            className="box-border w-full cursor-pointer rounded-md border border-dashed border-hairline-strong px-3.5 py-2 text-center text-small font-medium text-ink-subtle transition-colors duration-(--duration-base) hover:bg-surface-2 hover:text-ink focus-visible:shadow-focus focus-visible:outline-none"
          >
            + Add bullet
          </button>
        </>
      )}
    </div>
  );
}

function SkillGroup({
  name,
  items,
  onChange,
}: {
  name: string;
  items: string[];
  onChange: (items: string[]) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const commit = () => {
    const v = draft.trim();
    if (v && !items.some((i) => i.toLowerCase() === v.toLowerCase())) onChange([...items, v]);
    setDraft("");
    setAdding(false);
  };
  return (
    <div className="grid grid-cols-[110px_minmax(0,1fr)] items-center gap-3 max-md:grid-cols-1 max-md:gap-2">
      <span className="text-small text-ink-subtle">{name}</span>
      <div className="flex flex-wrap gap-1.5">
        {items.map((k) => (
          <Chip
            key={k}
            onRemove={() => onChange(items.filter((x) => x !== k))}
            removeLabel={`Remove ${k}`}
          >
            {k}
          </Chip>
        ))}
        {adding ? (
          <input
            autoFocus
            aria-label={`Add to ${name}`}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") {
                setDraft("");
                setAdding(false);
              }
            }}
            className="box-border h-7 w-32 rounded-full border border-primary bg-surface-1 px-3 text-ui text-ink outline-none"
          />
        ) : (
          <Chip icon="plus" dashed onClick={() => setAdding(true)}>
            Add
          </Chip>
        )}
      </div>
    </div>
  );
}

const AddButton = ({ onClick, children }: { onClick: () => void; children: ReactNode }) => (
  <div className="flex">
    <Button size="sm" onClick={onClick}>
      {children}
    </Button>
  </div>
);

export function MainResume({
  data,
  keywords,
  postings,
  role,
}: {
  data: MainResumeData;
  keywords: string[];
  postings: number;
  role: string | null;
}) {
  const router = useRouter();
  const [doc, setDoc] = useState<Profile>(data.doc);
  const [template, setTemplate] = useState(data.template);
  const [latex, setLatex] = useState<string | null>(data.latex);
  const [mode, setMode] = useState<"Visual" | "Code">(data.latex ? "Code" : "Visual");
  const [status, setStatus] = useState<"saved" | "saving">("saved");
  const [picker, setPicker] = useState(false);
  const [, start] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const schedule = (save: () => Promise<unknown>) => {
    setStatus("saving");
    clearTimeout(timer.current);
    timer.current = setTimeout(
      () =>
        start(async () => {
          await save();
          setStatus("saved");
        }),
      SAVE_DELAY,
    );
  };
  const change = (next: Profile) => {
    setDoc(next);
    schedule(() => saveMainResume(next));
  };
  const editLatex = (v: string | null) => {
    setLatex(v);
    schedule(() => saveMainLatex(v));
  };

  const ats = useMemo(() => atsScore(doc, keywords), [doc, keywords]);
  const code = latex ?? toLatex(doc, templateName(template));

  // Edits to the repeated sections (called from event handlers only).
  type ListKey = "education" | "experience" | "projects" | "certifications" | "leadership";
  const setItem = <K extends ListKey>(key: K, i: number, patch: Partial<Profile[K][number]>) =>
    change({ ...doc, [key]: doc[key].map((x, j) => (j === i ? { ...x, ...patch } : x)) });
  const addItem = <K extends ListKey>(key: K, item: Profile[K][number]) =>
    change({ ...doc, [key]: [...doc[key], item] });
  const removeItem = (key: ListKey, i: number) =>
    change({ ...doc, [key]: doc[key].filter((_, j) => j !== i) });

  return (
    <>
      <PageHeader
        title="Main resume"
        sub="Everything we know about you. Tailored resumes are generated from this and never change it."
      >
        <div className="flex max-w-[420px] items-center gap-3 rounded-lg border border-hairline bg-surface-1 py-2.5 pr-4 pl-3 shadow-edge">
          <MatchRing value={ats.score} size={44} />
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-small font-medium">ATS score · {ats.score} / 100</span>
            <span className="text-caption text-pretty text-ink-subtle">
              {postings > 0
                ? `Scored against ${postings} ${role ? `${role.toLowerCase()} ` : ""}postings.`
                : "Scored on structure and wording. Save or search for jobs to score against real postings."}
              {ats.tip ? ` ${ats.tip}` : ""}
            </span>
          </div>
        </div>
      </PageHeader>

      <div
        className={cx("flex flex-wrap gap-6", mode === "Code" ? "items-stretch" : "items-start")}
      >
        <div className="flex min-w-0 flex-[1_1_520px] flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Segmented
              label="Editor"
              options={[
                { value: "Visual", icon: "pencil-line" },
                { value: "Code", icon: "code" },
              ]}
              value={mode}
              onChange={(v) => setMode(v as "Visual" | "Code")}
            />
            <div className="flex items-center gap-2">
              {mode === "Code" && latex != null && (
                <Button variant="tertiary" size="sm" onClick={() => editLatex(null)}>
                  Use generated code
                </Button>
              )}
              <span className="text-caption text-ink-subtle" aria-live="polite">
                {status === "saving" ? "Saving…" : "All changes saved"}
              </span>
            </div>
          </div>
          <AssistantHint id="resume-ai" />

          {mode === "Code" ? (
            // Zero intrinsic height: the column stretches to the preview, and the editor fills it.
            <div className="min-h-[480px] flex-[1_1_0px]">
              <LatexEditor
                fill
                value={code}
                onChange={editLatex}
                hint={
                  latex != null
                    ? "Edited by hand. Visual edits no longer update this code."
                    : "Generated from your main resume. Compiles to the PDF on download."
                }
              />
            </div>
          ) : (
            <>
              <Panel title="Contact" padded>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
                  {(
                    [
                      ["name", "Full name"],
                      ["email", "Email"],
                      ["phone", "Phone"],
                      ["loc", "Location"],
                    ] as const
                  ).map(([key, label]) => (
                    <TextInput
                      key={key}
                      label={label}
                      value={doc.contact[key]}
                      onChange={(e) =>
                        change({ ...doc, contact: { ...doc.contact, [key]: e.target.value } })
                      }
                    />
                  ))}
                </div>
              </Panel>
              <Panel title="Summary" sub="Two or three lines at the top of the resume" padded>
                <TextArea
                  aria-label="Summary"
                  rows={3}
                  value={doc.summary}
                  onChange={(e) => change({ ...doc, summary: e.target.value })}
                  placeholder="Who you are, what you build, and one result"
                />
              </Panel>
              <Panel
                title="Education"
                meta={count(doc.education.length, "entry", "entries")}
                padded
              >
                {doc.education.map((e, i) => (
                  <EntryEditor
                    key={i}
                    fields={[
                      ["school", "School"],
                      ["degree", "Degree"],
                      ["dates", "Dates"],
                      ["score", "Grade"],
                    ]}
                    value={e}
                    onField={(k, v) => setItem("education", i, { [k]: v })}
                    onRemove={() => removeItem("education", i)}
                    removeLabel="Remove education"
                  />
                ))}
                <AddButton
                  onClick={() =>
                    addItem("education", { school: "", degree: "", dates: "", score: "" })
                  }
                >
                  + Add education
                </AddButton>
              </Panel>
              <Panel title="Experience" meta={count(doc.experience.length, "role", "roles")} padded>
                {doc.experience.map((x, i) => (
                  <EntryEditor
                    key={i}
                    fields={[
                      ["role", "Role"],
                      ["co", "Company"],
                      ["dates", "Dates"],
                    ]}
                    value={x}
                    onField={(k, v) => setItem("experience", i, { [k]: v })}
                    bullets={x.bullets}
                    onBullets={(bullets) => setItem("experience", i, { bullets })}
                    onRemove={() => removeItem("experience", i)}
                    removeLabel="Remove experience"
                  />
                ))}
                <AddButton
                  onClick={() =>
                    addItem("experience", { role: "", co: "", dates: "", bullets: [""] })
                  }
                >
                  + Add experience
                </AddButton>
              </Panel>
              <Panel
                title="Projects"
                meta={count(doc.projects.length, "project", "projects")}
                padded
              >
                {doc.projects.map((x, i) => (
                  <EntryEditor
                    key={i}
                    fields={[
                      ["name", "Project"],
                      ["stack", "Tech stack"],
                    ]}
                    value={x}
                    onField={(k, v) => setItem("projects", i, { [k]: v })}
                    bullets={x.bullets}
                    onBullets={(bullets) => setItem("projects", i, { bullets })}
                    onRemove={() => removeItem("projects", i)}
                    removeLabel="Remove project"
                  />
                ))}
                <AddButton
                  onClick={() => addItem("projects", { name: "", stack: "", bullets: [""] })}
                >
                  + Add project
                </AddButton>
              </Panel>
              <Panel title="Skills" sub="Grouped as they appear on the resume" padded>
                {doc.skills.map((g, i) => (
                  <SkillGroup
                    key={g.name}
                    name={g.name}
                    items={g.items}
                    onChange={(items) =>
                      change({
                        ...doc,
                        skills: doc.skills.map((x, j) => (j === i ? { ...x, items } : x)),
                      })
                    }
                  />
                ))}
              </Panel>
              <Panel
                title="Certifications"
                meta={count(doc.certifications.length, "certificate", "certificates")}
                padded
              >
                {doc.certifications.map((c, i) => (
                  <EntryEditor
                    key={i}
                    fields={[
                      ["name", "Certification"],
                      ["issuer", "Issuer"],
                      ["date", "Date"],
                    ]}
                    value={c}
                    onField={(k, v) => setItem("certifications", i, { [k]: v })}
                    onRemove={() => removeItem("certifications", i)}
                    removeLabel="Remove certification"
                  />
                ))}
                <AddButton
                  onClick={() => addItem("certifications", { name: "", issuer: "", date: "" })}
                >
                  + Add certification
                </AddButton>
              </Panel>
              <Panel
                title="Achievements"
                sub="Awards, competitions, rankings"
                meta={count(doc.achievements.length, "item", "items")}
                padded
              >
                {doc.achievements.map((a, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <TextArea
                      className="flex-1"
                      aria-label={`Achievement ${i + 1}`}
                      rows={2}
                      value={a}
                      onChange={(e) =>
                        change({
                          ...doc,
                          achievements: doc.achievements.map((x, j) =>
                            j === i ? e.target.value : x,
                          ),
                        })
                      }
                      placeholder="e.g. Winner, national hackathon (1st of 200 teams)"
                    />
                    <IconButton
                      icon="trash-2"
                      title="Remove achievement"
                      onClick={() =>
                        change({ ...doc, achievements: doc.achievements.filter((_, j) => j !== i) })
                      }
                      size={32}
                    />
                  </div>
                ))}
                <AddButton
                  onClick={() => change({ ...doc, achievements: [...doc.achievements, ""] })}
                >
                  + Add achievement
                </AddButton>
              </Panel>
              <Panel
                title="Leadership & activities"
                sub="Clubs, volunteering, student bodies"
                meta={count(doc.leadership.length, "activity", "activities")}
                padded
              >
                {doc.leadership.map((x, i) => (
                  <EntryEditor
                    key={i}
                    fields={[
                      ["role", "Role"],
                      ["org", "Organisation"],
                      ["dates", "Dates"],
                    ]}
                    value={x}
                    onField={(k, v) => setItem("leadership", i, { [k]: v })}
                    bullets={x.bullets}
                    onBullets={(bullets) => setItem("leadership", i, { bullets })}
                    onRemove={() => removeItem("leadership", i)}
                    removeLabel="Remove activity"
                  />
                ))}
                <AddButton
                  onClick={() =>
                    addItem("leadership", { role: "", org: "", dates: "", bullets: [""] })
                  }
                >
                  + Add activity
                </AddButton>
              </Panel>
            </>
          )}
        </div>

        <PreviewAside
          doc={doc}
          template={template}
          onOpenPicker={() => setPicker(true)}
          subject="My resume"
          resumeId={data.id}
          tools={
            <>
              <ToolIcon
                icon="upload"
                title="Upload a resume"
                onClick={() => router.push("/documents?view=upload")}
              />
              <ToolIcon
                icon="download"
                title="Export PDF"
                onClick={() => void exportResume(data.id)}
              />
            </>
          }
        />
      </div>

      {picker && (
        <TemplatePicker
          value={template}
          doc={doc}
          onClose={() => setPicker(false)}
          onSelect={(id) => {
            setTemplate(id);
            setPicker(false);
            start(() => setMainTemplate(id));
          }}
        />
      )}
    </>
  );
}
