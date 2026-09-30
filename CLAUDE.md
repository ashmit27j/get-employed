# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Status

Phases 1–5 are done: every screen is ported and runs on seed data with rule-based logic. Phase 6 (backend wiring: LLM, ingestion, sending, TTS) is next. The phases are in `docs/roadmap.md`, and each one starts only after the owner says to.

## Commands

pnpm + Turborepo; Node 22.12+. One `.env` at the repo root (copied from `.env.example`) serves every app. Next.js loads it through `loadEnvConfig` in `next.config.ts`, and scripts load it through `loadRootEnv()` from `@ge/db/load-env`.

```sh
docker compose up -d                 # Postgres :5432, S3 storage (SeaweedFS) :8333
pnpm db:migrate && pnpm db:seed      # schema + demo data from prototype/ge-data.js (seed user id "seed-user")
pnpm dev                             # site + app :4000, worker, scraper :8000 (needs uv)
pnpm lint | typecheck | test | build | format
pnpm --filter @ge/db exec vitest run src/seed-data.test.ts    # one test file
cd apps/scraper && uv run pytest -k health                    # one Python test
```

- **Schema changes:** edit `packages/db/src/schema.ts` (camelCase in TS, snake_case in SQL through `casing: "snake_case"`), run `pnpm db:generate`, commit `packages/db/drizzle/`, and update `docs/data-model.md`. CI fails if the migrations are out of date.
- **Internal packages:** `@ge/core`, `@ge/db` and `@ge/ui` are consumed as TypeScript source with no build step. Next.js lists them in `transpilePackages`, and the worker runs through `tsx`.
- **New queue:** add it to `QUEUES` in `packages/core/src/domain.ts`. The `Record<QueueName, Handler>` in `apps/worker/src/handlers.ts` then fails to compile until the queue has a handler.
- **ESLint** is pinned to 9 because `eslint-config-next`'s plugins don't support 10 yet.

## What GetEmployed is

A job-search copilot for students and early-career engineers in India (salaries in ₹ LPA, campus and PPO roles). The core loop: plain-English search parsed into filter chips → a 0–100 match score with a reason and missing skills → per-job resume tailoring shown as diffs with an ATS score change → finding the hiring manager and drafting a cold email that is **sent only after the user approves it** → an application tracker (Saved → Applied → Interview → Offer/Rejected) → AI mock interviews. An Assistant can run each of these as a tool call. The project must work both in the cloud (Vercel) and on a user's own machine (`SELF_HOSTED=true`, bring your own keys).

## One site, two kinds of page

`apps/app` serves everything on one URL and port (D21). Cloud and self-hosted look identical; `SELF_HOSTED` may change only processing (keys, default caps), never what the UI shows or hides (D22). Per-user differences come from the user's settings.

- **Marketing pages** (`src/app/(marketing)`, `src/components/site`): static, SEO, expressive motion. They import only `packages/ui`, `src/lib/site.ts` and the brand assets. No auth and no data fetching.
- **Product pages** (the other route groups): signed-in, `noindex`, API-backed, quiet motion (120–180ms state transitions). App shell: 232px sidebar, 56px top bar, optional Assistant dock on the right; on mobile a bottom tab bar and a drawer.
- **Background work** (`apps/worker`, pg-boss) and **LinkedIn scraping** (`apps/scraper`, Python + Scrapling) can't run on Vercel.

Architecture, data model and routes: `docs/architecture.md`, `docs/data-model.md`, `docs/routes.md`. The reasons behind choices are in `docs/decisions.md`. Read the matching doc before changing anything in these areas: `docs/job-ingestion.md`, `docs/interviews.md`, `docs/email-and-google.md`.

## `prototype/` is the spec, not code

The UI, copy, flows and states are ported from `prototype/`, and copy stays word for word unless the owner approves a change. **Don't edit `prototype/`**, and never bring its runtime (`support.js`, `.dc.html`, `<x-import>`, `{{ }}`, `window.GEApp`/`GEData`) into the apps.

- **Reading a `.dc.html` file:** the markup is inside `<x-dc>`, and the page logic is in `<script data-dc-script>` (`class Component extends DCLogic`, with `renderVals()` providing the values the template uses).
- **Where to look:**
  - `ge-app.js`: the component spec. `Components.dc.html` is its live catalogue.
  - `ge-data.js`: the data shapes and seed data.
  - `marketing/`: the website.
  - `Mobile Preview.dc.html`: mobile behaviour.
- **Marketing review toggles:** in `marketing/changes.js` every C01–C12 edit is approved. Build as if all of them are on, and drop the `ge("Cxx")` checks and the v1 fallbacks.

## Design rules (full spec: `docs/design-system.md`)

- Both apps use `@ge/ui`. `packages/ui/src/theme.css` is the only token source: a Tailwind v4 theme with every default removed, so only token utilities exist (`bg-surface-1`, `text-ink-subtle`, `text-small`, `rounded-lg`, `shadow-edge`). Never add raw colours or pixel font sizes; `design-rules.test.ts` fails on them. When porting prototype code, map v1 names with `prototype/design-system/CHANGES.md`/`compat.css` (`--type-body-sm` → `text-small`, `--color-semantic-success` → `success`). `compat.css` is never shipped.
- **Check components in the catalogue** at `/dev/components` (`pnpm --filter @ge/app dev`). Icons are Lucide by kebab-case name, registered in `packages/ui/src/icons.ts`; add names there.
- **Utility conflicts:** when a state class overrides a colour already set in the base classes (e.g. `border-hairline` vs `border-hairline-strong`), mark the override `!` (`border-hairline-strong!`) or keep the base colour out of the shared classes. Tailwind doesn't order same-property utilities by the order you write them.
- Dark by default plus a light theme (`[data-theme="light"]` in `theme.css`, same token names; never branch on the theme in components). Canvas `#07090D` and surfaces 1–4. Depth comes from surface steps, 1px hairlines and a 7% top-edge highlight; no drop shadows.
- One accent, blue `#7B9BDB`, used only for the CTA, focus, active state and key data. One glow per viewport.
- Inter for text and JetBrains Mono for numbers, IDs and salaries. Radii: 8 for buttons and inputs, 12 for cards, 16 for panels, full for pills. 4px spacing base. Lucide icons.
- Copy is second person and sentence case, with no emoji and no exclamation marks. Unicode is limited to `→` and `·`.
- Accessibility: keyboard use, focus-visible, aria on tabs, menus and accordions, and `prefers-reduced-motion`.

## Hard rules

- TypeScript strict. LLM, TTS and third-party keys are used only on the server.
- Never send an email or apply to a job without explicit user approval (`emails.approved_at`, enforced by the database).
- No restricted Google OAuth scopes. Only `openid email profile` and `gmail.send` (see `docs/email-and-google.md`).
- Billing and plan limits are **not** built yet. Don't enforce plan limits. Cost guards such as the interview session cap and the TTS character tiers are separate and are built.
