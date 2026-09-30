import type { ReactNode } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { ShellProvider } from "@/components/shell/ShellProvider";
import { requireUser } from "@/server/session";
import { loadShellData } from "@/server/shell";

export default async function AppLayout({ children }: { children: ReactNode }) {
  // Pages check onboarding themselves; /profile stays reachable while the app is locked.
  const user = await requireUser();
  const data = await loadShellData(user);
  return (
    <ShellProvider>
      <AppShell data={data}>{children}</AppShell>
    </ShellProvider>
  );
}
