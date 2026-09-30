"use client";
import {
  createElement,
  createContext,
  useContext,
  type AnchorHTMLAttributes,
  type ComponentType,
  type ReactNode,
} from "react";

export type LinkComponent = ComponentType<
  AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }
>;

const LinkContext = createContext<LinkComponent | null>(null);

/**
 * Lets components render the app's router link (e.g. next/link) for internal hrefs without
 * @ge/ui depending on Next.js. Wrap the app once: <LinkProvider component={Link}>.
 */
export function LinkProvider({
  component,
  children,
}: {
  component: LinkComponent;
  children: ReactNode;
}) {
  return <LinkContext.Provider value={component}>{children}</LinkContext.Provider>;
}

/** Renders the provided router link for internal paths and a plain <a> otherwise. */
export function UiLink(props: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  const Provided = useContext(LinkContext);
  const external = /^[a-z]+:/i.test(props.href) || props.href.startsWith("#");
  // createElement: the link component comes from context, not from this render.
  if (Provided && !external) return createElement(Provided, props);
  return <a {...props} />;
}
