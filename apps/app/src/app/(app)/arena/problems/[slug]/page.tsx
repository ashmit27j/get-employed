import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ARENAS } from "@ge/core";
import { ProblemWorkspace } from "@/components/arena/ProblemWorkspace";
import { ArenaUnavailable } from "@/components/arena/parts";
import { PageBody, Topbar } from "@/components/shell/AppShell";
import { loadProblem } from "@/server/arena-pages";
import { requireOnboardedUser } from "@/server/session";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const user = await requireOnboardedUser();
  const r = await loadProblem(user.id, slug);
  return { title: r?.ok ? `${r.data.problem.title} · Coding Arena` : "Coding Arena" };
}

export default async function ProblemPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireOnboardedUser();
  const r = await loadProblem(user.id, slug);
  if (!r || (!r.ok && r.status === 404)) notFound();
  if (!r.ok) {
    return (
      <>
        <Topbar crumbs={[{ label: "Coding Arena", href: "/arena" }, { label: "Problem" }]} />
        <PageBody>
          <ArenaUnavailable status={r.status} message={r.message} />
        </PageBody>
      </>
    );
  }
  const p = r.data.problem;
  return (
    <>
      <Topbar
        crumbs={[
          { label: "Coding Arena", href: "/arena" },
          { label: ARENAS[p.arena].label, href: `/arena/${p.arena}` },
          { label: p.title },
        ]}
      />
      <ProblemWorkspace key={p.slug} problem={p} />
    </>
  );
}
