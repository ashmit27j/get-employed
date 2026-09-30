import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { Interview } from "@/components/interview/Interview";
import { Report } from "@/components/interview/Report";
import { PageBody, Topbar } from "@/components/shell/AppShell";
import { loadInterview } from "@/server/interview";
import { requireOnboardedUser } from "@/server/session";

export const metadata: Metadata = { title: "Interview prep" };

export default async function InterviewPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string; start?: string }>;
}) {
  const q = await searchParams;
  const user = await requireOnboardedUser();
  const data = await loadInterview(user.id);
  if (q.session) {
    if (!z.uuid().safeParse(q.session).success) notFound();
    const session = data.sessions.find((s) => s.id === q.session);
    if (!session) notFound();
    return (
      <>
        <Topbar crumbs={[{ label: "Interview prep", href: "/interview" }, { label: "Feedback" }]} />
        <PageBody>
          <Report session={session} sessions={data.sessions} />
        </PageBody>
      </>
    );
  }
  const firstName = user.name.split(/\s+/)[0] || user.name;
  return (
    <Interview
      key={q.start ?? "setup"}
      data={data}
      firstName={firstName}
      startMcq={q.start === "mcq"}
    />
  );
}
