// Server-only: import from "@ge/core/arena-token", never from the package root.
// The app mints these for the signed-in user; the Coding Arena authorizers on AWS verify them.
import { SignJWT, jwtVerify } from "jose";

export const ARENA_TOKEN_ISSUER = "getemployed";
export const ARENA_TOKEN_AUDIENCE = "coding-arena";
/** Short-lived on purpose: the browser asks for a fresh one before each submit or socket. */
export const ARENA_TOKEN_TTL_SECONDS = 300;
const MIN_SECRET_LENGTH = 32;

export interface ArenaClaims {
  userId: string;
  isAdmin: boolean;
}

function keyFor(secret: string): Uint8Array {
  if (secret.length < MIN_SECRET_LENGTH) {
    throw new Error(`ARENA_TOKEN_SECRET must be at least ${MIN_SECRET_LENGTH} characters.`);
  }
  return new TextEncoder().encode(secret);
}

export async function mintArenaToken(
  claims: ArenaClaims,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): Promise<string> {
  return new SignJWT({ adm: claims.isAdmin })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(claims.userId)
    .setIssuer(ARENA_TOKEN_ISSUER)
    .setAudience(ARENA_TOKEN_AUDIENCE)
    .setIssuedAt(nowSeconds)
    .setExpirationTime(nowSeconds + ARENA_TOKEN_TTL_SECONDS)
    .sign(keyFor(secret));
}

/** Returns the claims, or null for anything invalid: bad signature, wrong alg/iss/aud, expired. */
export async function verifyArenaToken(
  token: string,
  secret: string,
  now: Date = new Date(),
): Promise<ArenaClaims | null> {
  if (!token || token.length > 4096) return null;
  try {
    const { payload } = await jwtVerify(token, keyFor(secret), {
      algorithms: ["HS256"],
      issuer: ARENA_TOKEN_ISSUER,
      audience: ARENA_TOKEN_AUDIENCE,
      currentDate: now,
      maxTokenAge: ARENA_TOKEN_TTL_SECONDS + 60,
      requiredClaims: ["sub", "exp", "iat"],
    });
    if (typeof payload.sub !== "string" || payload.sub.length === 0) return null;
    return { userId: payload.sub, isAdmin: payload.adm === true };
  } catch {
    return null;
  }
}

/** "a, b ,c" → Set{a,b,c}. Used for ARENA_ADMIN_USER_IDS. */
export function parseAdminIds(raw: string | undefined): Set<string> {
  return new Set(
    (raw ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
}
