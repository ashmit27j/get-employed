"use server";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { GithubSnapshot } from "@ge/core";
import { schema } from "@ge/db";
import { getDb } from "../db";
import { loadProfile, saveProfile } from "../profile";
import { enqueue } from "../queue";
import { requireUser } from "../session";

const { linkedProfiles } = schema;
// GitHub usernames: letters, digits and single hyphens, up to 39 characters.
const Login = z
  .string()
  .trim()
  .regex(/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i, "That isn't a GitHub username.");

/** "Connect": remember the username and read its public repositories (profile.import-github). */
export async function connectGithub(login: string) {
  const user = await requireUser();
  const name = Login.parse(login);
  const db = getDb();
  const [existing] = await db
    .select({ snapshot: linkedProfiles.snapshot })
    .from(linkedProfiles)
    .where(and(eq(linkedProfiles.userId, user.id), eq(linkedProfiles.kind, "github")));
  // The same account keeps its data while it refreshes; a different one starts over.
  const same =
    (existing?.snapshot as GithubSnapshot | null)?.login?.toLowerCase() === name.toLowerCase();
  await db
    .insert(linkedProfiles)
    .values({ userId: user.id, kind: "github", source: name })
    .onConflictDoUpdate({
      target: [linkedProfiles.userId, linkedProfiles.kind],
      set: same ? { source: name } : { source: name, snapshot: null, importedAt: null },
    });
  await enqueue(
    "profile.import-github",
    { userId: user.id, login: name },
    { singletonKey: `github:${user.id}` },
  );
  revalidatePath("/profiles/github");
}

/** linkedin.com/in/<handle>, with or without https:// and www., normalised. */
const LinkedinUrl = z
  .string()
  .trim()
  .transform((v) => v.replace(/^https?:\/\//i, "").replace(/^(www\.|[a-z]{2}\.)/i, ""))
  .pipe(z.string().regex(/^linkedin\.com\/in\/[\w%-]{3,100}\/?(\?.*)?$/i))
  .transform((v) => `https://www.${v.split("?")[0]!.replace(/\/$/, "")}`);

/**
 * The alternative to the PDF export: import from the public profile URL. Queues the same
 * profile.import-linkedin job, which reads the page instead of the file.
 */
export async function importLinkedinUrl(
  url: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await requireUser();
  const parsed = LinkedinUrl.safeParse(url);
  if (!parsed.success)
    return { ok: false, error: "Paste your profile link, like linkedin.com/in/your-name." };
  await getDb()
    .insert(linkedProfiles)
    .values({ userId: user.id, kind: "linkedin", source: parsed.data })
    .onConflictDoUpdate({
      target: [linkedProfiles.userId, linkedProfiles.kind],
      set: { source: parsed.data, snapshot: null, suggestions: [], importedAt: null },
    });
  await enqueue(
    "profile.import-linkedin",
    { userId: user.id, url: parsed.data },
    { singletonKey: `linkedin:${user.id}` },
  );
  revalidatePath("/profiles/linkedin");
  return { ok: true };
}

export async function removeLinkedin() {
  const user = await requireUser();
  await getDb()
    .delete(linkedProfiles)
    .where(and(eq(linkedProfiles.userId, user.id), eq(linkedProfiles.kind, "linkedin")));
  revalidatePath("/profiles/linkedin");
}

/** "Add N to Projects": copy repositories into the main resume's Projects, skipping ones already there. */
export async function addReposToResume(repos: { name: string; desc: string; topics: string[] }[]) {
  const user = await requireUser();
  const list = z
    .array(
      z.object({
        name: z.string().max(100),
        desc: z.string().max(500),
        topics: z.array(z.string().max(40)).max(20),
      }),
    )
    .max(20)
    .parse(repos);
  const { doc } = await loadProfile(user.id);
  const have = new Set(doc.projects.map((p) => p.name.toLowerCase()));
  const added = list
    .filter((r) => !have.has(r.name.toLowerCase()))
    .map((r) => ({ name: r.name, stack: r.topics.join(", "), bullets: [r.desc] }));
  if (added.length) await saveProfile(user.id, { ...doc, projects: [...doc.projects, ...added] });
  revalidatePath("/documents");
  return added.length;
}
