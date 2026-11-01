import "server-only";
import { mintArenaToken, parseAdminIds } from "@ge/core/arena-token";
import { env } from "./env";

/** Coding Arena runs on AWS (infra/coding-arena); this is GetEmployed's side of the handshake. */
export function arenaConfigured(): boolean {
  const e = env();
  return Boolean(e.ARENA_API_URL && e.ARENA_WS_URL && e.ARENA_TOKEN_SECRET);
}

export function isArenaAdmin(userId: string): boolean {
  return parseAdminIds(env().ARENA_ADMIN_USER_IDS).has(userId);
}

/** A 5-minute token the Arena's Lambda authorizers accept. Throws when Arena isn't configured. */
export async function arenaTokenFor(userId: string): Promise<string> {
  const secret = env().ARENA_TOKEN_SECRET;
  if (!secret) throw new Error("ARENA_TOKEN_SECRET is not set.");
  return mintArenaToken({ userId, isAdmin: isArenaAdmin(userId) }, secret);
}

export class ArenaError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Server-to-server call to the Arena HTTP API as this user (used by server components). */
export async function arenaFetch<T>(
  userId: string,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const base = env().ARENA_API_URL;
  if (!base) throw new ArenaError(503, "Coding Arena isn't set up on this server.");
  const res = await fetch(`${base}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      ...init.headers,
      authorization: `Bearer ${await arenaTokenFor(userId)}`,
      "content-type": "application/json",
    },
  });
  const body = (await res.json().catch(() => ({}))) as { error?: string } & T;
  if (!res.ok) throw new ArenaError(res.status, body.error ?? "Coding Arena didn't respond.");
  return body;
}
