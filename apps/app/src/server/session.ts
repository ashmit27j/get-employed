import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth, type SessionUser } from "./auth";

/** The current session, memoised per request. */
export const getSession = cache(async () => auth().api.getSession({ headers: await headers() }));

/** Signed-in user or redirect to /signin. */
export async function requireUser(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) redirect("/signin");
  return session.user;
}

/**
 * Signed-in user whose Job Profile is complete enough to use the app. New accounts start with
 * `onboardingStep` set; saving the profile at 30% or more clears it (actions/profile.ts).
 */
export async function requireOnboardedUser(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.onboardingStep != null) redirect("/profile");
  return user;
}
