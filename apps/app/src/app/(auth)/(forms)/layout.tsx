import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { googleEnabled } from "@/server/env";
import { getSession } from "@/server/session";

/** Sign in and sign up share one screen so switching tabs keeps what you typed and cross-fades. */
export default async function AuthFormsLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (session) redirect(session.user.onboardingStep != null ? "/profile" : "/jobs");
  return (
    <>
      <AuthScreen googleEnabled={googleEnabled()} />
      {children}
    </>
  );
}
