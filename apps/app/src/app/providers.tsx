"use client";
import NextLink from "next/link";
import type { ReactNode } from "react";
import { LinkProvider, type LinkComponent } from "@ge/ui";

// Hash-only links (#settings/…) stay plain anchors so the browser fires "hashchange".
const AppLink: LinkComponent = (props) =>
  props.href.startsWith("#") ? <a {...props} /> : <NextLink {...props} />;

/** Client-side context for @ge/ui: internal links go through next/link. */
export function Providers({ children }: { children: ReactNode }) {
  return <LinkProvider component={AppLink}>{children}</LinkProvider>;
}
