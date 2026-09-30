import type { Metadata } from "next";
import { and, desc, eq } from "drizzle-orm";
import { schema } from "@ge/db";
import { JobProfile } from "@/components/profile/JobProfile";
import { Topbar } from "@/components/shell/AppShell";
import { getDb } from "@/server/db";
import { loadJobProfile } from "@/server/profile";
import { requireUser } from "@/server/session";

export const metadata: Metadata = { title: "Job Profile" };

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default async function ProfilePage() {
  // Reachable while a new account is still locked: this is where it unlocks.
  const user = await requireUser();
  const [profile, resumes] = await Promise.all([
    loadJobProfile(user),
    getDb()
      .select({
        id: schema.resumes.id,
        kind: schema.resumes.kind,
        name: schema.resumes.name,
        editedAt: schema.resumes.editedAt,
        ats: schema.resumes.atsScore,
      })
      .from(schema.resumes)
      .where(and(eq(schema.resumes.userId, user.id)))
      .orderBy(schema.resumes.kind, desc(schema.resumes.editedAt)),
  ]);
  // "From Documents" in the Add document dialog.
  const library = resumes.map((r) => {
    const d = `${MONTHS[r.editedAt.getMonth()]} ${r.editedAt.getDate()}`;
    return {
      id: r.id,
      name: r.kind === "main" ? "Main resume" : `Tailored · ${r.name.replace(" · ", ", ")}`,
      meta: `${r.kind === "main" ? `Updated ${d}` : d}${r.ats != null ? ` · ATS ${r.ats}` : ""}`,
    };
  });
  return (
    <>
      <Topbar crumbs={[{ label: "Job Profile" }]} />
      <JobProfile
        // A new version (e.g. the assistant filled the profile in) starts the form from it.
        key={profile.version}
        initial={profile}
        library={library}
        locked={user.onboardingStep != null}
        firstName={user.name.split(/\s+/)[0] || user.name}
      />
    </>
  );
}
