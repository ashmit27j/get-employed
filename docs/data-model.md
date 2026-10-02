# Data model

Derived from `prototype/ge-data.js` (`window.GEData`) and the `localStorage` keys the prototype uses. The Drizzle schema in `packages/db` implements this, and the seed script loads the mock data into it.

All tables have `id` (uuid), `created_at` and `updated_at` unless noted. `user_id` means a foreign key to `users` that cascades on delete.

## Auth and user

| Table                                   | Key columns                                                                                                                                                                                                         | Source                        |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| `users`                                 | name, email, email_verified, image, username (sign-in by username), onboarding_step (set for a new account until its Job Profile is saved at 30%; null after), target_role, experience_level, preferred_locations[] | `USER`, Auth onboarding steps |
| `accounts`, `sessions`, `verifications` | Better Auth tables (password hash, Google account, email reset codes)                                                                                                                                               | Auth flows                    |
| `user_settings`                         | user_id (pk), general jsonb, mailbox jsonb (sending window, daily limit, follow-ups, setupDone), ai jsonb (tone, history, recordings), llm_key (the user's own LLM key, sealed with `MAILBOX_ENCRYPTION_KEY`)       | `Settings.dc.html` tabs       |

## Profile

| Table             | Key columns                                                                                                                                                                                                                                                     | Source             |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| `profiles`        | user_id (pk), version int, doc jsonb validated by `ProfileSchema` in `packages/core`: contact, summary, education[], experience[], projects[], skills[{name, items[]}] (an array so group order survives jsonb), certifications[], achievements[], leadership[] | `PROFILE`          |
| `linked_profiles` | user_id, kind (`linkedin`/`github`), source (file key or username), snapshot jsonb, suggestions jsonb, imported_at, error (why the last import failed)                                                                                                          | `Profiles.dc.html` |

The profile is stored as a single document because matching and resume generation read it as a whole and the Profile page edits it section by section. Bumping `version` invalidates cached matches.

## Jobs

| Table              | Key columns                                                                                                                                                                                                                                                                 | Source                            |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| `companies`        | name, domain, logo_url                                                                                                                                                                                                                                                      | `JOBS[].co`                       |
| `job_sources`      | key (`linkedin`, `greenhouse`, `lever`, `ashby`, `adzuna`), enabled, config jsonb, last_run_at, last_error                                                                                                                                                                  | new: ingestion                    |
| `jobs`             | source_key, source_label (shown on the card), external_id, dedupe_hash (unique), company_id, title, location, mode (on-site/hybrid/remote), experience (text + min/max years), skills[], description, url, posted_at, salary_min, salary_max (LPA, stated only), expires_at | `JOBS`                            |
| `salary_estimates` | job_id, min, max, confidence, sample_size                                                                                                                                                                                                                                   | `JOBS[].salary` with `type:"est"` |
| `job_matches`      | user_id, job_id, profile_version, score 0–100, reason, missing[] (unique on user + job + version)                                                                                                                                                                           | `JOBS[].score/why/missing`        |
| `contacts`         | company_id, job_id, name, role, email, confidence, method (e.g. "Verified by SMTP handshake"), status (`found`/`searching`/`none`)                                                                                                                                          | `JOBS[].contact`, `EMAILS[].how`  |

## Saved searches

| Table                  | Key columns                                                                                                                                                                                                                                                                                                 | Source                                         |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `saved_searches`       | user_id, query, filters jsonb (the chip list: `[{type, icon, label, value}]`), frequency (`four-hourly`/`eight-hourly`/`daily`; 4 hours is the floor), run_on (`cloud`: the worker's cron; `local`: only while the app is open), notify (`each`/`digest`/`off`), active, last_run_at, new_count, deleted_at | `SEARCHES`, `ge-search-q`, `ge-search-deleted` |
| `saved_search_results` | saved_search_id, job_id, first_seen_at, seen                                                                                                                                                                                                                                                                | new count                                      |

## Tracker

| Table                | Key columns                                                                                                                                                      | Source                        |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| `applications`       | user_id, job_id (nullable for off-platform roles), title, company, stage (`saved`/`applied`/`interview`/`offer`/`rejected`), stage_changed_at, deadline_at, note | `APPS`, `STAGES`              |
| `application_events` | application_id, kind (`stage`, `tailored`, `emailed`, `opened`, `replied`, `interview_scheduled`, `offer`), data jsonb, at                                       | `APPS[].flags`, `APPS[].meta` |
| `alerts`             | user_id, application_id (null for the user's own reminders), action, due_at, done_at                                                                             | Tracker "Alerts" panel        |

The flags shown in the UI (tailored, emailed, opened, replied) are computed from events and not stored.

## Resumes

| Table          | Key columns                                                                                                                                                                                              | Source                 |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| `resumes`      | user_id, kind (`main`/`tailored`), parent_id, job_id, name, template, source_format (`structured`/`latex`), source text, doc jsonb (structured content), ats_score_before, ats_score, pdf_key, edited_at | `Resume.dc.html` views |
| `resume_diffs` | resume_id, section, old, new, reason, status (`pending`/`accepted`/`rejected`)                                                                                                                           | `DIFFS`                |

Each user has exactly one `main` resume, enforced with a partial unique index.

## Mailbox

| Table                 | Key columns                                                                                                                                                                                                                                                                                                                                                                          | Source                    |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------- |
| `mailbox_connections` | user_id, kind (`gmail`/`smtp`/`imap`), address, encrypted tokens or credentials, scopes[], status                                                                                                                                                                                                                                                                                    | new: sending              |
| `emails`              | user_id, job_id, contact_id, to_name, to_email, subject, body, status (`draft`/`approved`/`sent`/`opened`/`replied`/`bounced`), approved_at, sent_at, opened_at, replied_at, reply_text, error, provider_message_id, tracking_token, attachments jsonb (extra documents `[{name, resumeId?, key?}]`; the resume is always attached), in_reply_to_id (replies written from the Inbox) | `EMAILS`                  |
| `inbox_messages`      | user_id, email_id (the outreach it answers), kind (`interview`/`reply`/`recruiter`/`update`), from_name, from_role, company, from_email, subject, body, source (`imap`/`manual`/`seed`), received_at, read_at, archived_at                                                                                                                                                           | Inbox in `Outbox.dc.html` |

A check constraint means `status` can't be past `approved` unless `approved_at` is set.

## Interviews

| Table                   | Key columns                                                                                                                                                                                                                                                                                                                       | Source                       |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| `interview_sessions`    | user_id, job_id, label, type (`technical`/`behavioural`), format (`voice`/`typed`/`mcq`), started_at, duration_s, score, rubric jsonb (`{communication, technical, structure, confidence}`), transcript jsonb, stt_engine (`webspeech`/`whisper`/`typed`), report jsonb (summary, answer notes, pace and filler words, MCQ picks) | `SESSIONS`, `RUBRIC`         |
| `tts_usage`             | month (`YYYY-MM`), tier (`wavenet`/`standard`), characters (pk month + tier)                                                                                                                                                                                                                                                      | new: TTS free-tier tracking  |
| `interview_audio_cache` | hash (pk of voice + text), voice, storage_key, characters                                                                                                                                                                                                                                                                         | new: cached greeting/closing |

## Assistant

| Table           | Key columns                                                                                                                  | Source                                  |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| `chat_groups`   | user_id, name, color_index, position                                                                                         | `ge-chat-groups`                        |
| `chat_threads`  | user_id, group_id, title, pinned, last_message_at                                                                            | `ge-threads`, `ge-chat-meta`            |
| `chat_messages` | thread_id, role, text, actions jsonb (`[{icon, title, detail, href, cta, status}]`), job_ids[] (jobs listed under the reply) | `ChatDock` message shape in `ge-app.js` |

## Usage (cost guards, not billing)

| Table          | Key columns                                                               | Source    |
| -------------- | ------------------------------------------------------------------------- | --------- |
| `usage_events` | user_id, kind (`interview_session`, `tailor`, `email_sent`, `search`), at | Usage tab |

Plan limits aren't enforced (see decision D15). The only caps in place now protect free tiers, for example `INTERVIEW_MONTHLY_SESSION_CAP`.

## Feedback

| Table      | Key columns                                                                   | Source                          |
| ---------- | ----------------------------------------------------------------------------- | ------------------------------- |
| `feedback` | user_id, kind (`idea`/`bug`/`question`), message, page (optional), created_at | `FeedbackDialog` in `ge-app.js` |

## Stays in the browser

`ge-dock-width`, `ge-sidebar-tab`, `ge-sidebar-collapsed`, `ge-ai-sections`, `ge-groups-open`: UI state for one device only.
