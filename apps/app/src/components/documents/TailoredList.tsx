"use client";
import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { CoLogo, Icon, IconButton, PageHeader, Segmented, SortSelect } from "@ge/ui";
import { deleteTailoredResume } from "@/server/actions/documents";
import type { TailoredItem } from "@/server/documents";
import { AddResumeCard, ResumeCard } from "./DocBlocks";
import { PrintableResume } from "./PreviewAside";

const SORTS = ["Recently edited", "ATS score", "Company A–Z"] as const;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
};

export function TailoredList({ items }: { items: TailoredItem[] }) {
  const [view, setView] = useState<"Card" | "List">("Card");
  const [sort, setSort] = useState<(typeof SORTS)[number]>("Recently edited");
  const [deleted, setDeleted] = useState<string[]>([]);
  const [printing, setPrinting] = useState<TailoredItem | null>(null);
  const [, start] = useTransition();

  // Print once the printable copy of the chosen resume has rendered.
  useEffect(() => {
    if (!printing) return;
    const raf = requestAnimationFrame(() => {
      window.print();
      setPrinting(null);
    });
    return () => cancelAnimationFrame(raf);
  }, [printing]);

  let list = items.filter((r) => !deleted.includes(r.id));
  if (sort === "ATS score")
    list = [...list].sort((a, b) => (b.atsScore ?? -1) - (a.atsScore ?? -1));
  else if (sort === "Company A–Z")
    list = [...list].sort((a, b) => a.company.localeCompare(b.company));
  const href = (r: TailoredItem) =>
    r.jobId ? `/documents?view=tailor&job=${r.jobId}` : "/documents?view=list";
  const del = (r: TailoredItem) => {
    setDeleted((d) => [...d, r.id]);
    start(() => deleteTailoredResume(r.id));
  };

  return (
    <>
      <PageHeader
        title="Tailored resumes"
        sub="One version per job, generated from your main resume."
      >
        <Segmented
          label="Layout"
          options={[
            { value: "Card", icon: "layout-grid" },
            { value: "List", icon: "list" },
          ]}
          value={view}
          onChange={(v) => setView(v as "Card" | "List")}
        />
        <SortSelect
          value={sort}
          options={SORTS}
          onChange={(v) => setSort(v as (typeof SORTS)[number])}
        />
      </PageHeader>
      {view === "Card" ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5">
          {list.map((r) => (
            <ResumeCard
              key={r.id}
              title={r.title}
              sub={r.company}
              date={fmtDate(r.editedAt)}
              template={r.template}
              ats={r.atsScore}
              href={href(r)}
              doc={r.doc}
              onDelete={() => del(r)}
              onDownload={() => setPrinting(r)}
            />
          ))}
          <AddResumeCard
            href="/documents?view=upload"
            title="Upload a Resume"
            sub="PDF, DOCX or LaTeX"
            cta="Upload"
          />
        </div>
      ) : (
        <div className="flex flex-col overflow-hidden rounded-lg border border-hairline">
          {list.map((r) => (
            <div key={r.id} className="flex items-center gap-3 border-b border-hairline px-4 py-3">
              <Link
                href={href(r)}
                className="flex min-w-0 flex-1 items-center gap-3 text-inherit no-underline"
              >
                <CoLogo name={r.company || r.title} size={32} />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-small text-ink">{r.title}</span>
                  <span className="text-caption text-ink-subtle">
                    {r.company} · {fmtDate(r.editedAt)}
                  </span>
                </div>
              </Link>
              <IconButton
                icon="download"
                title="Download PDF"
                onClick={() => setPrinting(r)}
                size={32}
              />
              <IconButton icon="trash-2" title="Delete" onClick={() => del(r)} size={32} />
            </div>
          ))}
          <Link
            href="/documents?view=upload"
            className="flex items-center gap-2 px-4 py-3 text-small text-ink-subtle no-underline hover:bg-surface-1 hover:text-ink"
          >
            <Icon name="plus" size={16} />
            Upload a resume
          </Link>
        </div>
      )}
      {printing && <PrintableResume doc={printing.doc} template={printing.template} />}
    </>
  );
}
