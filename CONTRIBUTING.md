# Contributing

Thanks for helping. Setup is in the [README](README.md).

## Before you start

- Read [`docs/architecture.md`](docs/architecture.md) and the doc for the area you're touching. Decisions and their reasons are in [`docs/decisions.md`](docs/decisions.md). To change one, add a new entry rather than editing the old one.
- UI, copy and flows are ported from [`prototype/`](prototype/). Match it, and keep copy word for word unless a change has been agreed in an issue. Don't edit `prototype/`.
- For anything bigger than a small fix, open an issue first.

## Rules the code has to follow

- TypeScript strict. No `any` without a comment explaining why.
- Styling uses the design tokens only (`packages/ui`). No hard-coded colours or sizes. Visual and copy rules: `prototype/design-system/DESIGN.md`.
- Accessible by default: keyboard access, visible focus, aria on tabs, menus and accordions, and respect for `prefers-reduced-motion`.
- API keys stay on the server. Nothing secret goes into a `NEXT_PUBLIC_*` variable.
- Never send an email or apply to a job without the user's explicit approval.
- Don't add restricted Google OAuth scopes (see [`docs/email-and-google.md`](docs/email-and-google.md)).

## Workflow

1. Branch from `main`.
2. Schema change: edit `packages/db/src/schema.ts`, run `pnpm db:generate`, and commit the migration with the change. Update `docs/data-model.md` too.
3. Before pushing, run `pnpm format && pnpm lint && pnpm typecheck && pnpm test && pnpm build`. CI runs the same checks, and also runs migrations and the seed against a fresh Postgres.
4. Open a pull request that says what changed and why. Include screenshots for UI changes.

## Scraper (Python)

```sh
cd apps/scraper
uv sync
uv run ruff check . && uv run ruff format .
uv run pytest
```
