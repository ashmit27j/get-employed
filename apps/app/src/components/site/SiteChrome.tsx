"use client";
import { BrandWordmark, Footer, IconButton, ScrollProgress, TopNav } from "@ge/ui";
import { FOOTER, NAV, REPO_URL, SIGN_IN_URL } from "@/lib/site";
import { useTheme } from "@/lib/theme";
import { GridFrame } from "./Frame";

function ThemeToggle() {
  const [theme, setTheme] = useTheme();
  // "System" shows the toggle for whichever theme is on screen now.
  const dark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      !window.matchMedia("(prefers-color-scheme: light)").matches);
  return (
    <IconButton
      icon={dark ? "sun" : "moon"}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme(dark ? "light" : "dark")}
    />
  );
}

export function SiteHeader() {
  return (
    <>
      <ScrollProgress />
      <TopNav links={NAV} signInHref={SIGN_IN_URL} actions={<ThemeToggle />} />
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
