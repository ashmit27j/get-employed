import "server-only";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { schema } from "@ge/db";
import { auth } from "./auth";
import { getDb } from "./db";
import { googleEnabled } from "./env";
import { getSession } from "./session";

export interface SessionRow {
  token: string;
  device: string;
  icon: "laptop" | "smartphone" | "monitor";
  lastActive: string;
  ip: string | null;
  current: boolean;
}

/** "Chrome on macOS" from a user agent. */
export function describeAgent(ua: string | null | undefined): {
  device: string;
  icon: SessionRow["icon"];
} {
  const a = ua ?? "";
  const browser = /Edg\//.test(a)
    ? "Edge"
    : /OPR\//.test(a)
      ? "Opera"
      : /Chrome\//.test(a)
        ? "Chrome"
        : /Firefox\//.test(a)
          ? "Firefox"
          : /Safari\//.test(a)
            ? "Safari"
            : "Browser";
  const os = /iPhone|iPad/.test(a)
    ? "iPhone"
    : /Android/.test(a)
      ? "Android"
      : /Windows/.test(a)
        ? "Windows"
        : /Mac OS X|Macintosh/.test(a)
          ? "macOS"
          : /Linux/.test(a)
            ? "Linux"
            : "an unknown device";
  return {
    device: `${browser} on ${os}`,
    icon:
      os === "iPhone" || os === "Android" ? "smartphone" : os === "Windows" ? "monitor" : "laptop",
  };
}

export async function loadAccount(userId: string) {
  const db = getDb();
  const [[user], accounts, sessions, current] = await Promise.all([
    db.select().from(schema.users).where(eq(schema.users.id, userId)),
    db
      .select({
        providerId: schema.accounts.providerId,
        accountId: schema.accounts.accountId,
        createdAt: schema.accounts.createdAt,
        updatedAt: schema.accounts.updatedAt,
      })
      .from(schema.accounts)
      .where(eq(schema.accounts.userId, userId)),
    auth().api.listSessions({ headers: await headers() }),
    getSession(),
  ]);
  const password = accounts.find((a) => a.providerId === "credential");
  const google = accounts.find((a) => a.providerId === "google");
  return {
    name: user!.name,
    email: user!.email,
    emailVerified: user!.emailVerified,
    image: user!.image,
    hasPassword: !!password,
    passwordChangedAt: password?.updatedAt.toISOString() ?? null,
    google: googleEnabled()
      ? {
          accountId: google?.accountId ?? null,
          connectedAt: google?.createdAt.toISOString() ?? null,
        }
      : null,
    sessions: sessions
      .map((s): SessionRow => ({
        token: s.token,
        ...describeAgent(s.userAgent),
        lastActive: s.updatedAt.toISOString(),
        // Loopback and unspecified addresses (local development) say nothing useful.
        ip:
          s.ipAddress && !/^(::1?$|127\.|0{1,4}(:0{1,4}){7}$|::ffff:127\.)/.test(s.ipAddress)
            ? s.ipAddress
            : null,
        current: s.token === current?.session.token,
      }))
      .sort(
        (a, b) => Number(b.current) - Number(a.current) || b.lastActive.localeCompare(a.lastActive),
      ),
  };
}
export type AccountData = Awaited<ReturnType<typeof loadAccount>>;
