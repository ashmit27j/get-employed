"use server";
import { eq, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { schema } from "@ge/db";
import { auth } from "../auth";
import { getDb } from "../db";
import { requireUser } from "../session";

const WORK_ROLES = ["Student", "Professional", "Freelancer", "Between jobs"] as const;

/** Name (users.name), plus "What should we call you?" and role (user_settings.general). */
export async function updateAccount(patch: {
  name?: string;
  nickname?: string;
  workRole?: string;
}) {
  const user = await requireUser();
  const db = getDb();
  if (patch.name != null) {
    await db
      .update(schema.users)
      .set({ name: z.string().trim().min(1).max(120).parse(patch.name) })
      .where(eq(schema.users.id, user.id));
  }
  const general: Record<string, string> = {};
  if (patch.nickname != null) general.nickname = z.string().trim().max(60).parse(patch.nickname);
  if (patch.workRole != null) general.workRole = z.enum(WORK_ROLES).parse(patch.workRole);
  if (Object.keys(general).length) {
    await db
      .insert(schema.userSettings)
      .values({ userId: user.id, general })
      .onConflictDoUpdate({
        target: schema.userSettings.userId,
        set: { general: sql`${schema.userSettings.general} || ${JSON.stringify(general)}::jsonb` },
      });
  }
  revalidatePath("/", "layout");
}

export async function revokeSession(token: string) {
  await requireUser();
  await auth().api.revokeSession({
    body: { token: z.string().min(1).parse(token) },
    headers: await headers(),
  });
}

export async function revokeOtherSessions() {
  await requireUser();
  await auth().api.revokeOtherSessions({ headers: await headers() });
}
