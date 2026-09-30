import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { schema } from "@ge/db";
import { getDb } from "@/server/db";
import { enqueue } from "@/server/queue";
import { getSession } from "@/server/session";
import { putObject } from "@/server/storage";

export const dynamic = "force-dynamic";

const MAX_BYTES = 10 * 1024 * 1024;
const TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/x-tex": "tex",
  "text/x-tex": "tex",
};

/**
 * Upload the main resume (PDF, DOCX or LaTeX, up to 10 MB). Stores the file, points the user's
 * main resume at it and queues `resume.parse`, which fills the profile (docs/architecture.md).
 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Sign in first." }, { status: 401 });
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return Response.json({ error: "Attach a file." }, { status: 400 });
  const ext = TYPES[file.type] ?? (file.name.toLowerCase().endsWith(".tex") ? "tex" : undefined);
  if (!ext) return Response.json({ error: "Use a PDF, DOCX or .tex file." }, { status: 415 });
  if (file.size > MAX_BYTES)
    return Response.json({ error: "Files can be up to 10 MB." }, { status: 413 });

  const userId = session.user.id;
  const key = `users/${userId}/resumes/${randomUUID()}.${ext}`;
  await putObject(
    key,
    new Uint8Array(await file.arrayBuffer()),
    file.type || "application/octet-stream",
  );

  const db = getDb();
  const [existing] = await db
    .select({ id: schema.resumes.id })
    .from(schema.resumes)
    .where(and(eq(schema.resumes.userId, userId), eq(schema.resumes.kind, "main")));
  const values = {
    sourceFormat: ext === "tex" ? ("latex" as const) : ("structured" as const),
    pdfKey: ext === "pdf" ? key : null,
    // `source` holds LaTeX text, not a storage key; resume.parse gets the key and fills it in.
    source: null,
    editedAt: new Date(),
  };
  const [resume] = existing
    ? await db
        .update(schema.resumes)
        .set(values)
        .where(eq(schema.resumes.id, existing.id))
        .returning({ id: schema.resumes.id })
    : await db
        .insert(schema.resumes)
        .values({ userId, kind: "main", name: "Main resume", ...values })
        .returning({ id: schema.resumes.id });

  // Documents' upload view sends defer=1 and queues the parse from "Fit resume" with its options.
  if (form.get("defer") !== "1") {
    await enqueue(
      "resume.parse",
      { userId, resumeId: resume!.id, key, format: ext },
      { singletonKey: resume!.id },
    );
  }
  return Response.json({ id: resume!.id, key, name: file.name, size: file.size });
}
