import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { MainResume } from "@/components/documents/MainResume";
import { TailoredList } from "@/components/documents/TailoredList";
import { TailorResume } from "@/components/documents/TailorResume";
import { UploadResume } from "@/components/documents/UploadResume";
import { PageBody, Topbar } from "@/components/shell/AppShell";
import { loadMainResume, loadTailor, loadTailoredList, mainAtsKeywords } from "@/server/documents";
import { requireOnboardedUser } from "@/server/session";

export const metadata: Metadata = { title: "Documents" };

type View = "main" | "list" | "upload" | "tailor";
const DOCS = { label: "Documents", href: "/documents" };
const MAIN = { label: "Main resume", href: "/documents?view=main" };
const LIST = { label: "Tailored resumes", href: "/documents?view=list" };

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; tab?: string; job?: string }>;
}) {
  const q = await searchParams;
  // `?tab=tailor` is the prototype's older spelling.
  const view: View =
    q.view === "list" || q.view === "upload" || q.view === "tailor"
      ? q.view
      : q.tab === "tailor"
        ? "tailor"
        : "main";
  const user = await requireOnboardedUser();

  if (view === "tailor") {
    if (!q.job) redirect("/documents?view=list");
    if (!z.uuid().safeParse(q.job).success) notFound();
    const data = await loadTailor(user.id, q.job);
    if (!data) notFound();
    return (
      <>
        <Topbar crumbs={[DOCS, LIST, { label: data.job.company }]} />
        <PageBody wide>
          <TailorResume key={data.resume?.id ?? "new"} data={data} />
        </PageBody>
      </>
    );
  }

  if (view === "list") {
    const items = await loadTailoredList(user.id);
    return (
      <>
        <Topbar crumbs={[DOCS, { label: "Tailored resumes" }]} />
        <PageBody wide>
          <TailoredList items={items} />
        </PageBody>
      </>
    );
  }

  const main = await loadMainResume(user.id);
  if (view === "upload") {
    return (
      <>
        <Topbar crumbs={[DOCS, MAIN, { label: "Upload" }]} />
        <PageBody wide>
          <UploadResume doc={main.doc} template={main.template} />
        </PageBody>
      </>
    );
  }

  const { keywords, postings } = await mainAtsKeywords(user.id);
  return (
    <>
      <Topbar crumbs={[DOCS, { label: "Main resume" }]} />
      <PageBody wide>
        <MainResume
          data={main}
          keywords={keywords}
          postings={postings}
          role={user.targetRole?.split(",")[0]?.trim() ?? null}
        />
      </PageBody>
    </>
  );
}
