"use client";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, CoLogo, DiffBlock, Icon, IconButton, MatchRing, Modal, Panel } from "@ge/ui";
import { applyDiffs, atsScore, type ResumeDiff } from "@ge/core";
import {
  createTailoredResume,
  deleteTailoredResume,
  regenerateSuggestions,
  saveTailoredResume,
  setDiffStatus,
  setResumeTemplate,
} from "@/server/actions/documents";
import type { TailorData } from "@/server/documents";
import { TemplatePicker } from "./DocBlocks";
import { PreviewAside, printResume } from "./PreviewAside";

type Status = ResumeDiff["status"];

/** First visit from "Tailor resume": create the tailored copy and queue the suggestions. */
function StartTailoring({ jobId }: { jobId: string }) {
  const router = useRouter();
  const started = useRef(false);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    createTailoredResume(jobId)
      .then(() => router.refresh())
      .catch(() => setError(true));
  }, [jobId, router]);
  return (
    <Panel padded>
      <p className="m-0 text-small text-ink-muted" role="status">
        {error
          ? "We couldn't start tailoring. Reload the page to try again."
          : "Setting up a tailored copy of your main resume…"}
      </p>
    </Panel>
  );
}

export function TailorResume({ data }: { data: TailorData }) {
  const { job, resume } = data;
  const router = useRouter();
  const [statuses, setStatuses] = useState<Record<string, Status>>(() =>
    Object.fromEntries((resume?.diffs ?? []).map((d) => [d.id, d.status])),
  );
  const [template, setTemplate] = useState(resume?.template ?? "classic");
  const [picker, setPicker] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [, start] = useTransition();

  const diffs = useMemo(
    () => (resume?.diffs ?? []).map((d) => ({ ...d, status: statuses[d.id] ?? d.status })),
    [resume, statuses],
  );
  const tailored = useMemo(() => (resume ? applyDiffs(resume.doc, diffs) : null), [resume, diffs]);
  const before = useMemo(
    () => (resume ? atsScore(resume.doc, job.skills).score : 0),
    [resume, job.skills],
  );
  const after = useMemo(
    () => (tailored ? atsScore(tailored, job.skills).score : 0),
    [tailored, job.skills],
  );

  if (!resume || !tailored) {
    return (
      <>
        <BackLink />
        <StartTailoring jobId={job.id} />
      </>
    );
  }

  const accepted = diffs.filter((d) => d.status === "accepted").length;
  const pending = diffs.filter((d) => d.status === "pending").length;
  const set = (ids: string[], status: Status) => {
    setStatuses((s) => ({ ...s, ...Object.fromEntries(ids.map((id) => [id, status])) }));
    start(() => setDiffStatus(resume.id, ids, status));
  };
  const save = () =>
    start(async () => {
      await saveTailoredResume(resume.id);
      const d = new Date();
      setSavedAt(`${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`);
    });
  const savedNote = `${savedAt ? `Saved at ${savedAt}` : "Draft saved"} · ${accepted} of ${diffs.length} accepted`;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <BackLink />
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-caption text-ink-subtle" aria-live="polite">
            {savedNote}
          </span>
          <Button
            variant="secondary"
            size="sm"
            iconLeft={<Icon name="trash-2" size={14} />}
            onClick={() => setConfirmDelete(true)}
            className="hover:border-danger-line! hover:bg-danger-soft! hover:text-danger-ink!"
          >
            Delete
          </Button>
          <Button
            variant="secondary"
            size="sm"
            iconLeft={<Icon name="download" size={14} />}
            onClick={printResume}
          >
            Export PDF
          </Button>
          <Button size="sm" onClick={save}>
            Save
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[1_1_520px] flex-col gap-4">
          <Panel padded>
            <div className="flex flex-wrap items-center gap-4">
              <CoLogo name={job.company} size={40} />
              <div className="flex min-w-[200px] flex-1 flex-col">
                <span className="text-caption text-ink-subtle">Tailoring for</span>
                <Link
                  href={`/jobs/${job.id}`}
                  className="self-start text-body font-medium text-ink no-underline underline-offset-[3px] hover:underline"
                >
                  {job.title} · {job.company}
                </Link>
              </div>
              <div className="flex items-center gap-3">
                <MatchRing value={before} size={44} caption="Main" />
                <Icon name="arrow-right" size={16} className="text-ink-tertiary" />
                <MatchRing value={after} size={44} caption="ATS score, tailored" />
              </div>
            </div>
          </Panel>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <h2 className="m-0 text-body font-semibold">Suggested rewrites</h2>
              <span className="text-caption text-ink-subtle">
                {diffs.length === 0
                  ? "Writing suggestions for this role. They appear here as soon as they're ready."
                  : `${pending ? `${pending} waiting for review` : "All reviewed"}. Only wording changes; no new claims are added.`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <IconButton
                icon="rotate-cw"
                title="Regenerate all suggestions"
                onClick={() => {
                  setStatuses(Object.fromEntries(diffs.map((d) => [d.id, "pending"])));
                  start(async () => {
                    await regenerateSuggestions(resume.id);
                    router.refresh();
                  });
                }}
                size={28}
              />
              <Button
                variant="tertiary"
                size="sm"
                onClick={() =>
                  set(
                    diffs.map((d) => d.id),
                    "pending",
                  )
                }
              >
                Reset
              </Button>
              <Button
                size="sm"
                disabled={pending === 0}
                onClick={() =>
                  set(
                    diffs.filter((d) => d.status === "pending").map((d) => d.id),
                    "accepted",
                  )
                }
              >
                Accept all
              </Button>
            </div>
          </div>
          {diffs.map((d) => (
            <DiffBlock
              key={d.id}
              section={d.section}
              before={d.old}
              after={d.new}
              reason={d.reason}
              status={d.status}
              onAccept={() => set([d.id], "accepted")}
              onReject={() => set([d.id], "rejected")}
              onUndo={() => set([d.id], "pending")}
            />
          ))}
        </div>

        <PreviewAside
          doc={tailored}
          template={template}
          onOpenPicker={() => setPicker(true)}
          highlights={diffs.filter((d) => d.status === "accepted").map((d) => d.new)}
          subject={`Resume for ${job.company}`}
          footer={
            <span className="text-caption text-ink-subtle">
              Highlighted lines are accepted rewrites.
            </span>
          }
        />
      </div>

      {picker && (
        <TemplatePicker
          value={template}
          doc={tailored}
          onClose={() => setPicker(false)}
          onSelect={(id) => {
            setTemplate(id);
            setPicker(false);
            start(() => setResumeTemplate(resume.id, id));
          }}
        />
      )}
      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete this tailored resume?"
        sub={`Delete the resume tailored for ${job.company}? This can't be undone.`}
        width={420}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                start(async () => {
                  await deleteTailoredResume(resume.id);
                  router.push("/documents?view=list");
                })
              }
            >
              Delete
            </Button>
          </>
        }
      />
    </>
  );
}

function BackLink() {
  return (
    <Link
      href="/documents?view=list"
      className="inline-flex items-center gap-1.5 text-small text-ink-subtle no-underline hover:text-ink"
    >
      <Icon name="arrow-left" size={16} />
      Tailored resumes
    </Link>
  );
}
