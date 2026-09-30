import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteFooter, SiteHeader } from "@/components/site/SiteChrome";

export const metadata: Metadata = {
  title: {
    default: "GetEmployed · The job search, run like a product",
    template: "%s · GetEmployed",
  },
  robots: { index: true, follow: true },
};

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div data-site>
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}
