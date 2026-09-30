/** Joins class names, skipping falsy values. */
export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

/** State-transition timing used by every interactive surface (DESIGN.md: 120–180ms, ease-standard). */
export const transition = "duration-(--duration-base) ease-standard";
