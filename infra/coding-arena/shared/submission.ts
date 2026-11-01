/** Fields of a submission row that may leave the backend (never test data). */
export const PUBLIC_FIELDS = [
  "submissionId",
  "slug",
  "language",
  "status",
  "verdict",
  "tests",
  "passed",
  "totalTests",
  "failedTest",
  "maxTimeMs",
  "maxMemKb",
  "compileOutput",
  "message",
  "kind",
  "createdAt",
  "finishedAt",
] as const;

export function publicSubmission(item: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    PUBLIC_FIELDS.filter((k) => item[k] !== undefined).map((k) => [k, item[k]]),
  );
}
