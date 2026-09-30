# GetEmployed

A job-search copilot for students and early-career engineers. Search in plain English, see how well each role matches you, tailor your resume per job, reach the hiring manager with an email you approve, track every application, and practise with AI mock interviews.

> **Status:** early development. The marketing pages and every app screen are ported from the design prototype in [`prototype/`](prototype/) and run on seed data; wiring the LLM, job sources and sending is next. See [`docs/roadmap.md`](docs/roadmap.md).

## One site

`apps/app` serves the public pages (home with pricing, privacy, terms) and the signed-in app from one Next.js app on one URL. The cloud and a self-hosted copy look the same; `SELF_HOSTED` only changes how work runs (whose API keys, whether cost caps apply by default).

Background work runs in `apps/worker` (a pg-boss queue on Postgres), and LinkedIn scraping runs in `apps/scraper` (Python, [Scrapling](https://github.com/D4Vinci/Scrapling)). More in [`docs/architecture.md`](docs/architecture.md).

```
apps/app          the site, the app + API  (Next.js)
apps/worker       queue consumers + cron   (Node, pg-boss)
apps/scraper      internal scraping API    (Python, FastAPI + Scrapling)
packages/ui       design tokens + components
packages/core     zod schemas, shared types, domain logic
packages/db       Drizzle schema, migrations, seed
packages/config   shared tsconfig and ESLint config
prototype/        design prototype: the spec for UI and copy (read-only)
docs/             architecture, data model, routes, decisions, roadmap
```

## Prerequisites

- Node.js 22.12+ (see `.nvmrc`) and pnpm 10 (`corepack enable`)
- Docker (for Postgres and SeaweedFS)
- [uv](https://docs.astral.sh/uv/) and Python 3.10+, only if you work on `apps/scraper`

## Local setup

```sh
pnpm install
cp .env.example .env          # defaults work for local development
docker compose up -d          # Postgres on :5432, S3-compatible storage (SeaweedFS) on :8333
pnpm db:migrate               # apply migrations
pnpm db:seed                  # demo user + the prototype's mock data
pnpm dev                      # site and app on :4000, worker, scraper on :8000
```

`pnpm dev` also starts the scraper, which needs uv. To skip it, run `pnpm turbo run dev --filter=!@ge/scraper`.

Check the app can reach the database: <http://localhost:4000/api/health>.

## Scripts

| Command                                      | What it does                                                  |
| -------------------------------------------- | ------------------------------------------------------------- |
| `pnpm dev`                                   | Run every app in watch mode                                   |
| `pnpm build`                                 | Build every app                                               |
| `pnpm lint` / `pnpm typecheck` / `pnpm test` | Across all packages (scraper uses Ruff and pytest through uv) |
| `pnpm format` / `pnpm format:check`          | Prettier                                                      |
| `pnpm db:generate`                           | Create a migration after editing `packages/db/src/schema.ts`  |
| `pnpm db:migrate`                            | Apply migrations                                              |
| `pnpm db:seed`                               | Reset and load the demo data (safe to re-run)                 |
| `pnpm db:studio`                             | Browse the database                                           |

Run one package's task with a filter, for example `pnpm --filter @ge/db test`, or a single test file with `pnpm --filter @ge/db exec vitest run src/seed-data.test.ts`. For the scraper: `cd apps/scraper && uv run pytest tests/test_main.py -k health`.

## Self-host

Run all of GetEmployed on your own machine with your own API keys. It's the same site as the cloud version; only the processing uses your keys and your limits.

```sh
cp .env.example .env    # keep SELF_HOSTED=true, fill in the keys you want to use
docker compose -f docker-compose.selfhost.yml up -d --build
docker compose -f docker-compose.selfhost.yml run --rm migrate pnpm db:seed   # optional demo data
```

Open <http://localhost:4000>. The browser treats `localhost` as secure, so the microphone works for mock interviews without HTTPS.

Which keys do what:

- `GOOGLE_GENERATIVE_AI_API_KEY`: Gemini, used for search parsing, matching, tailoring, the Assistant and interviews.
- `GOOGLE_TTS_CREDENTIALS`: the interviewer's voice. Without it, the browser's built-in voice is used.
- `GOOGLE_CLIENT_ID` / `SECRET`: optional Google sign-in and Gmail sending. Email and password work without them.
- `ADZUNA_*`: an extra job source. Greenhouse, Lever and Ashby need no key.
- `LINKEDIN_SCRAPING_ENABLED`: off by default. Read [`docs/job-ingestion.md`](docs/job-ingestion.md) first.

## Google Cloud budget alert

Mock interviews use Google Cloud Text-to-Speech. The app counts characters and switches voice tiers before the free tier runs out (see [`docs/interviews.md`](docs/interviews.md)). As a backstop, set a budget alert on the Google Cloud project that holds your TTS key:

1. Google Cloud console → **Billing** → **Budgets & alerts** → **Create budget**.
2. Scope it to the project, set a small monthly amount (for example ₹100), and add alert thresholds at 50%, 90% and 100%.
3. Send the alerts to an email address you actually read.

## Deployment

Hosting is being decided (see [`docs/roadmap.md`](docs/roadmap.md)). The plan:

- **`apps/app`** on Vercel, with `NEXT_PUBLIC_SITE_URL` set at build time. The marketing pages are prerendered as static pages.
- **`apps/worker`** and **`apps/scraper`** on a container host. Vercel can't run long-lived workers or a headless browser. Build them with `docker build --target worker .` and `docker build apps/scraper`.
- **Postgres and storage:** any managed Postgres 13+ and any S3-compatible bucket.

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md).

## License

[MIT](LICENSE)
