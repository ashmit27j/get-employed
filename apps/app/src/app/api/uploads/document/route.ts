import { randomUUID } from "node:crypto";
import { getSession } from "@/server/session";
import { putObject } from "@/server/storage";

export const dynamic = "force-dynamic";

const MAX_BYTES = 10 * 1024 * 1024;
const TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};

/** An extra document to attach to outreach (Mailbox "Attach a document"): PDF or DOCX, up to 10 MB. */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Sign in first." }, { status: 401 });
  const file = (await request.formData()).get("file");
  if (!(file instanceof File)) return Response.json({ error: "Attach a file." }, { status: 400 });
  const ext = TYPES[file.type];
  if (!ext) return Response.json({ error: "Use a PDF or DOCX file." }, { status: 415 });
  if (file.size > MAX_BYTES)
    return Response.json({ error: "Files can be up to 10 MB." }, { status: 413 });
  const key = `users/${session.user.id}/documents/${randomUUID()}.${ext}`;
  await putObject(key, new Uint8Array(await file.arrayBuffer()), file.type);
  return Response.json({ key, name: file.name });
}
