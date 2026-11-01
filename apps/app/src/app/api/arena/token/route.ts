import { ARENA_TOKEN_TTL_SECONDS } from "@ge/core/arena-token";
import { arenaConfigured, arenaTokenFor } from "@/server/arena";
import { env } from "@/server/env";
import { getSession } from "@/server/session";

export const dynamic = "force-dynamic";

/**
 * A short-lived Coding Arena token for the signed-in user. The browser uses it for Arena API
 * calls (Authorization: Bearer) and the live-verdict WebSocket (?ticket=). See D30.
 */
export async function POST() {
  const session = await getSession();
  if (!session) return Response.json({ error: "Sign in first." }, { status: 401 });
  if (!arenaConfigured()) {
    return Response.json({ error: "Coding Arena isn't set up on this server." }, { status: 503 });
  }
  const token = await arenaTokenFor(session.user.id);
  return Response.json(
    {
      token,
      expiresIn: ARENA_TOKEN_TTL_SECONDS,
      apiUrl: env().ARENA_API_URL,
      wsUrl: env().ARENA_WS_URL,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
