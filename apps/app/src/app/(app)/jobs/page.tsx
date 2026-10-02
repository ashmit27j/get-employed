import type { Metadata } from "next";
import { after } from "next/server";
import { JobsBoard } from "@/components/jobs/JobsBoard";
import { PageBody, Topbar } from "@/components/shell/AppShell";
import { keepFeedFresh } from "@/server/freshness";
import { loadJobCards } from "@/server/jobs";
import { loadSavedSearches } from "@/server/searches";
import { requireOnboardedUser } from "@/server/session";
import { loadSettings } from "@/server/settings";

export const metadata: Metadata = { title: "Job board" };

export default async function JobsPage() {
  const user = await requireOnboardedUser();
  // After the response, so the freshness check never competes with the page's own queries.
  after(() => keepFeedFresh(user.id));
  const [all, searches, settings] = await Promise.all([
    loadJobCards(user.id),
    loadSavedSearches(user.id),
    loadSettings(user.id),
  ]);
  // Settings → Minimum match score hides lower-scored roles; unscored roles still show.
  const jobs = all.filter((j) => j.score == null || j.score >= settings.general.minMatch);
  return (
    <>
      <Topbar crumbs={[{ label: "Job board" }]} />
      <PageBody>
        <JobsBoard jobs={jobs} searches={searches} nowIso={new Date().toISOString()} />
      </PageBody>
    </>
  );
}
