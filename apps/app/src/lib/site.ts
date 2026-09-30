import type { FooterColumn, NavLink } from "@ge/ui";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:4000";
export const REPO_URL = "https://github.com/ashmit27j/get-employed";

export const SIGN_IN_URL = "/signin";
export const SIGN_UP_URL = "/signup";

export const NAV: NavLink[] = [
  { label: "How it works", href: "/#how" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Self-host", href: "/#selfhost" },
];

export const FOOTER: FooterColumn[] = [
  {
    title: "Product",
    links: [
      { label: "Job search", href: "/#how" },
      { label: "Resume tailor", href: "/#how" },
      { label: "Outbox", href: "/#how" },
      { label: "Tracker", href: "/#how" },
      { label: "Mock interviews", href: "/#how" },
      { label: "Pricing", href: "/#pricing" },
    ],
  },
  {
    title: "Open source",
    links: [
      { label: "GitHub", href: REPO_URL },
      { label: "Self-host guide", href: "/#selfhost" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: REPO_URL },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
];
