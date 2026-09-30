import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { SavedSearchView } from "@/components/jobs/SavedSearch";
import { Topbar } from "@/components/shell/AppShell";
import { loadSavedSearch, loadSavedSearchMatches } from "@/server/searches";
import { requireOnboardedUser } from "@/server/session";

export const metadata: Metadata = { title: "Saved search" };

export default async function SavedSearchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const user = await requireOnboardedUser();
  const search = await loadSavedSearch(user.id, id);
  if (!search) notFound();
  const matches = await loadSavedSearchMatches(user.id, id);
  return (
    <>
      <Topbar
        crumbs={[{ label: "Jobs", href: "/jobs?board=Saved" }, { label: "Saved searches" }]}
      />
      <SavedSearchView
        key={search.id}
        search={search}
        matches={matches}
        nowIso={new Date().toISOString()}
      />
    </>
  );
}
