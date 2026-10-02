import { PageLoading } from "@/components/shell/PageLoading";

/** The shell stays put; only the page area waits (and Link can prefetch up to here). */
export default function Loading() {
  return <PageLoading />;
}
