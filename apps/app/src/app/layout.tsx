import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { SITE_URL } from "@/lib/site";
import { THEME_SCRIPT } from "@/lib/theme";
import { inter, jetbrainsMono } from "./fonts";
import { Providers } from "./providers";
import "./globals.css";

const description =
  "Search in plain English, get a tailored resume and an outreach email for every match, and practise the interview before it happens.";

// Signed-in pages stay out of search results; (marketing)/layout.tsx opts the public pages back in.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "GetEmployed", template: "%s · GetEmployed" },
  description,
  applicationName: "GetEmployed",
  openGraph: {
    type: "website",
    siteName: "GetEmployed",
    title: "GetEmployed",
    description,
    url: "/",
  },
  twitter: { card: "summary_large_image", title: "GetEmployed", description },
  icons: { icon: "/ge-mark.png" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { colorScheme: "dark light" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      data-theme="dark"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
