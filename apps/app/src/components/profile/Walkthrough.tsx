"use client";
import { useEffect, useId, useRef } from "react";
import { Button, Icon, IconButton, type IconName } from "@ge/ui";
import { UNLOCK_PCT } from "@ge/core";

export type WalkStep = "welcome" | "ready" | "unlocked" | null;

/** Onboarding hints on the Job Profile: welcome, "save to unlock", then "you're in". */
export function Walkthrough({
  step,
  firstName,
  pct,
  onClose,
  onUseAi,
  onSave,
  onOpenJobs,
}: {
  step: WalkStep;
  firstName: string;
  pct: number;
  onClose: () => void;
  onUseAi: () => void;
  onSave: () => void;
  onOpenJobs: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useEffect(() => {
    if (step) ref.current?.focus();
  }, [step]);
  if (!step) return null;

  const tip = (icon: IconName, title: string, body: string) => (
    <div className="flex gap-3 rounded-md border border-hairline bg-surface-2 p-3">
      <span className="flex size-8 flex-none items-center justify-center rounded-md border border-primary-line bg-primary-soft text-primary">
        <Icon name={icon} size={16} />
      </span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-small font-medium text-ink">{title}</span>
        <span className="text-caption text-pretty text-ink-subtle">{body}</span>
      </div>
    </div>
  );

  const card = {
    welcome: {
      title: `Welcome, ${firstName}. Start with your Job Profile.`,
      body: `Matching, tailored resumes and outreach all read from it. The rest of GetEmployed opens once your profile is ${UNLOCK_PCT}% complete and saved.`,
      content: (
        <>
          {tip(
            "pen-line",
            "Fill it in yourself",
            "Work down the sections. Nothing is stored until you select Save.",
          )}
          {tip(
            "sparkles",
            "Or let AI build it",
            "Select Edit with AI and paste your resume or LinkedIn summary. The assistant drafts the sections for you to review.",
          )}
        </>
      ),
      actions: (
        <>
          <Button variant="secondary" size="sm" onClick={onUseAi}>
            Edit with AI
          </Button>
          <Button size="sm" onClick={onClose}>
            Start filling it in
          </Button>
        </>
      ),
    },
    ready: {
      title: "Your profile is ready to save",
      body: `It's ${pct}% complete, past the ${UNLOCK_PCT}% needed. Save it to unlock the job board, tracker, documents and the rest of the app.`,
      content: null,
      actions: (
        <>
          <Button variant="tertiary" size="sm" onClick={onClose}>
            Keep editing
          </Button>
          <Button size="sm" onClick={onSave}>
            Save profile
          </Button>
        </>
      ),
    },
    unlocked: {
      title: "You're all set",
      body: "The sidebar is open. Find roles on the job board, tailor your resume per job and track every application. You can come back and improve your profile any time.",
      content: null,
      actions: (
        <>
          <Button variant="tertiary" size="sm" onClick={onClose}>
            Stay here
          </Button>
          <Button size="sm" onClick={onOpenJobs}>
            Go to the job board
          </Button>
        </>
      ),
    },
  }[step];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-scrim p-6 max-md:items-end max-md:p-3">
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative flex w-full max-w-[480px] flex-col gap-4 rounded-xl border border-hairline-strong bg-canvas p-6 shadow-edge outline-none max-md:p-5"
      >
        <IconButton icon="x" title="Close" onClick={onClose} className="absolute top-3 right-3" />
        <div className="flex flex-col gap-1.5 pr-8">
          <h2 id={titleId} className="m-0 text-title font-semibold text-ink">
            {card.title}
          </h2>
          <p className="m-0 text-small text-pretty text-ink-subtle">{card.body}</p>
        </div>
        {card.content && <div className="flex flex-col gap-2">{card.content}</div>}
        <div className="flex justify-end gap-2">{card.actions}</div>
      </div>
    </div>
  );
}

/** The strip at the top of the profile while the app is locked. */
export function LockedBanner({ pct, onUseAi }: { pct: number; onUseAi: () => void }) {
  const progress = Math.min(100, Math.round((pct / UNLOCK_PCT) * 100));
  return (
    <section
      aria-label="Unlock progress"
      className="flex flex-wrap items-center gap-4 rounded-lg border border-primary-line bg-primary-soft px-5 py-4 max-md:px-4"
    >
      <Icon name="lock" size={18} className="flex-none text-primary" />
      <div className="flex min-w-[200px] flex-1 flex-col gap-2">
        <span className="text-small text-ink">
          Complete and save {UNLOCK_PCT}% of your profile to unlock the app.{" "}
          <span className="font-mono text-ink-subtle">
            {pct}% / {UNLOCK_PCT}%
          </span>
        </span>
        <div className="h-1 overflow-hidden rounded-full bg-surface-3">
          <div
            className="h-full rounded-[inherit] bg-primary transition-[width] duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <Button
        variant="secondary"
        size="sm"
        iconLeft={<Icon name="sparkles" size={14} className="text-primary" />}
        onClick={onUseAi}
      >
        Fill it with AI
      </Button>
    </section>
  );
}
