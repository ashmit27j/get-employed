import { sql } from "drizzle-orm";
import { getDb } from "@/server/db";

export const dynamic = "force-dynamic";

/** Liveness plus a database round trip. Used by docker compose and uptime checks. */
export async function GET() {
  try {
    await getDb().execute(sql`select 1`);
    return Response.json({ ok: true, db: "up" });
  } catch (err) {
    console.error("[health]", err);
    return Response.json({ ok: false, db: "down" }, { status: 503 });
  }
}
