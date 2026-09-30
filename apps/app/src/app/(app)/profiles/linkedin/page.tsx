import type { Metadata } from "next";
import { LinkedinProfile } from "@/components/profiles/LinkedinProfile";
import { PageBody, Topbar } from "@/components/shell/AppShell";
import { loadLinkedin } from "@/server/profiles";
import { requireOnboardedUser } from "@/server/session";

export const metadata: Metadata = { title: "LinkedIn" };

export default async function LinkedinPage() {
  const user = await requireOnboardedUser();
  const data = await loadLinkedin(user.id);
  return (
    <>
      <Topbar crumbs={[{ label: "Profiles" }, { label: "LinkedIn" }]} />
      <PageBody>
        <LinkedinProfile data={data} />
      </PageBody>
    </>
  );
}
