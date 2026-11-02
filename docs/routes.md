# Route map

Every route is ported from a file in `prototype/`. Copy, states and flows match the prototype exactly unless a change is approved.

## Marketing pages (`apps/app`, `(marketing)` route group, static)

| Route                                    | Prototype source                                                           | Notes                                                              |
| ---------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `/`                                      | `marketing/Home.jsx`, `HomeSections.jsx`, `ProductMock.jsx`, `Figures.jsx` | Anchors `#how` (How it works), `#selfhost` (Self-host), `#pricing` |
| `/privacy`, `/terms`                     | —                                                                          | New; indexed and listed in the sitemap                             |
| `/sitemap.xml`, `/robots.txt`, OG images | —                                                                          | New                                                                |

- Top nav links: How it works, Pricing (`/#pricing`), Self-host. `/pricing` redirects to `/#pricing`; there is no changelog.
- "Sign in" goes to `/signin` and "Get started" to `/signup` on the same site.
- The review system in `marketing/changes.js` (C01–C12) is not ported. Every change is built in as ON.

## Product pages (`apps/app`, signed in, `noindex`)

| Route                                    | Prototype source                      | Query / notes                                                                                                                                                                                                                 |
| ---------------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/signin`                                | `Auth.dc.html` (signin)               | Username or email + password, Google                                                                                                                                                                                          |
| `/signup`                                | `Auth.dc.html` (signup)               | Name, email, password (at least 8 characters), Google                                                                                                                                                                         |
| `/reset`                                 | `Auth.dc.html` (forgot)               | Email → 6-digit code → new password → done                                                                                                                                                                                    |
| `/jobs`                                  | `Jobs.dc.html`                        | `?board=` (e.g. `Saved`)                                                                                                                                                                                                      |
| `/jobs/[id]`                             | `Job Detail.dc.html`                  |                                                                                                                                                                                                                               |
| `/jobs/searches/[id]`                    | `Saved Search.dc.html`                |                                                                                                                                                                                                                               |
| `/tracker`                               | `Tracker.dc.html`                     |                                                                                                                                                                                                                               |
| `/mailbox`                               | `Outbox.dc.html`                      | `?box=`. First visit with nothing connected shows "Connect your mailbox" (Gmail send-only or SMTP, or skip; `user_settings.mailbox.setupDone`). `?connected=gmail` finishes the Gmail step                                    |
| `/documents`                             | `Resume.dc.html`                      | `?view=main\|list\|upload\|tailor`, `&job=`, `?tab=`                                                                                                                                                                          |
| `/interview`                             | `Interview.dc.html`                   | Setup (live, typed, multiple choice) → session. `?session=<id>` shows the feedback (or test results), `?start=mcq` starts a test. The Assistant is off during a live session                                                  |
| `/assistant`                             | `Assistant.dc.html`                   | `?thread=`, `?new=1`                                                                                                                                                                                                          |
| `/arena`                                 | —                                     | Coding Arena hub: the four arenas with progress, and recently solved problems. New; no prototype screen (D29)                                                                                                                 |
| `/arena/[arena]`                         | —                                     | `dsa`, `logic`: problem list with search, difficulty, status and topic filters; `?role=`, `?company=`, `?topic=` preset filters. `aptitude`, `cs`: multiple-choice sets                                                       |
| `/arena/problems/[slug]`                 | —                                     | Statement, hints (one at a time), editorial (behind a click until solved), submission history; Monaco editor (C++17, Python 3), live verdicts over the WebSocket with polling as the fallback. Drafts are kept in the browser |
| `/arena/mcq/[setId]`                     | —                                     | Intro → timed run (submits when time runs out) → score with every explanation                                                                                                                                                 |
| `/arena/admin`                           | —                                     | Problem setters only (`ARENA_ADMIN_USER_IDS`, 404 for everyone else): edit a problem as JSON, upload tests, validate the reference solutions, save multiple-choice sets                                                       |
| `/profile`                               | `Profile.dc.html`                     | Job Profile. Saves only on Save; leaving with unsaved edits asks first. New accounts land here locked, with a walkthrough                                                                                                     |
| `/profiles/linkedin`, `/profiles/github` | `Profiles.dc.html`                    | LinkedIn: PDF export **or** profile URL, both queue `profile.import-linkedin`                                                                                                                                                 |
| `#settings/<section>` on any app page    | `Settings.dc.html`, `Account.dc.html` | A dialog over the current page. Sections: general, account, mailbox, ai, billing (`usage` is an alias), dev; `feedback` opens the feedback form. `/settings?tab=` and `/settings/account` redirect to `/jobs#settings/...`    |

Everything except the auth routes and the marketing pages requires a session. A new account (`users.onboarding_step` set) is sent to `/profile`, with the sidebar locked, until its Job Profile is saved at 30% complete (`UNLOCK_PCT`). `/dev/components` (development only) is the component catalogue.

## Sidebar (from `NAV` in `prototype/ge-app.js`)

- **Workspace:** Job board, Application Tracker, Mailbox (unread badge), Documents (Main resume, Tailored resumes), Interview prep, Coding Arena (not in the prototype; D29).
- **Profiles:** LinkedIn, GitHub, Job Profile.
- **Assistant:** chat history with pin, rename, delete, and groups with drag and drop.
- **Bottom:** Settings, Plan & billing, Usage, Get help.
- The wordmark links to the home page (`/`).

## Not ported

`Onboarding.dc.html` and the 6-step onboarding in `Auth.dc.html` (replaced by the Job Profile walkthrough, D24), `Auth-standalone.dc.html`, `GetEmployed Auth.html`, `Canvas*.dc.html`, `Marketing Page.dc.html`, `Marketing Grid Previews.dc.html`. Some files are specs, not pages: `Components.dc.html` (component catalogue), `Design System.dc.html` (token specimen) and `Mobile Preview.dc.html` (390×844 mobile behaviour).
