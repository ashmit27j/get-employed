import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { z } from "zod";
import { JobDetailView } from "@/components/jobs/JobDetail";
import { Topbar } from "@/components/shell/AppShell";
import { loadJobDetail } from "@/server/jobs";
import { requireOnboardedUser } from "@/server/session";

type Props = { params: Promise<{ id: string }> };

/** Shared by the metadata and the page within one request. */
const loadById = cache(async (id: string) => {
  if (!z.uuid().safeParse(id).success) notFound();
  const user = await requireOnboardedUser();
  const detail = await loadJobDetail(user, id);
  if (!detail) notFound();
  return detail;
});
const load = async (params: Props["params"]) => loadById((await params).id);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { job } = await load(params);
  return { title: `${job.title} · ${job.company}` };
}

export default async function JobDetailPage({ params }: Props) {
  const detail = await load(params);
  return (
    <>
      <Topbar crumbs={[{ label: "Jobs", href: "/jobs" }, { label: detail.job.title }]} />
      <JobDetailView detail={detail} nowIso={new Date().toISOString()} />
    </>
  );
}
