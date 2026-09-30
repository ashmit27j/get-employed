import type { Metadata } from "next";
import { PageHeader } from "@ge/ui";
import { Tracker } from "@/components/tracker/Tracker";
import { PageBody, Topbar } from "@/components/shell/AppShell";
import { requireOnboardedUser } from "@/server/session";
import { loadTracker } from "@/server/tracker";

export const metadata: Metadata = { title: "Application Tracker" };

export default async function TrackerPage() {
  const user = await requireOnboardedUser();
  const data = await loadTracker(user.id);
  return (
    <>
      <Topbar crumbs={[{ label: "Application Tracker" }]} />
      <PageBody>
        <PageHeader
          title="Application tracker"
          sub="Every role you've saved or applied to, with what to do next. Replies and interview invites update stages automatically."
        />
        <Tracker apps={data.apps} alerts={data.alerts} nowIso={new Date().toISOString()} />
      </PageBody>
    </>
  );
}
