import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { schema } from "@ge/db";
import { getDb } from "@/server/db";
import { getSession } from "@/server/session";
import { getObject } from "@/server/storage";

export const dynamic = "force-dynamic";

/**
 * The compiled PDF of a resume (resume.compile), when it matches the resume's latest edit.
 * 404 otherwise, and the page prints its preview instead.
 */
async function compiled(request: Request, id: string) {
  const session = await getSession();
  if (!session) return null;
  if (!z.uuid().safeParse(id).success) return null;
  const [row] = await getDb()
    .select({
      pdfKey: schema.resumes.pdfKey,
      editedAt: schema.resumes.editedAt,
      name: schema.resumes.name,
    })
    .from(schema.resumes)
    .where(and(eq(schema.resumes.id, id), eq(schema.resumes.userId, session.user.id)));
  const key = row?.pdfKey;
  if (!row || !key?.startsWith(`users/${session.user.id}/compiled/`)) return null;
  if (!key.endsWith(`-${row.editedAt.getTime()}.pdf`)) return null;
  return { key, name: row.name, method: request.method };
}

export async function HEAD(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const hit = await compiled(request, (await params).id);
  return new Response(null, { status: hit ? 200 : 404 });
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const hit = await compiled(request, (await params).id);
  const file = hit ? await getObject(hit.key) : null;
  if (!hit || !file) return new Response("Not compiled yet", { status: 404 });
  const filename = `${hit.name.replace(/[^\w.-]+/g, "-")}.pdf`;
  return new Response(Buffer.from(file.body), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
