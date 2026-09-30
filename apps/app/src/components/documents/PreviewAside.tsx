"use client";
import { useState, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Button, Icon, IconButton, usePopover } from "@ge/ui";
import { templateName, type Profile } from "@ge/core";
import { ResumePaper } from "./ResumePaper";

/** Export PDF: prints the A4 pages (globals.css) until compiled PDFs arrive with resume.compile. */
/**
 * Export PDF: the compiled PDF (Tectonic, resume.compile) when it matches the latest edit,
 * otherwise the browser's print of the A4 preview.
 */
export async function exportResume(resumeId?: string | null) {
  if (resumeId) {
    const url = `/api/resumes/${resumeId}/pdf`;
    const head = await fetch(url, { method: "HEAD" }).catch(() => null);
    if (head?.ok) {
      const a = document.createElement("a");
      a.href = url;
      a.download = "";
      a.click();
      return;
    }
  }
  window.print();
}
export const printResume = () => void exportResume();

const noop = () => () => {};

/** An off-screen copy of the resume at A4 width that only shows when printing. */
export function PrintableResume({ doc, template }: { doc: Profile; template: string }) {
  const mounted = useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
  if (!mounted) return null;
  // Unlayered print rules in globals.css override the off-screen position.
  return createPortal(
    <div
      data-print-resume=""
      aria-hidden="true"
      className="pointer-events-none fixed top-0 -left-[9999px] w-[210mm]"
    >
      <ResumePaper doc={doc} template={template} gap={0} />
    </div>,
    document.body,
  );
}

function ShareMenu({ subject, resumeId }: { subject: string; resumeId?: string | null }) {
  const { open, setOpen, ref, triggerRef } = usePopover();
  const [copied, setCopied] = useState(false);
  const items: {
    label: string;
    icon: "link" | "mail" | "download" | "external-link";
    act: () => void;
  }[] = [
    {
      label: copied ? "Link copied" : "Copy link",
      icon: "link",
      act: () => {
        void navigator.clipboard?.writeText(location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      },
    },
    {
      label: "Share via email",
      icon: "mail",
      act: () => {
        location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(location.href)}`;
      },
    },
    { label: "Download PDF", icon: "download", act: () => void exportResume(resumeId) },
    {
      label: "Share to LinkedIn",
      icon: "external-link",
      act: () =>
        window.open(
          `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(location.href)}`,
          "_blank",
          "noopener",
        ),
    },
  ];
  return (
    <div ref={ref} className="relative flex">
      <button
        ref={triggerRef}
        type="button"
        aria-label="Share document"
        title="Share document"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="inline-flex size-7 cursor-pointer items-center justify-center rounded-sm text-ink-subtle transition-colors duration-(--duration-base) hover:bg-surface-2 hover:text-ink focus-visible:shadow-focus focus-visible:outline-none"
      >
        <Icon name="share-2" size={16} />
      </button>
      {open && (
        <div
          role="menu"
          aria-label="Share document"
          className="absolute top-[calc(100%+6px)] right-0 z-30 box-border flex w-[200px] flex-col rounded-lg border border-hairline bg-surface-2 p-1 shadow-edge"
        >
          {items.map((o) => (
            <button
              key={o.icon}
              type="button"
              role="menuitem"
              onClick={() => {
                o.act();
                if (o.icon !== "link") setOpen(false);
              }}
              className="flex cursor-pointer items-center gap-2.5 rounded-sm px-2.5 py-2 text-left text-small text-ink hover:bg-surface-3 focus-visible:bg-surface-3 focus-visible:outline-none"
            >
              <Icon name={o.icon} size={14} className="text-ink-subtle" />
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** The sticky right column: template, (upload, export), share, and the paginated preview. */
export function PreviewAside({
  doc,
  template,
  onOpenPicker,
  highlights,
  subject,
  tools,
  footer,
  resumeId,
}: {
  doc: Profile;
  template: string;
  onOpenPicker: () => void;
  highlights?: string[];
  subject: string;
  /** Extra buttons after the template button (upload and export on the main resume). */
  tools?: ReactNode;
  footer?: ReactNode;
  /** For "Download PDF": serves the compiled PDF when there is one. */
  resumeId?: string | null;
}) {
  return (
    <aside className="sticky top-[88px] flex max-w-[560px] min-w-0 flex-[1_1_420px] flex-col gap-3 max-lg:static max-lg:max-w-none">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            iconLeft={<Icon name="layout-template" size={14} />}
            onClick={onOpenPicker}
          >
            Template: {templateName(template)}
          </Button>
          {tools}
        </div>
        <ShareMenu subject={subject} resumeId={resumeId} />
      </div>
      <ResumePaper doc={doc} template={template} highlights={highlights} />
      {footer}
      <PrintableResume doc={doc} template={template} />
    </aside>
  );
}

export function ToolIcon({
  icon,
  title,
  onClick,
  href,
}: {
  icon: "upload" | "download";
  title: string;
  onClick?: () => void;
  href?: string;
}) {
  return (
    <span className="inline-flex rounded-md border border-hairline bg-surface-1">
      <IconButton icon={icon} title={title} onClick={onClick} href={href} size={28} />
    </span>
  );
}
