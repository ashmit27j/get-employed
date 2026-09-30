/**
 * Loads the repo-root .env into the server runtime. next.config.ts loads it too, but only for the
 * build/config process (NEXT_PUBLIC_* inlining); request handlers run in workers that need their own copy.
 * Existing variables win, so hosted environments (Vercel) are unaffected. The Node-only code lives in
 * its own module so the Edge build never sees it.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") await import("./instrumentation-node");
}
