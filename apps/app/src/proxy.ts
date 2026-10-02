import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const PUBLIC = ["/signin", "/signup", "/reset", "/api/auth", "/api/health", "/t/", "/dev/"];
/** The marketing pages and their metadata routes. */
const SITE = new Set([
  "/",
  "/privacy",
  "/terms",
  "/opengraph-image",
  "/sitemap.xml",
  "/robots.txt",
]);

/**
 * Optimistic auth check: no session cookie → /signin. The real check (and the onboarding
 * redirect) happens server-side in each layout through requireUser / requireOnboardedUser.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (SITE.has(pathname) || PUBLIC.some((p) => pathname.startsWith(p))) return NextResponse.next();
  if (!getSessionCookie(request)) {
    const url = new URL("/signin", request.url);
    url.searchParams.set("next", pathname + request.nextUrl.search);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/|favicon|ge-mark.png|ge-wordmark.png|.*\.(?:png|svg|jpg|ico|webp)$).*)"],
};
