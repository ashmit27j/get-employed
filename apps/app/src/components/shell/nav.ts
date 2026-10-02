import type { IconName } from "@ge/ui";

/** Sidebar sections, from NAV in prototype/ge-app.js. `id` is what pages pass as `active`. */
export type NavId =
  | "jobs"
  | "tracker"
  | "outbox"
  | "resume"
  | "interview"
  | "assistant"
  | "linkedin"
  | "github"
  | "jobprofile";

export interface NavEntry {
  id: NavId;
  label: string;
  icon: IconName | `img:${string}`;
  href: string;
  /** Show the mailbox draft count. */
  badge?: "drafts";
}

export const NAV: { group: string; items: NavEntry[] }[] = [
  {
    group: "Workspace",
    items: [
      { id: "jobs", label: "Job board", icon: "briefcase", href: "/jobs" },
      { id: "tracker", label: "Application Tracker", icon: "square-kanban", href: "/tracker" },
      { id: "outbox", label: "Mailbox", icon: "mail", href: "/mailbox", badge: "drafts" },
      { id: "resume", label: "Documents", icon: "file-text", href: "/documents" },
      { id: "interview", label: "Interview prep", icon: "graduation-cap", href: "/interview" },
    ],
  },
  {
    group: "Profiles",
    items: [
      { id: "linkedin", label: "LinkedIn", icon: "img:/linkedin.svg", href: "/profiles/linkedin" },
      { id: "github", label: "GitHub", icon: "img:/github.png", href: "/profiles/github" },
      { id: "jobprofile", label: "Job Profile", icon: "briefcase", href: "/profile" },
    ],
  },
];

/** Mobile bottom bar; everything else lives in the "More" drawer. */
export const MOBILE_TABS: { id: NavId; label: string; icon: IconName; href: string }[] = [
  { id: "tracker", label: "Tracker", icon: "square-kanban", href: "/tracker" },
  { id: "jobs", label: "Jobs", icon: "briefcase", href: "/jobs" },
  { id: "resume", label: "Documents", icon: "file-text", href: "/documents" },
  { id: "assistant", label: "Assistant", icon: "sparkles", href: "/assistant" },
];

/** Account menu entries; the #settings hashes open the settings dialog over the current page. */
export const ACCOUNT_MENU: { icon: IconName; label: string; href: string; kbd?: string }[] = [
  { icon: "settings", label: "Settings", href: "#settings/general", kbd: "Ctrl+," },
  { icon: "user-round", label: "Account", href: "#settings/account" },
  { icon: "gauge", label: "Plan & usage", href: "#settings/billing" },
  { icon: "circle-help", label: "Get help", href: "#settings/feedback" },
];

/** Colours for chat groups (prototype GROUP_COLORS), indexed by chat_groups.color_index. */
export const GROUP_COLORS = [
  "var(--color-danger-ink)",
  "var(--color-warning-ink)",
  "var(--color-success-ink)",
  "var(--color-teal-ink)",
  "var(--color-primary)",
  "var(--color-violet-ink)",
];
