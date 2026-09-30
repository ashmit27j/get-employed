"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Button,
  Dropzone,
  Icon,
  PageHeader,
  Panel,
  Segmented,
  StepList,
  TextArea,
  TextInput,
} from "@ge/ui";
import { templateName, type Profile } from "@ge/core";
import { useResumeUpload } from "@/lib/useResumeUpload";
import { fitUploadedResume, submitLatexResume } from "@/server/actions/documents";
import { TemplatePicker } from "./DocBlocks";

const STEPS = [
  {
    title: "Pick a template",
    body: "Four ATS-safe layouts. You can switch any time.",
    meta: "you choose",
  },
  {
    title: "We fit your content",
    body: "Sections are parsed and placed into the template.",
    meta: "~5 sec",
  },
  {
    title: "Review the draft",
    body: "Check parsed sections before anything is saved.",
    meta: "you review",
  },
  {
    title: "Get your ATS score",
    body: "Score, breakdown and suggested rewrites.",
    meta: "automatic",
  },
];

export function UploadResume({
  doc,
  template: initialTemplate,
}: {
  doc: Profile;
  template: string;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"Paste LaTeX" | "Upload file">("Paste LaTeX");
  const [pasted, setPasted] = useState("");
  const [role, setRole] = useState("");
  const [template, setTemplate] = useState(initialTemplate);
  const [picker, setPicker] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const { upload, start: startUpload, reset } = useResumeUpload({ defer: true });

  const ready =
    mode === "Paste LaTeX" ? pasted.trim().length > 0 : upload.state === "done" && !!upload.key;
  const fit = () =>
    start(async () => {
      setError(null);
      try {
        if (mode === "Paste LaTeX")
          await submitLatexResume({ source: pasted, template, targetRole: role });
        else await fitUploadedResume({ key: upload.key!, template, targetRole: role });
        router.push("/documents?view=main");
      } catch {
        setError("We couldn't start fitting your resume. Try again.");
      }
    });

  return (
    <>
      <Link
        href="/documents?view=main"
        className="inline-flex items-center gap-1.5 self-start text-small text-ink-subtle no-underline hover:text-ink"
      >
        <Icon name="arrow-left" size={16} />
        Main resume
      </Link>
      <PageHeader
        title="Upload your resume"
        sub="Upload your current resume or paste its LaTeX, choose a template, and we fit your content into an editable main resume."
      />
      <div className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[1_1_520px] flex-col gap-4">
          <Panel padded>
            <Segmented
              label="Source"
              options={["Paste LaTeX", "Upload file"]}
              value={mode}
              onChange={(v) => setMode(v as typeof mode)}
            />
            {mode === "Paste LaTeX" ? (
              <TextArea
                aria-label="LaTeX source"
                mono
                rows={12}
                value={pasted}
                onChange={(e) => setPasted(e.target.value)}
                placeholder="\documentclass{article} …"
                hint="Paste the full .tex source. We keep your structure and map sections to the template."
              />
            ) : (
              <>
                <Dropzone
                  hint="PDF, DOC or DOCX, up to 10 MB"
                  accept=".pdf,.doc,.docx"
                  state={upload.state}
                  fileName={upload.name}
                  fileSize={upload.size}
                  progress={upload.progress}
                  onFile={startUpload}
                  onRemove={reset}
                />
                {upload.error && (
                  <p role="alert" className="m-0 text-small text-danger-ink">
                    {upload.error}
                  </p>
                )}
              </>
            )}
            <TextInput
              label="Target role (optional)"
              placeholder="e.g. Backend engineer at a fintech startup"
              hint="Used to order sections and frame your summary."
              value={role}
              onChange={(e) => setRole(e.target.value)}
            />
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex flex-col gap-0.5">
                <span className="text-small font-medium text-ink-muted">Template</span>
                <span className="text-caption text-ink-subtle">{templateName(template)}</span>
              </div>
              <Button
                variant="secondary"
                size="sm"
                iconLeft={<Icon name="layout-template" size={14} />}
                onClick={() => setPicker(true)}
              >
                Change template
              </Button>
            </div>
            {error && (
              <p role="alert" className="m-0 text-small text-danger-ink">
                {error}
              </p>
            )}
            <div className="flex">
              <Button disabled={!ready || pending} onClick={fit}>
                Fit resume
              </Button>
            </div>
          </Panel>
        </div>
        <aside className="flex min-w-[280px] flex-[0_1_340px] flex-col max-md:min-w-0">
          <Panel title="What happens next" padded>
            <StepList steps={STEPS} />
          </Panel>
        </aside>
      </div>
      {picker && (
        <TemplatePicker
          value={template}
          doc={doc}
          onClose={() => setPicker(false)}
          onSelect={(id) => {
            setTemplate(id);
            setPicker(false);
          }}
        />
      )}
    </>
  );
}
