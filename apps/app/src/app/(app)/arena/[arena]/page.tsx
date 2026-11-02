import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ARENAS, isArenaId } from "@ge/core";
import { PageHeader } from "@ge/ui";
import { McqList } from "@/components/arena/McqList";
import { ProblemList } from "@/components/arena/ProblemList";
import { ArenaUnavailable } from "@/components/arena/parts";
import { PageBody, Topbar } from "@/components/shell/AppShell";
import { loadMcqList, loadProblemList } from "@/server/arena-pages";
import { requireOnboardedUser } from "@/server/session";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ arena: string }>;
}): Promise<Metadata> {
  const { arena } = await params;
  return { title: isArenaId(arena) ? ARENAS[arena].label : "Coding Arena" };
}

export default async function ArenaListPage({
  params,
  searchParams,
}: {
  params: Promise<{ arena: string }>;
  searchParams: Promise<{ role?: string; company?: string; topic?: string }>;
}) {
  const { arena } = await params;
  if (!isArenaId(arena)) notFound();
  const q = await searchParams;
  const user = await requireOnboardedUser();
  const info = ARENAS[arena];
  const crumbs = [{ label: "Coding Arena", href: "/arena" }, { label: info.label }];

  if (info.kind === "mcq") {
    const r = await loadMcqList(user.id, arena);
    return (
      <>
        <Topbar crumbs={crumbs} />
        <PageBody>
          <PageHeader title={info.label} sub={info.description} />
          {r.ok ? (
            <McqList sets={r.data.sets} best={r.data.best} />
          ) : (
            <ArenaUnavailable status={r.status} message={r.message} />
          )}
        </PageBody>
      </>
    );
  }

  const r = await loadProblemList(user.id, arena);
  return (
    <>
      <Topbar crumbs={crumbs} />
      <PageBody>
        <PageHeader title={info.label} sub={info.description} />
        {r.ok ? (
          <ProblemList
            problems={r.data.problems}
            initial={{ role: q.role, company: q.company, topic: q.topic }}
          />
        ) : (
          <ArenaUnavailable status={r.status} message={r.message} />
        )}
      </PageBody>
    </>
  );
}
