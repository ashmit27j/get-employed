import { eq } from "drizzle-orm";
import { schema } from "@ge/db";
import { getDb } from "@/server/db";
import { getSession } from "@/server/session";
import { getObject, putObject } from "@/server/storage";

export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = new Set(["image/png", "image/jpeg"]);
const keyFor = (userId: string) => `users/${userId}/photo`;

/** The signed-in user's profile photo (users.image points here). */
export async function GET() {
  const session = await getSession();
  if (!session) return new Response(null, { status: 401 });
  const obj = await getObject(keyFor(session.user.id));
  if (!obj) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(obj.body), {
    headers: { "Content-Type": obj.contentType, "Cache-Control": "private, max-age=86400" },
  });
}

/** Account → Upload photo: PNG or JPG, up to 5 MB. */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Sign in first." }, { status: 401 });
  const file = (await request.formData()).get("file");
  if (!(file instanceof File)) return Response.json({ error: "Attach a file." }, { status: 400 });
  if (!TYPES.has(file.type)) return Response.json({ error: "Use a PNG or JPG." }, { status: 415 });
  if (file.size > MAX_BYTES)
    return Response.json({ error: "Photos can be up to 5 MB." }, { status: 413 });
  await putObject(keyFor(session.user.id), new Uint8Array(await file.arrayBuffer()), file.type);
  // The version query busts the browser cache after a change.
  const image = `/api/me/photo?v=${Date.now()}`;
  await getDb().update(schema.users).set({ image }).where(eq(schema.users.id, session.user.id));
  return Response.json({ image });
}

export async function DELETE() {
  const session = await getSession();
  if (!session) return new Response(null, { status: 401 });
  await getDb()
    .update(schema.users)
    .set({ image: null })
    .where(eq(schema.users.id, session.user.id));
  return new Response(null, { status: 204 });
}
