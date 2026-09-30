"use server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  JobDetailsSchema,
  ProfileSchema,
  UNLOCK_PCT,
  contactLinks,
  hasSkill,
  profileCompletion,
  type JobDetails,
  type Profile,
} from "@ge/core";
import { schema } from "@ge/db";
import { getDb } from "../db";
import { loadProfile, saveJobDetails, saveProfile } from "../profile";
import { requireUser } from "../session";

/**
 * Save the Job Profile. Its links become the resume header's links, and its roles and locations
 * are stored on the user (the matcher reads those).
 */
export async function saveJobProfile(input: {
  doc: Profile;
  details: JobDetails;
}): Promise<{ pct: number; unlocked: boolean }> {
  const user = await requireUser();
  const details = JobDetailsSchema.parse(input.details);
  const doc = ProfileSchema.parse(input.doc);
  await saveProfile(user.id, {
    ...doc,
    contact: { ...doc.contact, links: contactLinks(details.links) },
  });
  await saveJobDetails(user.id, details);
  const locations = details.locations
    .split(",")
    .map((l) => l.trim())
    .filter(Boolean);
  await getDb()
    .update(schema.users)
    .set({
      name: z.string().trim().min(1).max(120).parse(doc.contact.name),
      targetRole: details.roles.trim() || null,
      preferredLocations: [...locations, ...(details.relocate ? ["Open to relocate"] : [])],
    })
    .where(eq(schema.users.id, user.id));
  // A new account unlocks the app once its profile is 30% complete (session.ts).
  const { pct } = profileCompletion(doc, details);
  const unlocked = user.onboardingStep != null && pct >= UNLOCK_PCT;
  if (unlocked) {
    await getDb()
      .update(schema.users)
      .set({ onboardingStep: null })
      .where(eq(schema.users.id, user.id));
    revalidatePath("/", "layout");
  }
  return { pct, unlocked };
}

/** "I have this" on a missing skill: adds it to the profile's Tools group (or the last group). */
export async function addProfileSkill(skill: string) {
  const user = await requireUser();
  const name = z.string().trim().min(1).max(60).parse(skill);
  const { doc } = await loadProfile(user.id);
  if (hasSkill(doc, name)) return;
  const tools = doc.skills.findIndex((g) => /tools/i.test(g.name));
  const i = tools === -1 ? doc.skills.length - 1 : tools;
  const skills =
    i === -1
      ? [{ name: "Skills", items: [name] }]
      : doc.skills.map((g, j) => (j === i ? { ...g, items: [...g.items, name] } : g));
  await saveProfile(user.id, { ...doc, skills });
  revalidatePath("/", "layout");
}
