/** Colour a 0–100 score: green at 80+, amber at 60+, red below (MatchRing, ConfidenceMeter). */
export function scoreTone(value: number): "success" | "warning" | "danger" {
  return value >= 80 ? "success" : value >= 60 ? "warning" : "danger";
}

export const scoreToneVar = {
  success: "var(--color-success-ink)",
  warning: "var(--color-warning-ink)",
  danger: "var(--color-danger-ink)",
} as const;

/** Bar fill for a 0–100 value: primary at 80+, muted at 60+, tertiary below (ScoreBar, MetricReadout). */
export function barToneClass(value: number): string {
  return value >= 80 ? "bg-primary" : value >= 60 ? "bg-ink-muted" : "bg-ink-tertiary";
}

export function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0] ?? "")
    .join("")
    .slice(0, 2);
}
