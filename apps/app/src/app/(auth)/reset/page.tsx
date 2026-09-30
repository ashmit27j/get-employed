import type { Metadata } from "next";
import { ResetFlow } from "@/components/auth/ResetFlow";

export const metadata: Metadata = { title: "Reset password" };

export default async function ResetPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;
  return <ResetFlow initialEmail={email && /\S+@\S+\.\S+/.test(email) ? email : undefined} />;
}
