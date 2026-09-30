"use server";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { STAGES } from "@ge/core";
import { schema } from "@ge/db";
import { getDb } from "../db";
import { requireUser } from "../session";

const { applications, applicationEvents, alerts } = schema;
const Id = z.uuid();

/** Move an application to another stage. The next-step note is cleared: it described the old stage. */
export async function moveApplication(id: string, stage: string) {
  const user = await requireUser();
  const to = z.enum(STAGES).parse(stage);
  const db = getDb();
  const [row] = await db
    .select({ id: applications.id, stage: applications.stage })
    .from(applications)
    .where(and(eq(applications.id, Id.parse(id)), eq(applications.userId, user.id)));
  if (!row) throw new Error("Application not found");
  if (row.stage === to) return;
  await db
    .update(applications)
    .set({ stage: to, stageChangedAt: new Date(), note: null })
    .where(eq(applications.id, row.id));
  await db
    .insert(applicationEvents)
    .values({ applicationId: row.id, kind: "stage", data: { from: row.stage, to } });
  revalidatePath("/tracker");
}

/** "+ Add alert": the user's own reminder, with no date. */
export async function addAlert(action: string) {
  const user = await requireUser();
  await getDb()
    .insert(alerts)
    .values({ userId: user.id, action: z.string().trim().min(1).max(500).parse(action) });
  revalidatePath("/tracker");
}

export async function completeAlert(id: string) {
  const user = await requireUser();
  await getDb()
    .update(alerts)
    .set({ doneAt: new Date() })
    .where(and(eq(alerts.id, Id.parse(id)), eq(alerts.userId, user.id)));
  revalidatePath("/tracker");
}
