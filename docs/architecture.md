# Architecture

GetEmployed is one Next.js app that serves both the public marketing pages and the signed-in product, plus two background services. Cloud and self-hosted deployments show the same site; `SELF_HOSTED` only changes how work is processed (D21, D22).

## Layout

```
apps/app          The site and the app. Next.js App Router: marketing pages ((marketing), static),
                  product pages, route handlers and server actions.
apps/worker       Node process: pg-boss consumers and cron schedules (boards hourly, saved searches
                  hourly, cleanup and follow-ups daily). `pnpm --filter @ge/worker run-job <queue> <json>`.
apps/scraper      Python 3.10+: FastAPI + Scrapling. Internal network only.
packages/ui       v2 tokens (Tailwind theme + CSS variables) and shared React components.
packages/core     zod schemas, shared types, query parser, match and ATS scoring, ingestion normalisers,
                  rule-based resume and LinkedIn parsing.
packages/ai       Gemini tasks (Vercel AI SDK), server only; every caller has a rule-based fallback.
packages/db       Drizzle schema, migrations, seed built from prototype/ge-data.js.
packages/config   Shared tsconfig, ESLint and Tailwind preset.
prototype/        The design prototype. Read-only spec.
docs/             This folder.
```

Dependency rules:

- The marketing pages (`src/app/(marketing)`, `src/components/site`) import only `packages/ui`, `src/lib/site.ts` and the brand assets. No auth and no data fetching.
- `apps/app` and `apps/worker` import `ui`/`core`/`db` as needed.
- `apps/scraper` shares no code with the others. Its contract is its HTTP API, and a zod schema in `packages/core` validates what it returns.

## Where things run

| Service        | Cloud                                        | Local (`docker compose up`)                |
| -------------- | -------------------------------------------- | ------------------------------------------ |
| `apps/app`     | Vercel (functions)                           | container or `pnpm dev`                    |
| `apps/worker`  | Container host (TBD)                         | container                                  |
| `apps/scraper` | Container host (TBD), not publicly reachable | container (built on `pyd4vinci/scrapling`) |
| Postgres       | Managed Postgres (TBD)                       | `postgres` container                       |
| File storage   | S3-compatible bucket (TBD)                   | `storage` container (SeaweedFS)            |

The worker and scraper can't run on Vercel: functions are short-lived, a queue consumer runs indefinitely, and `StealthyFetcher` needs a headless browser. Choosing their cloud host is a roadmap TODO.

## Main flows

**Search → ingest → match**

1. The user types a plain-English query in `/jobs`. `packages/core` parses it into chips (role, skill, location, salary, experience, type). Gemini handles the parsing, and rules take over if the LLM is unavailable.
2. `apps/app` looks up matching jobs in Postgres and returns them at once. If the results are stale, it enqueues `ingest.search`.
3. The worker runs each enabled `JobSource`. LinkedIn goes through `apps/scraper`; the API sources are called directly. The worker then normalises, dedupes and upserts `jobs`/`companies`.
4. The worker enqueues `match.compute` for affected users: score 0–100, a reason and missing skills are written to `job_matches`, keyed by profile version.
5. Saved searches are refreshed on cron (hourly/daily/weekly) by the same jobs, which update `new_count`.

**Tailor a resume**
The request goes from `/documents?view=tailor&job=` to a route handler, which enqueues `resume.tailor`. The worker has Gemini propose per-bullet diffs with reasons, calculates the ATS score before and after, and stores `resume_diffs`. The user accepts or rejects each diff. `resume.compile` then runs Tectonic in the worker, and the PDF goes to storage. Tailored resumes never change the main resume.

**Outreach**
`contact.find` runs a domain pattern match plus an MX lookup (SMTP handshake where the host allows outbound port 25) and records the confidence. Gemini writes a draft into `emails` with status `draft`. The user edits and approves it, which sets `approved_at`. `email.send` is enqueued and sends through the connected Gmail (`gmail.send`) or SMTP. A database check constraint means no row can be `sent` without `approved_at`. See [email-and-google.md](email-and-google.md).

**Assistant**
`/api/assistant` streams Gemini output through the AI SDK with tool calls for search jobs, tailor resume, draft emails, read tracker and book mock interview. Each tool call is stored on the message as an action card (`running` → `done`). Threads, groups and pins live in the database.

**Interview turn**
The browser captures and transcribes speech, then calls `/api/interview/turn` (Gemini, short replies) and `/api/tts` (Google Cloud TTS with tier fallback). See [interviews.md](interviews.md).

## Queue (pg-boss)

Job names: `ingest.search`, `ingest.refresh-saved`, `match.compute`, `contact.find`, `email.send`, `email.track`, `resume.parse`, `resume.tailor`, `resume.compile`, `profile.import-linkedin`, `profile.import-github`, `interview.grade`.

- Retries use exponential backoff.
- Jobs are idempotent by key: for example, `email.send` is keyed by email id and checks the status before sending.

## Cloud vs local (`SELF_HOSTED`)

|                  | Cloud (`false`)                                       | Local / self-host (`true`)                                             |
| ---------------- | ----------------------------------------------------- | ---------------------------------------------------------------------- |
| API keys         | Project keys, or the user's own key saved in Settings | The operator's keys in `.env`, or the user's own key saved in Settings |
| UI               | Same site and app                                     | Same site and app                                                      |
| Cost caps        | On (interview sessions, TTS tiers)                    | Configurable, off by default                                           |
| Google sign-in   | On                                                    | Optional; email + password always works                                |
| Outreach sending | Gmail (`gmail.send`)                                  | The user's own Google OAuth client or SMTP                             |
| Microphone       | HTTPS from Vercel                                     | `http://localhost` counts as a secure context                          |
