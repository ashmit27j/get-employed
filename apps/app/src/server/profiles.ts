import "server-only";
import { and, eq } from "drizzle-orm";
import type { GithubSnapshot, LinkedinSnapshot, LinkedinSuggestion } from "@ge/core";
import { schema } from "@ge/db";
import { getDb } from "./db";

const { linkedProfiles } = schema;

export interface LinkedinData {
  /** File name of the uploaded export, when there is one. */
  source: string | null;
  snapshot: LinkedinSnapshot | null;
  suggestions: LinkedinSuggestion[];
  /** Why the last import failed, for the page to show. */
  error: string | null;
}

export interface GithubData {
  login: string | null;
  snapshot: GithubSnapshot | null;
  error: string | null;
}

async function row(userId: string, kind: "linkedin" | "github") {
  const [r] = await getDb()
    .select()
    .from(linkedProfiles)
    .where(and(eq(linkedProfiles.userId, userId), eq(linkedProfiles.kind, kind)));
  return r;
}

export async function loadLinkedin(userId: string): Promise<LinkedinData> {
  const r = await row(userId, "linkedin");
  return {
    source: r?.source ?? null,
    snapshot: (r?.snapshot as LinkedinSnapshot | null) ?? null,
    suggestions: r?.suggestions ?? [],
    error: r?.error ?? null,
  };
}

export async function loadGithub(userId: string): Promise<GithubData> {
  const r = await row(userId, "github");
  return {
    login: r?.source ?? null,
    snapshot: (r?.snapshot as GithubSnapshot | null) ?? null,
    error: r?.error ?? null,
  };
}
