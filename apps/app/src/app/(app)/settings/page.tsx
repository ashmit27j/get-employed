import { redirect } from "next/navigation";

/** Settings live in a dialog now (#settings/<section>); old links land on the job board with it open. */
export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  redirect(`/jobs#settings/${tab && /^[a-z]+$/.test(tab) ? tab : "general"}`);
}
