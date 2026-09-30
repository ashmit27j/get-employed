import "server-only";
import { isDeepStrictEqual } from "node:util";
import { and, eq, sql } from "drizzle-orm";
import {
  JobDetailsSchema,
  ProfileSchema,
  linksFromContact,
  type JobDetails,
  type Profile,
} from "@ge/core";
import { schema } from "@ge/db";
import { getDb } from "./db";
import { enqueue } from "./queue";

const { profiles, resumes, users } = schema;

/** A profile for someone who hasn't uploaded or filled one in yet. */
export function emptyProfile(user: { name: string; email: string }): Profile {
  return ProfileSchema.parse({ contact: { name: user.name, email: user.email } });
}

/** The user's resume content and its version (matches are cached per version). */
export async function loadProfile(userId: string): Promise<{ doc: Profile; version: number }> {
  const db = getDb();
  const [row] = await db
    .select({ doc: profiles.doc, version: profiles.version })
    .from(profiles)
    .where(eq(profiles.userId, userId));
  if (row) return { doc: ProfileSchema.parse(row.doc), version: row.version };
  const [user] = await db
    .select({ name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, userId));
  return { doc: emptyProfile(user ?? { name: "", email: "" }), version: 1 };
}

/**
 * Everything the Job Profile page edits: the shared resume content plus its own details.
 * Missing details fall back to what onboarding collected and to the resume's links.
 */
export async function loadJobProfile(user: {
  id: string;
  targetRole?: string | null;
  preferredLocations?: string[] | null;
}): Promise<{ doc: Profile; details: JobDetails }> {
  const [{ doc }, [row]] = await Promise.all([
    loadProfile(user.id),
    getDb()
      .select({ details: profiles.details })
      .from(profiles)
      .where(eq(profiles.userId, user.id)),
  ]);
  const stored = row?.details ?? {};
  const details = JobDetailsSchema.parse({
    roles: user.targetRole ?? "",
    locations: (user.preferredLocations ?? []).filter((l) => l !== "Open to relocate").join(", "),
    relocate: (user.preferredLocations ?? []).includes("Open to relocate"),
    ...stored,
    links: { ...linksFromContact(doc.contact.links), ...stored.links },
  });
  return { doc, details };
}

/**
 * Replace the resume content. When it changed, bump its version and queue a re-match; scores keep
 * showing the previous version's match until match.compute writes the new one (server/jobs.ts).
 * The main resume mirrors the same content (docs/decisions.md D18); `atsScore` updates its score.
 */
export async function saveProfile(
  userId: string,
  doc: Profile,
  extra: { atsScore?: number } = {},
): Promise<number> {
  const parsed = ProfileSchema.parse(doc);
  const db = getDb();
  const [current] = await db
    .select({ doc: profiles.doc, version: profiles.version })
    .from(profiles)
    .where(eq(profiles.userId, userId));
  const changed = !current || !isDeepStrictEqual(ProfileSchema.parse(current.doc), parsed);
  if (!changed && extra.atsScore == null) return current!.version;

  const [row] = changed
    ? await db
        .insert(profiles)
        .values({ userId, doc: parsed })
        .onConflictDoUpdate({
          target: profiles.userId,
          set: { doc: parsed, version: sql`${profiles.version} + 1` },
        })
        .returning({ version: profiles.version })
    : [current!];
  const mirror = {
    doc: parsed,
    editedAt: new Date(),
    ...(extra.atsScore != null && { atsScore: extra.atsScore }),
  };
  const updated = await db
    .update(resumes)
    .set(mirror)
    .where(and(eq(resumes.userId, userId), eq(resumes.kind, "main")))
    .returning({ id: resumes.id });
  if (updated.length === 0)
    await db.insert(resumes).values({ userId, kind: "main", name: "Main resume", ...mirror });
  if (changed) {
    await enqueue("match.compute", { userId }, { singletonKey: `match:${userId}` }).catch(
      (err: unknown) => console.error("[profile] could not queue match.compute", err),
    );
  }
  return row!.version;
}

/** Store the Job Profile's own details (profiles.details). */
export async function saveJobDetails(userId: string, details: JobDetails) {
  const parsed = JobDetailsSchema.parse(details);
  await getDb()
    .insert(profiles)
    .values({ userId, doc: (await loadProfile(userId)).doc, details: parsed })
    .onConflictDoUpdate({ target: profiles.userId, set: { details: parsed } });
}
