"use client";
import { BrandWordmark, Footer, ScrollProgress, TopNav } from "@ge/ui";
import { FOOTER, NAV, REPO_URL, SIGN_IN_URL, SIGN_UP_URL } from "@/lib/site";
import { GridFrame } from "./Frame";

export function SiteHeader() {
  return (
    <>
      <ScrollProgress />
      <TopNav links={NAV} signInHref={SIGN_IN_URL} ctaHref={SIGN_UP_URL} />
    </>
  );
}

export function SiteFooter() {
  return (
    <GridFrame>
      <Footer
        columns={FOOTER}
        githubUrl={REPO_URL}
        logo={<BrandWordmark height={44} className="self-start" />}
      />
    </GridFrame>
  );
}
