import { randomUUID } from "node:crypto";
import { schema } from "@ge/db";
import { getDb } from "@/server/db";
import { enqueue } from "@/server/queue";
import { getSession } from "@/server/session";
import { putObject } from "@/server/storage";

export const dynamic = "force-dynamic";

const MAX_BYTES = 10 * 1024 * 1024;

/**
 * The LinkedIn "Save to PDF" export. Stores it and queues profile.import-linkedin, which rebuilds
 * the profile and writes suggestions (linked_profiles). Replaces any earlier import.
 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Sign in first." }, { status: 401 });
  const file = (await request.formData()).get("file");
  if (!(file instanceof File)) return Response.json({ error: "Attach a file." }, { status: 400 });
  if (file.type !== "application/pdf")
    return Response.json({ error: "Use the PDF from LinkedIn's Save to PDF." }, { status: 415 });
  if (file.size > MAX_BYTES)
    return Response.json({ error: "Files can be up to 10 MB." }, { status: 413 });

  const userId = session.user.id;
  const key = `users/${userId}/linkedin/${randomUUID()}.pdf`;
  await putObject(key, new Uint8Array(await file.arrayBuffer()), file.type);
  const { linkedProfiles } = schema;
  await getDb()
    .insert(linkedProfiles)
    .values({ userId, kind: "linkedin", source: key })
    .onConflictDoUpdate({
      target: [linkedProfiles.userId, linkedProfiles.kind],
      set: { source: key, snapshot: null, suggestions: [], importedAt: null, error: null },
    });
  await enqueue("profile.import-linkedin", { userId, key }, { singletonKey: `linkedin:${userId}` });
  return Response.json({ key, name: file.name, size: file.size });
}
