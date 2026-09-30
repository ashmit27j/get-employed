import { z } from "zod";
import { getSession } from "@/server/session";
import { speech } from "@/server/tts";

export const dynamic = "force-dynamic";

/** The interviewer's line as MP3, or {fallback: "browser"} for the browser to speak it. */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Sign in first." }, { status: 401 });
  const body = z
    .object({ text: z.string().trim().min(1).max(600) })
    .safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: "Nothing to say." }, { status: 400 });
  const audio = await speech(body.data.text).catch((err: unknown) => {
    console.error("[tts]", err);
    return null;
  });
  if (!audio) return Response.json({ fallback: "browser" });
  return new Response(Buffer.from(audio), {
    headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
  });
}
