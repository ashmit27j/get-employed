# Job ingestion

## Sources

| Key          | How                                                                                       | Auth              | Notes                                          |
| ------------ | ----------------------------------------------------------------------------------------- | ----------------- | ---------------------------------------------- |
| `linkedin`   | `apps/scraper` (Scrapling) reads LinkedIn's public guest job-search and job-posting pages | none              | Required. Never logs in or uses an account     |
| `greenhouse` | Public job-board API per company board token                                              | none              | Careers pages that run on Greenhouse           |
| `lever`      | Public postings API per company                                                           | none              |                                                |
| `ashby`      | Public job-board API per company                                                          | none              |                                                |
| `adzuna`     | Adzuna search API (India endpoint)                                                        | free app id + key | Licensed aggregator with broad Indian coverage |

More sources can be added as `JobSource` implementations: other licensed aggregators, or boards that offer a legitimate API or partner feed.

## `JobSource` interface (`packages/core`)

```ts
interface JobSource {
  key: string;
  enabled(env: Env): boolean;
  search(filters: SearchFilters, cursor?: string): Promise<{ jobs: RawJob[]; next?: string }>;
  fetch?(externalId: string): Promise<RawJob>; // full description when search returns a summary
}
```

The worker converts each `RawJob` into the `jobs` row shape, validated with zod.

## LinkedIn via Scrapling (`apps/scraper`)

- **Runtime:** Python 3.10+, `scrapling[fetchers]` (BSD-3). The container is built on `pyd4vinci/scrapling`, which includes the browsers.
- **API** (internal network only, protected by a shared secret header):
  - `POST /linkedin/search` `{keywords, location, experience, remote, start}` → list of job summaries.
  - `POST /linkedin/job` `{id}` → full posting (description, criteria, posted time).
- **Fetching:** `Fetcher` (plain HTTP) is the default. `StealthyFetcher` is used only when a response is blocked or empty. Async sessions are reused across requests.
- **Politeness and resilience:**
  - A global rate limit (configurable, default about one request per 2–3 s with jitter).
  - Exponential backoff on 429/999/5xx responses.
  - A circuit breaker that turns the source off for a cool-down after repeated blocks and records `job_sources.last_error`.
  - A response cache keyed by URL for a short TTL.
- **Switch:** `LINKEDIN_SCRAPING_ENABLED=true|false`. With it off, everything else keeps working.
- **Risk:** LinkedIn's terms of service forbid scraping, and it rate-limits and blocks aggressively. The source is isolated behind the switch and the circuit breaker so a block never breaks search. Self-hosters decide for themselves whether to enable it.

## Normalise and dedupe (worker)

- Location, mode (on-site/hybrid/remote), experience ("0–2 yrs", "Fresher", "Internship") and salary (converted to LPA) are normalised in `packages/core`.
- `dedupe_hash` = hash of normalised company + normalised title + city. The same role from several sources merges into one job, and the earliest `posted_at` wins.
- Skills are extracted from the description by matching against a skills dictionary. Gemini fills in anything the dictionary misses.
- Salary: a stated range is kept as stated. Otherwise `salary_estimates` is computed from similar jobs (same title family, city and experience band) with a confidence and sample size.

## Scheduling

- **On demand:** a search whose cached results are older than `SEARCH_FRESHNESS_MINUTES` enqueues `ingest.search`.
- **Saved searches:** cron runs `ingest.refresh-saved` for `four-hourly`/`eight-hourly`/`daily` searches that are active (4 hours is the minimum, to bound scraping and AI cost), updates `saved_search_results` and `new_count`, and enqueues `match.compute`.
- **Cleanup:** jobs past `expires_at`, or not seen for N days, are marked closed every day. The marketing copy says expired roles are removed daily.
