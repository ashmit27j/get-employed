import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@ge/ui";
import { SetterTools } from "@/components/arena/SetterTools";
import { ArenaUnavailable } from "@/components/arena/parts";
import { PageBody, Topbar } from "@/components/shell/AppShell";
import { arenaConfigured, isArenaAdmin } from "@/server/arena";
import { requireOnboardedUser } from "@/server/session";

export const metadata: Metadata = { title: "Problem setter · Coding Arena" };

export default async function ArenaAdminPage() {
  const user = await requireOnboardedUser();
  // Setters are an allowlist (ARENA_ADMIN_USER_IDS, D30). Everyone else gets a 404.
  if (!isArenaAdmin(user.id)) notFound();
  return (
    <>
      <Topbar crumbs={[{ label: "Coding Arena", href: "/arena" }, { label: "Problem setter" }]} />
      <PageBody>
        <PageHeader
          title="Problem setter"
          sub="Changes go live for everyone as soon as you save. Validate the reference solutions after every test upload."
        />
        {arenaConfigured() ? <SetterTools /> : <ArenaUnavailable status={503} message="" />}
      </PageBody>
    </>
  );
}
