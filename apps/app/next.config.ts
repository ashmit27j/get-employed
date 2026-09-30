import { join } from "node:path";
import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";

// One .env at the repo root serves every app.
loadEnvConfig(join(process.cwd(), "../.."));

const config: NextConfig = {
  transpilePackages: ["@ge/ui", "@ge/core", "@ge/db"],
  // The Next.js dev badge covered the sidebar's account button and the mobile tab bar.
  devIndicators: false,
  // Pricing is a section of the home page now; keep old links working.
  async redirects() {
    return [{ source: "/pricing", destination: "/#pricing", permanent: true }];
  },
};

export default config;
