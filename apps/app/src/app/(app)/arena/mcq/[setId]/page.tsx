import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ARENAS } from "@ge/core";
import { McqRunner } from "@/components/arena/McqRunner";
import { ArenaUnavailable } from "@/components/arena/parts";
import { PageBody, Topbar } from "@/components/shell/AppShell";
import { loadMcqSet } from "@/server/arena-pages";
import { requireOnboardedUser } from "@/server/session";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ setId: string }>;
}): Promise<Metadata> {
  const { setId } = await params;
  const user = await requireOnboardedUser();
  const r = await loadMcqSet(user.id, setId);
  return { title: r?.ok ? `${r.data.set.title} · Coding Arena` : "Coding Arena" };
}

export default async function McqPage({ params }: { params: Promise<{ setId: string }> }) {
  const { setId } = await params;
  const user = await requireOnboardedUser();
  const r = await loadMcqSet(user.id, setId);
  if (!r || (!r.ok && r.status === 404)) notFound();
  if (!r.ok) {
    return (
      <>
        <Topbar crumbs={[{ label: "Coding Arena", href: "/arena" }, { label: "Set" }]} />
        <PageBody>
          <ArenaUnavailable status={r.status} message={r.message} />
        </PageBody>
      </>
    );
  }
  const { set, best } = r.data;
  return (
    <>
      <Topbar
        crumbs={[
          { label: "Coding Arena", href: "/arena" },
          { label: ARENAS[set.arena].label, href: `/arena/${set.arena}` },
          { label: set.title },
        ]}
      />
      <PageBody>
        <McqRunner key={set.setId} set={set} best={best} />
      </PageBody>
    </>
  );
}
