import { z } from "zod";
import { interviewTurn } from "@ge/ai";
import { appModel } from "@/server/ai";
import { getSession } from "@/server/session";

export const dynamic = "force-dynamic";

const Body = z.object({
  role: z.string().max(200),
  strictness: z.enum(["Lenient", "Standard", "Strict"]),
  transcript: z.array(z.object({ who: z.enum(["ai", "you"]), text: z.string().max(4000) })).max(80),
  nextQuestion: z.string().max(600).nullable(),
  followUpsLeft: z.number().int().min(0).max(5),
});

/**
 * The interviewer's next line (docs/interviews.md): a short follow-up on the answer, or the next
 * planned question. {fallback: true} when no LLM is configured; the page then uses its rules.
 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Sign in first." }, { status: 401 });
  const body = Body.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: "Bad request" }, { status: 400 });
  const model = await appModel(session.user.id, "interview");
  if (!model) return Response.json({ fallback: true });
  try {
    return Response.json(await interviewTurn(model, body.data));
  } catch (err) {
    console.error("[interview] turn failed", err);
    return Response.json({ fallback: true });
  }
}
