"use client";
import { useRef, useState, type DragEventHandler, type ReactNode } from "react";
import type { IconName } from "../icons";
import { cx, transition } from "../lib/cx";
import { Button } from "./Button";
import { Avatar, CoLogo } from "./Foundations";
import { Icon } from "./Icon";
import { IconButton } from "./IconButton";
import { UiLink } from "./Link";
import { MatchRing } from "./Scores";
import { StatusBadge } from "./Status";

/* ---------- Diff ---------- */

/** Inline added/removed text inside a sentence. */
export function DiffText({
  kind = "add",
  children,
}: {
  kind?: "add" | "remove";
  children: ReactNode;
}) {
  return kind === "add" ? (
    <ins className="rounded-[2px] bg-success-soft px-0.5 text-ink no-underline">{children}</ins>
  ) : (
    <del className="rounded-[2px] bg-danger-soft px-0.5 text-danger-text line-through decoration-danger-ink">
      {children}
    </del>
  );
}

export type DiffStatus = "pending" | "accepted" | "rejected";

function DiffLine({
  sign,
  kind,
  children,
}: {
  sign: string;
  kind: "add" | "del" | "keep";
  children: ReactNode;
}) {
  return (
    <div
      className={cx(
        "grid grid-cols-[16px_1fr] gap-2 px-3 py-2 text-small",
        kind === "add" && "bg-success-soft",
        kind === "del" && "bg-danger-soft",
      )}
    >
      <span
        aria-hidden="true"
        className={cx(
          "font-mono",
          kind === "add"
            ? "text-success-ink"
            : kind === "del"
              ? "text-danger-ink"
              : "text-ink-tertiary",
        )}
      >
        {sign}
      </span>
      <span
        className={cx(
          "text-pretty",
          kind === "add" && "text-ink",
          kind === "del" && "text-danger-text line-through decoration-danger-ink",
          kind === "keep" && "text-ink-tertiary",
        )}
      >
        <span className="sr-only">
          {kind === "add" ? "Suggested: " : kind === "del" ? "Original: " : "Kept: "}
        </span>
        {children}
      </span>
    </div>
  );
}

/**
 * One suggested resume edit: original (−) vs suggestion (+), the reason, and
 * Keep original / Accept / Regenerate. Controlled through `status` + callbacks.
 */
export function DiffBlock({
  section,
  before,
  after,
  reason,
  status = "pending",
  onAccept,
  onReject,
  onUndo,
  onRegenerate,
  regenerating,
}: {
  section: ReactNode;
  before: ReactNode;
  after: ReactNode;
  reason?: ReactNode;
  status?: DiffStatus;
  onAccept?: () => void;
  onReject?: () => void;
  onUndo?: () => void;
  onRegenerate?: () => void;
  regenerating?: boolean;
}) {
  return (
    <div
      className={cx(
        "overflow-hidden rounded-md border bg-surface-1",
        status === "pending" ? "border-hairline-strong" : "border-hairline",
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-hairline px-3 py-2">
        <span className="text-caption text-ink-subtle">{section}</span>
        {status !== "pending" && (
          <StatusBadge tone={status === "accepted" ? "accent" : "neutral"}>
            {status === "accepted" ? "Accepted" : "Kept original"}
          </StatusBadge>
        )}
      </div>
      {status !== "accepted" && (
        <DiffLine sign="−" kind={status === "rejected" ? "keep" : "del"}>
          {before}
        </DiffLine>
      )}
      {status !== "rejected" && (
        <DiffLine sign="+" kind="add">
          {after}
        </DiffLine>
      )}
      {status === "pending" ? (
        <div className="flex items-center gap-2 border-t border-hairline px-3 py-2">
          <span className="inline-flex flex-1 items-start gap-1.5 text-caption text-ink-subtle">
            {reason && (
              <>
                <Icon name="info" size={13} className="mt-0.5" />
                {reason}
              </>
            )}
          </span>
          {onRegenerate && (
            <button
              type="button"
              onClick={onRegenerate}
              disabled={regenerating}
              title="Regenerate suggestion"
              aria-label="Regenerate suggestion"
              className="box-border inline-flex size-7 flex-none cursor-pointer items-center justify-center rounded-sm border border-hairline-strong text-ink-subtle hover:text-ink disabled:cursor-default disabled:text-ink-tertiary"
            >
              <Icon
                name="rotate-ccw"
                size={14}
                className={regenerating ? "animate-spin" : undefined}
              />
            </button>
          )}
          <Button variant="tertiary" size="sm" onClick={onReject}>
            Keep original
          </Button>
          <Button variant="secondary" size="sm" onClick={onAccept}>
            Accept
          </Button>
        </div>
      ) : (
        <div className="px-3 pt-1 pb-2">
          <button
            type="button"
            onClick={onUndo}
            className="cursor-pointer text-caption text-ink-subtle hover:text-ink"
          >
            Undo
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------- Chat ---------- */

export type Feedback = "up" | "down" | null;

/**
 * A chat message. Assistant messages get the blue-dot avatar and, once done, copy / read aloud /
 * feedback actions. User messages sit right-aligned in a surface-2 bubble.
 */
export function ChatBubble({
  role = "assistant",
  children,
  text,
  streaming,
  time,
  userName = "",
  feedback = null,
  onFeedback,
}: {
  role?: "assistant" | "user";
  children: ReactNode;
  /** Plain text for copy and read-aloud. */
  text?: string;
  streaming?: boolean;
  time?: string;
  userName?: string;
  feedback?: Feedback;
  onFeedback?: (value: Feedback) => void;
}) {
  const me = role === "user";
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const copy = () => {
    if (!text) return;
    void navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };
  const speak = () => {
    if (!window.speechSynthesis || !text) return;
    window.speechSynthesis.cancel();
    if (speaking) {
      setSpeaking(false);
      return;
    }
    const u = new SpeechSynthesisUtterance(text);
    u.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
    setSpeaking(true);
  };
  return (
    <div className={cx("flex items-start gap-3", me ? "justify-end" : "justify-start")}>
      {!me && (
        <span className="inline-flex size-7 flex-none items-center justify-center rounded-full border border-hairline bg-surface-2">
          <span className="size-2 rounded-full bg-primary shadow-glow-dot" />
        </span>
      )}
      <div
        className={cx(
          "flex flex-col gap-2",
          me ? "max-w-[75%] items-end" : "max-w-[min(640px,100%)] items-stretch",
        )}
      >
        <div
          className={cx(
            "flex flex-col gap-3 text-small text-pretty text-ink",
            me ? "rounded-lg border border-hairline bg-surface-2 px-3 py-2" : "pt-1",
          )}
          aria-live={streaming ? "polite" : undefined}
        >
          {children}
          {streaming && (
            <span
              aria-hidden="true"
              className="inline-block h-3.5 w-[7px] animate-blink bg-primary align-text-bottom"
            />
          )}
        </div>
        {!me && !streaming && (
          <div className="flex items-center gap-0.5">
            <IconButton
              icon={copied ? "check" : "copy"}
              title={copied ? "Copied" : "Copy"}
              onClick={copy}
              size={22}
            />
            <IconButton
              icon={speaking ? "volume-2" : "volume-1"}
              title={speaking ? "Stop reading" : "Read aloud"}
              active={speaking}
              onClick={speak}
              size={22}
            />
            <IconButton
              icon="thumbs-up"
              title="Good response"
              active={feedback === "up"}
              onClick={() => onFeedback?.(feedback === "up" ? null : "up")}
              size={22}
            />
            <IconButton
              icon="thumbs-down"
              title="Bad response"
              active={feedback === "down"}
              onClick={() => onFeedback?.(feedback === "down" ? null : "down")}
              size={22}
            />
            {time && <span className="ml-1 text-caption text-ink-tertiary">{time}</span>}
          </div>
        )}
        {me && time && <span className="text-caption text-ink-tertiary">{time}</span>}
      </div>
      {me && <Avatar name={userName} size={28} />}
    </div>
  );
}

/** Tool-call card inside an assistant message: spinner while running, then a link to the result. */
export function ChatAction({
  icon = "zap",
  title,
  detail,
  status = "done",
  href,
  cta = "Open",
}: {
  icon?: IconName;
  title: ReactNode;
  detail?: ReactNode;
  status?: "running" | "done" | "error";
  href?: string;
  cta?: string;
}) {
  const running = status === "running";
  return (
    <div className="flex items-center gap-3 rounded-md border border-hairline bg-surface-1 px-3 py-2 shadow-edge">
      <span
        className={cx(
          "inline-flex size-7 flex-none items-center justify-center rounded-sm bg-surface-2",
          running ? "text-primary" : "text-ink-subtle",
        )}
      >
        {running ? (
          <span
            role="status"
            aria-label="Working"
            className="box-border size-3.5 animate-spin rounded-full border-2 border-surface-4 border-t-primary"
          />
        ) : (
          <Icon name={status === "error" ? "circle-alert" : icon} size={14} />
        )}
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-small text-ink">{title}</span>
        {detail && <span className="text-caption text-ink-subtle">{detail}</span>}
      </div>
      {href && !running && (
        <UiLink href={href} className="text-small whitespace-nowrap text-ink-subtle">
          {cta} →
        </UiLink>
      )}
    </div>
  );
}

/* ---------- Upload ---------- */

export type DropzoneState = "idle" | "uploading" | "done";

/** File drop target (resume, LinkedIn PDF). Shows progress and the parse summary once a file is in. */
export function Dropzone({
  title = "Drop your resume here",
  hint = "PDF or DOCX, up to 10 MB",
  accept = ".pdf,.docx",
  buttonLabel = "Choose file",
  onFile,
  state = "idle",
  fileName,
  fileSize,
  progress = 0,
  summary,
  onRemove,
}: {
  title?: string;
  hint?: string;
  accept?: string;
  buttonLabel?: string;
  onFile?: (file: File) => void;
  state?: DropzoneState;
  fileName?: string;
  fileSize?: string;
  progress?: number;
  /** Line under the bar, e.g. "Parsed 2 education entries, 2 roles…". */
  summary?: ReactNode;
  onRemove?: () => void;
}) {
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const pick = (f?: File | null) => {
    if (f) onFile?.(f);
  };
  if (state !== "idle") {
    const done = state === "done";
    return (
      <div className="flex items-center gap-3 rounded-lg border border-hairline-strong bg-surface-1 p-4">
        <span
          className={cx(
            "inline-flex size-10 flex-none items-center justify-center rounded-md border border-hairline bg-surface-2",
            done ? "text-primary" : "text-ink-subtle",
          )}
        >
          <Icon name={done ? "file-check" : "file-text"} size={18} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex justify-between gap-3 text-small">
            <span className="truncate text-ink">{fileName}</span>
            <span className="font-mono text-caption text-ink-subtle">
              {done ? fileSize : `${progress}%`}
            </span>
          </div>
          <span
            role="progressbar"
            aria-label={`Uploading ${fileName ?? "file"}`}
            aria-valuenow={done ? 100 : progress}
            aria-valuemin={0}
            aria-valuemax={100}
            className="block h-1 overflow-hidden rounded-full bg-surface-3"
          >
            <span
              className={cx("block h-full bg-primary transition-[width]", transition)}
              style={{ width: `${done ? 100 : progress}%` }}
            />
          </span>
          <span className="text-caption text-ink-subtle">
            {summary ?? (done ? "" : "Reading sections…")}
          </span>
        </div>
        {onRemove && <IconButton icon="x" title="Remove file" onClick={onRemove} />}
      </div>
    );
  }
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        pick(e.dataTransfer.files[0]);
      }}
      onClick={() => input.current?.click()}
      className={cx(
        "flex cursor-pointer flex-col items-center gap-3 rounded-lg border border-dashed px-6 py-12 text-center transition-[background-color,border-color]",
        transition,
        over ? "border-primary bg-glow-soft" : "border-hairline-strong bg-surface-1",
      )}
    >
      <input
        ref={input}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => pick(e.target.files?.[0])}
      />
      <span
        className={cx(
          "flex size-11 items-center justify-center rounded-md border border-hairline bg-surface-2",
          over ? "text-primary" : "text-ink-subtle",
        )}
      >
        <Icon name="file-up" size={20} />
      </span>
      <div className="text-body font-medium text-ink">{title}</div>
      <div className="text-small text-ink-subtle">or click to browse · {hint}</div>
      <Button
        variant="secondary"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          input.current?.click();
        }}
      >
        {buttonLabel}
      </Button>
    </div>
  );
}

/* ---------- Kanban ---------- */

export type ApplicationFlag = "tailored" | "emailed" | "opened" | "replied";

const FLAGS: Record<ApplicationFlag, [IconName, string]> = {
  tailored: ["file-check", "Tailored"],
  emailed: ["send", "Emailed"],
  opened: ["eye", "Opened"],
  replied: ["message-square-reply", "Replied"],
};

/** Application card on the tracker board. Draggable between stage columns. */
export function StageCard({
  title,
  company,
  score,
  meta,
  flags = [],
  href,
  onDragStart,
  onDragEnd,
  dragging,
}: {
  title: string;
  company: string;
  score?: number;
  meta?: ReactNode;
  flags?: ApplicationFlag[];
  href?: string;
  onDragStart?: DragEventHandler<HTMLDivElement>;
  onDragEnd?: DragEventHandler<HTMLDivElement>;
  dragging?: boolean;
}) {
  const heading = <span className="text-small font-medium text-pretty text-ink">{title}</span>;
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={cx(
        "relative box-border flex cursor-grab flex-col gap-2.5 rounded-lg border border-hairline bg-surface-1 p-3 text-small shadow-edge transition-[background-color,border-color,opacity] hover:border-hairline-strong hover:bg-surface-2",
        transition,
        dragging && "opacity-40",
      )}
    >
      <div className="flex items-start gap-2.5">
        <CoLogo name={company} size={28} />
        <div className="flex min-w-0 flex-1 flex-col">
          {href ? (
            <UiLink href={href} className="text-ink after:absolute after:inset-0">
              {heading}
            </UiLink>
          ) : (
            heading
          )}
          <span className="text-caption text-ink-subtle">{company}</span>
        </div>
        {score != null && <MatchRing value={score} size={28} label={false} />}
      </div>
      {meta && (
        <div className="flex items-center gap-1.5 text-caption text-ink-subtle">
          <Icon name="clock" size={12} />
          {meta}
        </div>
      )}
      {flags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {flags.map((f) => {
            const [icon, label] = FLAGS[f];
            return (
              <span
                key={f}
                className={cx(
                  "inline-flex items-center gap-1 rounded-xs border border-hairline-strong px-1.5 py-px text-micro tracking-normal",
                  f === "replied" ? "text-ink" : "text-ink-subtle",
                )}
              >
                <Icon
                  name={icon}
                  size={11}
                  className={f === "replied" ? "text-success" : undefined}
                />
                {label}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
