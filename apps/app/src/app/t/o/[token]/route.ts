import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { schema } from "@ge/db";
import { getDb } from "@/server/db";

export const dynamic = "force-dynamic";

// 1×1 transparent GIF.
const PIXEL = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");

/**
 * Open tracking (docs/email-and-google.md): the pixel in sent outreach. Approximate by nature;
 * image blocking and proxy prefetching both affect it. Only the first open is recorded.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const id = z.uuid().safeParse(token.replace(/\.gif$/, ""));
  if (id.success) {
    await getDb()
      .update(schema.emails)
      .set({ status: "opened", openedAt: new Date() })
      .where(and(eq(schema.emails.trackingToken, id.data), inArray(schema.emails.status, ["sent"])))
      .catch((err: unknown) => console.error("[track]", err));
  }
  return new Response(PIXEL, {
    headers: { "Content-Type": "image/gif", "Cache-Control": "no-store, max-age=0" },
  });
}
