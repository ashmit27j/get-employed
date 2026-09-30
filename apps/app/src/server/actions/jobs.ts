"use server";
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { schema } from "@ge/db";
import { getDb } from "../db";
import { requireUser } from "../session";

const Id = z.string().uuid();
const { jobs, companies, applications, hiddenJobs, applicationEvents } = schema;

/**
 * Save a job to the tracker (a "Saved" application) or unsave it. Unsaving only removes it while
 * it is still in Saved; once applied, the tracker owns it.
 */
export async function toggleSaveJob(jobId: string): Promise<{ saved: boolean }> {
  const user = await requireUser();
  const id = Id.parse(jobId);
  const db = getDb();
  const [existing] = await db
    .select({ id: applications.id, stage: applications.stage })
    .from(applications)
    .where(and(eq(applications.userId, user.id), eq(applications.jobId, id)));
  if (existing) {
    if (existing.stage !== "saved") return { saved: true };
    await db.delete(applications).where(eq(applications.id, existing.id));
    revalidatePath("/", "layout");
    return { saved: false };
  }
  const [job] = await db
    .select({ title: jobs.title, company: companies.name })
    .from(jobs)
    .innerJoin(companies, eq(companies.id, jobs.companyId))
    .where(eq(jobs.id, id));
  if (!job) throw new Error("Job not found");
  const [app] = await db
    .insert(applications)
    .values({
      userId: user.id,
      jobId: id,
      title: job.title,
      company: job.company,
      stage: "saved",
      note: "Saved just now",
    })
    .returning({ id: applications.id });
  await db
    .insert(applicationEvents)
    .values({ applicationId: app!.id, kind: "stage", data: { to: "saved" } });
  revalidatePath("/", "layout");
  return { saved: true };
}

export async function setJobHidden(jobId: string, hidden: boolean) {
  const user = await requireUser();
  const id = Id.parse(jobId);
  const db = getDb();
  if (hidden)
    await db.insert(hiddenJobs).values({ userId: user.id, jobId: id }).onConflictDoNothing();
  else
    await db
      .delete(hiddenJobs)
      .where(and(eq(hiddenJobs.userId, user.id), eq(hiddenJobs.jobId, id)));
}

export async function unhideAllJobs(jobIds?: string[]) {
  const user = await requireUser();
  const where = jobIds?.length
    ? and(eq(hiddenJobs.userId, user.id), inArray(hiddenJobs.jobId, z.array(Id).parse(jobIds)))
    : eq(hiddenJobs.userId, user.id);
  await getDb().delete(hiddenJobs).where(where);
}
