"use client";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Icon, IconButton, MatchRing, cx } from "@ge/ui";
import { RESUME_TEMPLATES, templateName, type Profile } from "@ge/core";
import { useShell } from "@/components/shell/ShellProvider";
import { ResumePaper, TEMPLATE_STYLE } from "./ResumePaper";

/** A tailored resume in the card grid (ResumeCard in prototype/ge-app.js). */
export function ResumeCard({
  title,
  sub,
  date,
  template,
  ats,
  href,
  doc,
  onDelete,
  onDownload,
}: {
  title: string;
  sub?: string;
  date: string;
  template: string;
  ats: number | null;
  href: string;
  doc: Profile;
  onDelete?: () => void;
  onDownload?: () => void;
}) {
  const router = useRouter();
  const act = (icon: "download" | "trash-2", label: string, fn?: () => void) => (
    <span
      role="presentation"
      className="inline-flex rounded-sm border border-hairline-strong bg-canvas"
      onClick={(e) => e.stopPropagation()}
    >
      <IconButton icon={icon} title={label} onClick={fn} size={30} />
    </span>
  );
  return (
    <div
      role="link"
      tabIndex={0}
      aria-label={`${title}${sub ? `, ${sub}` : ""}`}
      onClick={() => router.push(href)}
      onKeyDown={(e) => e.target === e.currentTarget && e.key === "Enter" && router.push(href)}
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-lg border border-hairline bg-surface-1 shadow-edge transition-[background-color,border-color] duration-(--duration-base) ease-standard outline-none hover:border-hairline-strong hover:bg-surface-2 focus-visible:shadow-focus"
    >
      <div className="border-b border-hairline px-6 pt-5">
        <ResumePaper doc={doc} template={template} thumb maxPages={1} />
      </div>
      <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 transition-opacity duration-(--duration-base) group-focus-within:opacity-100 group-hover:opacity-100">
        {act("download", "Download PDF", onDownload)}
        {act("trash-2", "Delete", onDelete)}
      </div>
      <div className="flex items-center gap-3 px-4 py-3.5">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-small font-medium text-ink">{title}</span>
          <span className="flex items-center gap-1.5 overflow-hidden text-caption whitespace-nowrap text-ink-subtle">
            {sub && <span className="truncate">{sub}</span>}
            {sub && <span>·</span>}
            <span>{date}</span>
            <span>·</span>
            <Icon name="layout-template" size={12} />
            {templateName(template)}
          </span>
        </div>
        {ats != null ? (
          <MatchRing value={ats} size={36} />
        ) : (
          <span
            title="Not scored"
            className="box-border size-9 rounded-full border border-dashed border-hairline-tertiary"
          />
        )}
      </div>
    </div>
  );
}

export function AddResumeCard({
  title,
  sub,
  href,
  cta,
}: {
  title: string;
  sub: string;
  href: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className="group flex min-h-[280px] flex-col rounded-lg border border-dashed border-hairline-strong text-ink no-underline transition-[background-color,border-color] duration-(--duration-base) ease-standard hover:border-hairline-tertiary hover:bg-surface-1 hover:text-ink"
    >
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6">
        <span className="inline-flex size-10 items-center justify-center rounded-md border border-hairline-strong bg-surface-2 text-ink-subtle group-hover:text-ink">
          <Icon name="plus" size={18} />
        </span>
        <span className="text-small text-ink-muted">{title}</span>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-dashed border-hairline-strong px-4 py-3.5">
        <span className="text-caption text-ink-subtle">{sub}</span>
        <span className="text-caption text-ink-subtle group-hover:text-ink">{cta} →</span>
      </div>
    </Link>
  );
}

/** Full-screen template chooser with a live preview of the user's resume. */
export function TemplatePicker({
  value,
  doc,
  onSelect,
  onClose,
  cta = "Use template",
}: {
  value: string;
  doc: Profile;
  onSelect: (id: string) => void;
  onClose: () => void;
  cta?: string;
}) {
  const [sel, setSel] = useState(value);
  const dialog = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const k = (e: globalThis.KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    dialog.current?.querySelector<HTMLElement>("[aria-pressed='true']")?.focus();
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-6 max-md:p-0">
      <div aria-hidden="true" onClick={onClose} className="absolute inset-0 bg-scrim" />
      <div
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-label="Choose a template"
        className="relative grid h-[min(720px,100%)] w-[min(960px,100%)] grid-cols-[minmax(0,1fr)_340px] overflow-hidden rounded-xl border border-hairline-strong bg-canvas shadow-edge max-md:h-full max-md:grid-cols-1 max-md:rounded-none"
      >
        <div className="overflow-y-auto border-r border-hairline bg-surface-1 p-8 max-md:hidden">
          <div className="mx-auto max-w-[480px]">
            <ResumePaper doc={doc} template={sel} />
          </div>
        </div>
        <div className="flex min-h-0 flex-col">
          <div className="flex items-start gap-2 pt-5 pr-4 pb-3 pl-5">
            <div className="flex flex-1 flex-col gap-0.5">
              <span className="text-body font-semibold text-ink">Choose a template</span>
              <span className="text-caption text-ink-subtle">
                Select one to preview it on your resume.
              </span>
            </div>
            <IconButton icon="x" title="Close" onClick={onClose} />
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-5 pt-1 pb-5">
            {RESUME_TEMPLATES.map((t) => {
              const on = t.id === sel;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSel(t.id)}
                  aria-pressed={on}
                  className={cx(
                    "box-border flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3.5 text-left transition-[background-color,border-color] duration-(--duration-base) ease-standard focus-visible:shadow-focus focus-visible:outline-none",
                    on
                      ? "border-primary-line bg-glow-soft"
                      : "border-hairline bg-surface-1 hover:border-hairline-strong",
                  )}
                >
                  <span className="flex flex-1 flex-col gap-1">
                    <span
                      className="text-small font-medium text-ink"
                      style={
                        t.id === "latex" ? { fontFamily: TEMPLATE_STYLE.latex!.font } : undefined
                      }
                    >
                      {t.name}
                    </span>
                    <span className="text-caption text-pretty text-ink-subtle">{t.desc}</span>
                  </span>
                  <span
                    className={cx(
                      "inline-flex size-[18px] flex-none items-center justify-center rounded-full text-on-primary",
                      on ? "bg-primary" : "border border-hairline-tertiary",
                    )}
                  >
                    {on && <Icon name="check" size={12} />}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="border-t border-hairline p-4">
            <Button fullWidth onClick={() => onSelect(sel)}>
              {cta}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** "You can edit this resume with AI": opens the assistant dock. Dismissable. */
/**
 * A one-time nudge towards the assistant. It shows until it has been on screen for a few seconds,
 * dismissed or used, then never again on this device.
 */
export function AssistantHint({
  id,
  text = "You can edit this resume with AI",
  cta = "Ask assistant",
}: {
  id: string;
  text?: string;
  cta?: string;
}) {
  const key = `ge-hint-${id}`;
  const [gone, setGone] = useState(true);
  const { setDockOpen } = useShell();
  useEffect(() => {
    let seen = false;
    try {
      seen = !!localStorage.getItem(key);
    } catch {
      // Blocked storage: show it this once.
    }
    if (seen) return;
    const show = setTimeout(() => setGone(false), 0);
    const remember = setTimeout(() => {
      try {
        localStorage.setItem(key, "1");
      } catch {
        // Nothing to remember it in.
      }
    }, 4000);
    return () => {
      clearTimeout(show);
      clearTimeout(remember);
    };
  }, [key]);
  const hide = () => {
    setGone(true);
    try {
      localStorage.setItem(key, "1");
    } catch {
      // Nothing to remember it in.
    }
  };
  if (gone) return null;
  return (
    <div className="flex items-center gap-3 rounded-lg border border-hairline bg-surface-1 py-2.5 pr-2 pl-4 shadow-edge">
      <Icon name="sparkles" size={16} className="text-primary" />
      <span className="min-w-0 flex-1 text-small text-ink">{text}</span>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => {
          hide();
          setDockOpen(true);
        }}
      >
        {cta}
      </Button>
      <IconButton icon="x" title="Dismiss" onClick={hide} size={28} />
    </div>
  );
}

type ToolIconName = Parameters<typeof IconButton>[0]["icon"];

function ToolButton({
  icon,
  title,
  onClick,
  disabled,
}: {
  icon: ToolIconName;
  title: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <span className={cx("inline-flex", disabled && "pointer-events-none opacity-40")}>
      <IconButton icon={icon} title={title} onClick={onClick} size={28} />
    </span>
  );
}
const Sep = () => (
  <span aria-hidden="true" className="mx-1 h-4 w-px flex-none bg-hairline-strong" />
);

/**
 * LaTeX source editor: formatting toolbar, line numbers, its own undo history
 * (LatexEditor in prototype/ge-app.js). Typing within 600ms is one undo step.
 */
export function LatexEditor({
  value,
  onChange,
  hint,
  fill,
}: {
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  /** Fill the parent's height and scroll inside, instead of growing with the code. */
  fill?: boolean;
}) {
  const ta = useRef<HTMLTextAreaElement>(null);
  const lastEdit = useRef(0);
  const [hist, setHist] = useState<{ past: string[]; future: string[] }>({ past: [], future: [] });
  const [pos, setPos] = useState<[number, number]>([1, 1]);

  const set = (next: string, sel?: [number, number]) => {
    const now = Date.now();
    const newStep = now - lastEdit.current > 600 || !!sel;
    lastEdit.current = sel ? 0 : now;
    setHist((h) => ({ past: newStep ? [...h.past, value] : h.past, future: [] }));
    onChange(next);
    if (sel)
      requestAnimationFrame(() => {
        ta.current?.focus();
        ta.current?.setSelectionRange(sel[0], sel[1]);
      });
  };
  const undo = () => {
    if (!hist.past.length) return;
    lastEdit.current = 0;
    onChange(hist.past.at(-1)!);
    setHist({ past: hist.past.slice(0, -1), future: [...hist.future, value] });
  };
  const redo = () => {
    if (!hist.future.length) return;
    lastEdit.current = 0;
    onChange(hist.future.at(-1)!);
    setHist({ past: [...hist.past, value], future: hist.future.slice(0, -1) });
  };
  const wrap = (a: string, b: string, placeholder: string) => {
    const el = ta.current;
    if (!el) return;
    const s0 = el.selectionStart;
    const e0 = el.selectionEnd;
    const sel = value.slice(s0, e0) || placeholder;
    set(value.slice(0, s0) + a + sel + b + value.slice(e0), [
      s0 + a.length,
      s0 + a.length + sel.length,
    ]);
  };
  const ins = (txt: string) => {
    const el = ta.current;
    if (!el) return;
    const p = el.selectionEnd;
    const pre = p > 0 && value[p - 1] !== "\n" ? "\n" : "";
    const at = p + pre.length + txt.length;
    set(value.slice(0, p) + pre + txt + value.slice(p), [at, at]);
  };
  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!(e.metaKey || e.ctrlKey)) return;
    const k = e.key.toLowerCase();
    const map: Record<string, () => void> = {
      b: () => wrap("\\textbf{", "}", "bold text"),
      i: () => wrap("\\textit{", "}", "italic text"),
      u: () => wrap("\\underline{", "}", "text"),
      k: () => wrap("\\href{https://}{", "}", "link text"),
      y: redo,
    };
    const fn = k === "z" ? (e.shiftKey ? redo : undo) : map[k];
    if (fn) {
      e.preventDefault();
      fn();
    }
  };
  const track = (el: HTMLTextAreaElement) => {
    const before = el.value.slice(0, el.selectionStart).split("\n");
    setPos([before.length, before[before.length - 1]!.length + 1]);
  };
  const lines = value.split("\n").length;
  return (
    <div
      className={cx(
        "flex flex-col overflow-hidden rounded-lg border border-hairline-strong bg-surface-1 shadow-edge",
        fill && "h-full min-h-0",
      )}
    >
      <div
        role="toolbar"
        aria-label="LaTeX formatting"
        className="flex flex-wrap items-center gap-0.5 border-b border-hairline bg-canvas px-2 py-1.5"
      >
        <ToolButton
          icon="undo-2"
          title="Undo (Ctrl+Z)"
          onClick={undo}
          disabled={!hist.past.length}
        />
        <ToolButton
          icon="redo-2"
          title="Redo (Ctrl+Shift+Z)"
          onClick={redo}
          disabled={!hist.future.length}
        />
        <Sep />
        <select
          aria-label="Text size"
          value="Text size"
          onChange={(e) =>
            e.target.value !== "Text size" && wrap(`{\\${e.target.value} `, "}", "text")
          }
          className="h-7 cursor-pointer appearance-none rounded-sm border border-hairline bg-canvas px-2 text-caption text-ink-muted outline-none focus-visible:shadow-focus"
        >
          {["Text size", "tiny", "small", "normalsize", "large", "Large", "huge"].map((o) => (
            <option key={o} value={o} className="bg-surface-2">
              {o === "Text size" ? o : `\\${o}`}
            </option>
          ))}
        </select>
        <Sep />
        <ToolButton
          icon="bold"
          title="Bold (Ctrl+B)"
          onClick={() => wrap("\\textbf{", "}", "bold text")}
        />
        <ToolButton
          icon="italic"
          title="Italic (Ctrl+I)"
          onClick={() => wrap("\\textit{", "}", "italic text")}
        />
        <ToolButton
          icon="underline"
          title="Underline (Ctrl+U)"
          onClick={() => wrap("\\underline{", "}", "text")}
        />
        <Sep />
        <ToolButton
          icon="link"
          title="Hyperlink (Ctrl+K)"
          onClick={() => wrap("\\href{https://}{", "}", "link text")}
        />
        <ToolButton
          icon="list"
          title="Bullet list"
          onClick={() => ins("\\begin{itemize}\n  \\item \n\\end{itemize}\n")}
        />
        <ToolButton
          icon="heading"
          title="Section"
          onClick={() => wrap("\\section{", "}", "Section")}
        />
        <Sep />
        <ToolButton
          icon="image"
          title="Insert image"
          onClick={() => ins("\\includegraphics[width=0.25\\linewidth]{photo.png}\n")}
        />
        <ToolButton
          icon="table"
          title="Insert table"
          onClick={() => ins("\\begin{tabular}{ll}\n  Left & Right \\\\\n\\end{tabular}\n")}
        />
        <ToolButton
          icon="minus"
          title="Horizontal rule"
          onClick={() => ins("\\noindent\\rule{\\linewidth}{0.4pt}\n")}
        />
        <ToolButton icon="space" title="Vertical space" onClick={() => ins("\\vspace{6pt}\n")} />
      </div>
      <div
        className={cx(
          "grid grid-cols-[44px_minmax(0,1fr)]",
          fill && "min-h-0 flex-1 overflow-y-auto",
        )}
      >
        <div
          aria-hidden="true"
          className="border-r border-hairline bg-canvas py-3 pr-2 text-right font-mono text-micro leading-5 text-ink-tertiary select-none"
        >
          {Array.from({ length: lines }, (_, i) => (
            <div key={i} className={i + 1 === pos[0] ? "text-ink-muted" : undefined}>
              {i + 1}
            </div>
          ))}
        </div>
        <textarea
          ref={ta}
          aria-label="LaTeX source"
          value={value}
          wrap="off"
          spellCheck={false}
          rows={lines + 1}
          onChange={(e) => {
            set(e.target.value);
            track(e.target);
          }}
          onKeyDown={onKey}
          onKeyUp={(e) => track(e.currentTarget)}
          onClick={(e) => track(e.currentTarget)}
          className="block w-full resize-none overflow-x-auto overflow-y-hidden border-none bg-transparent px-3.5 py-3 font-mono text-caption leading-5 whitespace-pre text-ink outline-none"
          style={{ tabSize: 2 }}
        />
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-hairline px-3 py-2 text-caption text-ink-subtle">
        <span className="text-pretty">{hint}</span>
        <span className="font-mono text-micro whitespace-nowrap text-ink-tertiary">
          Ln {pos[0]}, Col {pos[1]}
        </span>
      </div>
    </div>
  );
}
