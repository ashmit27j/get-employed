---
name: expert-review
description: Senior-engineer code review for GetEmployed that checks correctness, security, data integrity, accessibility and this repo's own rules. Use when asked to review a diff, a branch, a PR or a file ("review this", "is this safe to merge", "check my changes").
---

# Expert code review (GetEmployed)

Review like a staff engineer who owns production. Find what would break, leak or mislead users. Skip style nits the linters and Prettier already catch.

## 1. Scope the change

- `git status`, `git diff` (staged and unstaged), or `git diff main...HEAD` for a branch; `gh pr diff <n>` for a PR.
- Read every changed file **in full**, plus the callers and callees of changed functions. Don't review from the diff alone.
- Read the matching doc before judging a design choice: `docs/architecture.md`, `docs/data-model.md`, `docs/routes.md`, `docs/decisions.md` (why things are the way they are), `docs/email-and-google.md`, `docs/interviews.md`, `docs/job-ingestion.md`, `docs/design-system.md`.

## 2. Hard rules (any violation is a blocker)

- **No email is sent and no job applied to without approval.** Any path to `status = sent` must go through `emails.approved_at`; `email.send` re-checks status. Look for new send paths, retries or bulk actions that skip it.
- **Only `openid email profile` and `gmail.send` Google scopes.** Anything reading mail (`gmail.readonly`, `modify`, `metadata`) is out.
- **Keys stay on the server.** LLM, TTS and third-party keys never reach a client component, a `NEXT_PUBLIC_*` variable, a server action's return value or a log line. User LLM keys go through `llmKeyFor()` and are stored sealed.
- **Cloud and self-hosted look identical** (D22). `SELF_HOSTED` may change processing (keys, default caps), never what the UI shows.
- **No plan limits** until billing exists (D15). Cost guards (interview cap, TTS tiers) are fine.
- **Design tokens only.** No raw colours or pixel font sizes in `packages/ui` (the test fails) and none in the app either; use token utilities. Copy: second person, sentence case, no emoji, no exclamation marks, Unicode limited to `→` and `·`.

## 3. Correctness checklist

- **Auth on every server entry point.** Each server action and route handler calls `requireUser()` / `getSession()` and scopes every query by `userId`. An id from the client (thread, email, job, application) must be checked against the user before reading or writing it. This is the most common bug class here.
- **Input validation at the boundary.** Server actions and route handlers parse input with zod; no trusting shapes from the client. Uploads check type and size.
- **Onboarding gate.** New pages under `(app)` call `requireOnboardedUser()`; only `/profile` may use `requireUser()`.
- **Database.** Schema changes come with a generated migration in `packages/db/drizzle/` and a `docs/data-model.md` update. Multi-step writes that must stay consistent use a transaction. Watch for N+1 queries in loaders and missing indexes on new filter columns.
- **Queue jobs** (`pg-boss`) are idempotent: keyed with `singletonKey`, safe to retry, and they re-check state before side effects. New queues are added to `QUEUES` with a handler.
- **Next.js App Router.** No `revalidatePath` during render. Client components don't import `server-only` modules. `searchParams`/`params` are awaited. Hash links (`#settings/...`) render as plain anchors.
- **React.** No setState synchronously inside effects (the compiler lint flags it); effects clean up listeners, timers and media streams; stable keys on lists; no stale closures in async handlers.
- **Errors.** User-facing failures show a clear message and never a stack trace; server errors are logged with context, without personal data.

## 4. Security checklist

- XSS: no `dangerouslySetInnerHTML` with user content (the theme script is the only allowed use).
- Open redirects: `next=` and `callbackURL` values are relative paths only.
- SSRF: user-supplied URLs (LinkedIn, GitHub, SMTP host) are validated and fetched only by the worker or scraper, with timeouts.
- Secrets at rest use `@ge/core/secret-box`; never log decrypted values.
- File storage keys are namespaced `users/<id>/...`; downloads check ownership.
- Rate-sensitive endpoints (auth, uploads, assistant, TTS) aren't callable in a tight loop without a cap.

## 5. Accessibility and UX

- Keyboard reachable, visible focus, labelled inputs, `aria` on tabs, menus, dialogs and live regions; dialogs trap focus and close on Escape (only the top one).
- Works at 390px wide and in both themes (`data-theme="light"`).
- Loading, empty and error states exist for anything that fetches.

## 6. Tests

- Logic in `packages/core` has Vitest coverage; UI flows touched have a Playwright spec in `apps/app/e2e` (desktop, plus `@mobile` where layout changes).
- Run what's relevant: `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm --filter @ge/app test:e2e` when Docker is up. Say which you ran and which you couldn't.

## Output

1. **Verdict** in one line: ship, ship after fixes, or don't ship.
2. **Findings**, most severe first. For each: file:line, what breaks and for whom (a concrete scenario), and the fix. Severity: Blocker, Major, Minor.
3. **What's good**, briefly, so it isn't undone.

Only report issues you've verified in the code. Mark anything unconfirmed as a question, not a finding.
