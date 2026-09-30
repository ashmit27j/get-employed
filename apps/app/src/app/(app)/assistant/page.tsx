import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { Chat } from "@/components/assistant/Chat";
import { Topbar } from "@/components/shell/AppShell";
import { loadThread } from "@/server/assistant/threads";
import { requireOnboardedUser } from "@/server/session";

export const metadata: Metadata = { title: "Assistant" };

export default async function AssistantPage({
  searchParams,
}: {
  searchParams: Promise<{ thread?: string; new?: string }>;
}) {
  const q = await searchParams;
  const user = await requireOnboardedUser();
  let thread = null;
  if (q.thread) {
    if (!z.uuid().safeParse(q.thread).success) notFound();
    thread = await loadThread(user.id, q.thread);
    if (!thread) notFound();
  }
  return (
    <>
      <Topbar
        crumbs={[
          { label: "Assistant", href: "/assistant?new=1" },
          { label: thread?.title ?? "New chat" },
        ]}
      />
      <div className="flex h-[calc(100vh-56px)] min-h-0 flex-col max-md:h-[calc(100dvh-112px)]">
        <Chat initial={thread} userName={user.name} />
      </div>
    </>
  );
}
