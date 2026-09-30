import type { Metadata } from "next";
import { GithubProfile } from "@/components/profiles/GithubProfile";
import { PageBody, Topbar } from "@/components/shell/AppShell";
import { loadProfile } from "@/server/profile";
import { loadGithub } from "@/server/profiles";
import { requireOnboardedUser } from "@/server/session";

export const metadata: Metadata = { title: "GitHub" };

export default async function GithubPage() {
  const user = await requireOnboardedUser();
  const [data, { doc }] = await Promise.all([loadGithub(user.id), loadProfile(user.id)]);
  return (
    <>
      <Topbar crumbs={[{ label: "Profiles" }, { label: "GitHub" }]} />
      <PageBody>
        <GithubProfile
          key={data.snapshot?.login ?? "none"}
          data={data}
          profile={doc}
          targetRole={user.targetRole ?? null}
        />
      </PageBody>
    </>
  );
}
