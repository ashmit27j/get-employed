import type { ReactNode } from "react";
import Link from "next/link";
import { Wordmark } from "@ge/ui";

/** Header and footer around the sign-in, sign-up and reset screens. */
export function AuthChrome({
  children,
  back = { label: "Back to site", href: "/" },
}: {
  children: ReactNode;
  back?: { label: string; href: string };
}) {
  const external = back.href.startsWith("http");
  return (
    <div className="relative flex min-h-screen flex-col bg-canvas text-ink">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-1/2 w-[min(1264px,calc(100%-32px))] -translate-x-1/2 border-x border-hairline"
      />
      <header className="flex h-20 flex-none justify-center border-b border-hairline">
        <div className="box-border flex w-[min(1264px,calc(100%-32px))] items-center justify-between gap-4 px-8 max-md:px-4">
          <Link
            href="/"
            className="inline-flex text-inherit hover:text-inherit"
            aria-label="GetEmployed website"
          >
            <Wordmark size={16} />
          </Link>
          {external ? (
            <a href={back.href} className="text-small text-ink-subtle hover:text-ink">
              {back.label}
            </a>
          ) : (
            <Link href={back.href} className="text-small text-ink-subtle hover:text-ink">
              {back.label}
            </Link>
          )}
        </div>
      </header>
      {children}
      <footer className="flex h-[72px] flex-none justify-center border-t border-hairline">
        <div className="box-border flex w-[min(1264px,calc(100%-32px))] items-center justify-between gap-4 px-8 text-caption text-ink-tertiary max-md:px-4">
          <span>© 2026 GetEmployed</span>
          <div className="flex gap-4">
            <a href="/terms" className="text-ink-tertiary hover:text-ink">
              Terms
            </a>
            <a href="/privacy" className="text-ink-tertiary hover:text-ink">
              Privacy
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

/** Large page title used on auth and reset screens (48px display size from the prototype). */
export function AuthTitle({ title, sub }: { title: string; sub?: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="m-0 text-section-sm leading-[1.02] font-semibold">{title}</h1>
      {sub && <p className="m-0 text-body text-pretty text-ink-subtle">{sub}</p>}
    </div>
  );
}

export function OrDivider() {
  return (
    <div className="flex items-center gap-3 text-caption text-ink-tertiary">
      <span className="h-px flex-1 bg-hairline" />
      <span>or</span>
      <span className="h-px flex-1 bg-hairline" />
    </div>
  );
}

export function GoogleMark() {
  // Google's brand "G" (colours are part of the mark, not theme tokens).
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}
