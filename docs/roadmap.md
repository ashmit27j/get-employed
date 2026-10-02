# Roadmap

Each phase ends with a working, checked state and waits for the owner's go-ahead before the next one starts.

## Phase 0: Planning (current)

- [x] Prototype moved to `prototype/`
- [x] Decisions, architecture, data model, routes, ingestion, interviews and email docs
- [x] `LICENSE` (MIT), `CLAUDE.md`

## Phase 1: Scaffold and tooling (done)

- [x] pnpm + Turborepo workspace with `apps/web`, `apps/app`, `apps/worker`, `apps/scraper`, `packages/ui`, `core`, `db` and `config`
- [x] TypeScript strict, ESLint, Prettier, Vitest; Ruff + pytest for the scraper. (Playwright moved to Phase 3, the first phase with real pages.)
- [x] `.gitignore`, `.editorconfig`, `.nvmrc`, `.env.example` (one root file with commented sections)
- [x] `docker-compose.yml` for local development (Postgres, SeaweedFS) and `docker-compose.selfhost.yml` that runs everything
- [x] Drizzle schema from [data-model.md](data-model.md), migrations, and a seed script from `prototype/ge-data.js`
- [x] CI workflow: lint, typecheck, test, and build every app
- [x] `README.md` (with the self-host and Google Cloud budget-alert sections) and `CONTRIBUTING.md`
- [x] Update `CLAUDE.md` with the real commands

## Phase 2: `packages/ui` (done)

- [x] `packages/ui/src/theme.css`: the v2 tokens as the Tailwind v4 theme (defaults removed) plus CSS variables; prototype token names kept as aliases
- [x] The `GE_DS` components and the general-purpose `GEApp` components ported as typed React + Tailwind components, with Lucide icons (`src/icons.ts`)
- [x] Component catalogue at `/dev/components` in `apps/app` (development only)
- [x] `docs/design-system.md`; tests for component behaviour and the no-raw-colour rule
- Moved to the phases that use them: the app shell components to Phase 4; `ResumePaper`, `ResumeCard`, `TemplatePicker`, `LatexEditor` and `MarkdownView` to the documents page; `AIOrb`, `TranscriptReadout` and `MeetingButton` to the interview page; `AuthArt` to Phase 4; `FeedbackDialog` to settings

## Phase 3: Marketing site (done)

- [x] Home, Pricing and Changelog with all changes C01–C12 built in; the review system is not ported
- [x] Responsive at 1024/768, `prefers-reduced-motion`, focus-visible, real anchors, metadata, OG image, sitemap, robots
- [x] Hero query parser moved to `packages/core` (`parseSearchQuery`) so the app's search shares it
- [x] Playwright end-to-end tests (desktop + mobile) in CI
- [x] Merged into `apps/app` as the `(marketing)` route group: one site, one URL, one port, the same in cloud and local (D21, D22)
- TODO: real Privacy and Terms pages (placeholders now; Google verification needs a privacy policy)

## Phase 4: App shell and auth (done)

- [x] Sidebar (Home/AI tabs, Documents sub-nav, chat list with pin/rename/groups/drag-and-drop/delete stored in the database), top bar with breadcrumbs, assistant dock (resizable, Ctrl+J), mobile tab bar and drawer, account menu, Ctrl+B / Ctrl+, shortcuts
- [x] Better Auth: email + password, username sign-in, 6-digit email-code reset, Google sign-in when configured; `proxy.ts` redirect for signed-out visitors
- [x] 6-step onboarding at `/onboarding`, saved after every step, resume upload to storage + `resume.parse` queued
- [x] Playwright tests for auth, shell, onboarding and mobile
- Moved: the assistant's chat itself is built with the Phase 6 LLM work (the dock shows a placeholder until then)

## Phase 5: App pages (seed data first, real data in Phase 6) (done)

Order: jobs → job detail → saved search → tracker → documents → mailbox → profile → profiles → settings/account → assistant → interview.

- [x] Jobs: Discover, Deep Search, Saved
- [x] Job detail: match breakdown (rule-based, `packages/core/src/match.ts`), requirements with evidence, "I have this", salary band, contact discovery
- [x] Saved search: matches, polling (hourly/6 hours/daily/weekly, cloud/local, notify)
- [x] Tracker: grouped applications with stage moves, alerts (dated and custom)
- [x] Documents: main resume editor (visual + LaTeX, autosave, live ATS score), tailored list, tailor view with diffs, upload; Export PDF prints the A4 pages until `resume.compile`
- [x] Mailbox: inbox (`inbox_messages`), outbox with explicit approval, mark replied/bounced, attachments
- [x] Job Profile: shares resume content with `profiles.doc` (D18), details in `profiles.details`
- [x] LinkedIn and GitHub profiles (no GitHub OAuth app, D20)
- [x] Settings (general, mailbox with SMTP, AI & privacy, usage counts, developer, feedback) and Account (photo, sessions, password, email change, Google link, export, delete)
- [x] Assistant: page and dock, streamed replies, tool actions (search, tailor, draft email, tracker), saved threads; rule-based intent until Phase 6
- [x] Interview: setup, live voice (browser speech recognition and speech synthesis, typed fallback, optional camera), typed, multiple choice, feedback with rubric, pace, filler words and progress; rule-based questions and grading (`packages/core/src/interview.ts`)
- [x] Settings look the same in cloud and local; a user's own LLM key is saved encrypted per user (D22)
- [x] Owner review round: one site (pricing is a home section, no changelog), password policy, sign-up lands on the Job Profile with a walkthrough and locked navigation (D24), explicit profile save with a leave warning, redesigned tracker, Mailbox connect step, settings dialog with Account inside (D23), light theme (D25), LinkedIn URL import, consistent page widths
- Left for Phase 6 on the interview page: the AI model picker, Strictness, and eye contact / posture metrics (they need the LLM and video analysis).
- Not built on purpose: the prototype's plan quotas ("Emails this month 38/50", "Cloud checks 184 of 300", overages). They wait for billing (D15).

## Phase 6: Backend wiring (done)

Every LLM step has a rule-based fallback, so the app works without a Gemini key (D26). A user's own key (Settings → Developer) wins over the deployment's.

- [x] `@ge/ai`: one typed function per Gemini task (query parsing, skills, match reasons, tailoring, drafts, resume parsing, interview turns and grading, LinkedIn review), tested against the AI SDK's mock model
- [x] Ingestion: Greenhouse and Lever boards for 12 Indian companies (D28), Adzuna (with a key), LinkedIn guest search through `apps/scraper` (behind the switch); India and engineering-role filters, normalised location, mode, experience and salary, dedupe across sources, salary estimates from comparable jobs; hourly board refresh, saved-search refresh by frequency, daily cleanup
- [x] Matching: `match.compute` scores every open job per profile version (skills, experience with a seniority cap, role fit, location, project evidence); Gemini writes reasons for the best matches
- [x] Resumes: `resume.parse` (PDF, DOCX, LaTeX → profile; Gemini or the rule parser), `resume.tailor` (Gemini rewrites or safe rule rewrites that only surface skills the resume already backs), `resume.compile` (Tectonic → PDF in storage; Export PDF downloads it when it matches the latest edit)
- [x] Outreach: `contact.find` (addresses listed in the post, else the careers inbox of the company's MX-checked domain; never a guessed person, D27), `email.draft`, `email.send` (approved only; sending window and daily limit; Gmail API or SMTP; compiled resume attached; open pixel at `/t/o/[token]`), `email.track` (daily follow-up drafts, approved like any email), Gmail connect from the Mailbox
- [x] Assistant: Gemini tool calling over the same tools as the rule router, plus `fill_profile` for "Edit with AI" on the Job Profile
- [x] Profiles: `profile.import-github` (public API, README scores, pins from GraphQL or the public page), `profile.import-linkedin` (PDF export or public page through the scraper; failures shown on the page)
- [x] Interviews: `/api/interview/turn` (Gemini follow-ups, at most two per session, Strictness), `/api/tts` (Cloud TTS, WaveNet → Standard → browser voice, character reservation and cache), Whisper in a Web Worker when Web Speech fails, `interview.grade`
- Not built: choosing the interview model per session (the deployment sets `INTERVIEW_MODEL`); eye contact and posture scores (need video analysis)

## TODO (not scheduled)

- **Two-step verification** (Better Auth two-factor plugin) for Account.
- **More connectors:** LinkedIn/GitHub sign-in, Google Calendar, Drive, Notion and Slack appear in the prototype's Account page but have no design in the architecture yet.

- **Billing and plan quotas:** payment provider (undecided), Free/Pro limits, the Usage tab against the limits. The numbers are not final.
- **Hosting:** a cloud host for `apps/worker` and `apps/scraper`, managed Postgres, an S3 bucket, domains (all current URLs are placeholders).
- **Google:** brand verification and `gmail.send` verification before going past 100 test users.
- **IMAP connection** for automatic reply and bounce detection.
- More licensed job sources.
