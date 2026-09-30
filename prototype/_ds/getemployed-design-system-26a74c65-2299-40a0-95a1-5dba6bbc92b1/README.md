# GetEmployed Design System

GetEmployed is a career / job-search platform: candidates search verified roles, track applications through stages (saved → applied → interview → offer), see salary bands, and polish resumes. This design system covers its **dark marketing website** and the product-screenshot surfaces shown on it.

The system is adapted from Linear's marketing design system (linear.app) with deliberate deviations: Blue `#7B9BDB` replaces lavender as the single accent, the canvas is warmed very slightly, and one warm off-white highlight (`#EEF3FF`) plus an Blue glow are allowed for CTA / active-state emphasis.

## Sources
- `uploads/DESIGN.md` — Linear marketing design-system spec (structure, type scale, spacing, radii, component set). The GetEmployed adaptation lives in **`DESIGN.md`** at the root.
- GitHub: https://github.com/ashmit27j/get-employed — **currently empty** (no commits), so nothing could be imported. When code lands there, explore it and resync; real screens and copy should replace the illustrative ones here.
- No logo, icon set, imagery or fonts were supplied.

## Index
- `DESIGN.md` — the full GetEmployed Design System doc in `{token.path}` notation (Overview, Colors, Typography, Layout, Elevation, Shapes, Components, Do's & Don'ts, Responsive).
- `styles.css` — entry point (imports only). `tokens/` — `fonts.css`, `colors.css`, `typography.css`, `spacing.css`, `radius.css`, `elevation.css`, `base.css`.
- `guidelines/` — foundation specimen cards (Colors, Type, Spacing, Elevation, Brand).
- `components/` — React primitives (below), one card per directory.
- `ui_kits/website/` — marketing site click-through (Home, Pricing, Changelog, Sign up).
- `SKILL.md` — Agent Skill entry. `thumbnail.html` — project tile. `github.md` — source association.

## Components
- **buttons/** — `Button` (primary / secondary / tertiary / inverse; sm / md / lg; disabled).
- **navigation/** — `TopNav`, `PillTabs` (pricing-tab), `Footer`, `Wordmark`.
- **cards/** — `Card` (feature, pricing, pricing-featured, screenshot, testimonial, logo), `PricingCard`, `TestimonialCard`, `CTABanner`.
- **forms/** — `TextInput`.
- **status/** — `StatusBadge`, `ChangelogRow`.

These map 1:1 to the component set in the source spec (buttons, pricing tabs, cards & containers, inputs, status & build page, top-nav, footer).

### Intentional additions
- `Wordmark` — no logo exists; a typeset name is needed wherever the mark goes.
- `PricingCard`, `TestimonialCard`, `CTABanner` — compositions of `Card` for the spec's pricing-card / testimonial-card / cta-banner entries.

## Content fundamentals
No product copy existed, so tone is inferred from the brief ("sleek modern tech product") and the Linear source. Rules used in the kit:
- **Direct, second person, product-literal.** "Search verified roles, track every application, and see real salary data before you apply." Address the candidate as *you*; the company as *we* only in system messages ("We sent a sign-in link").
- **Sentence case everywhere** — headlines, buttons, nav. No Title Case, no ALL CAPS except the tracked eyebrow ("HOW IT WORKS").
- **Short declarative headlines**, one idea each: "The job search, run like a product." "Free to search. Pay to move faster."
- **Concrete over aspirational.** Numbers and mechanics ("Follow-up nudges after 7 days in Applied") rather than "unlock your dream career".
- Button verbs: "Get started", "Sign in", "Search jobs", "Start free", "Talk to sales".
- **No emoji.** No exclamation marks.

## Visual foundations
- **Canvas & surfaces** — near-black `#07090D` (faint warm tint), then surface-1…4 (`#0F1218 → #262C36`). Sections separate by lifting onto surface-1 panels; the dark canvas is the whitespace. No light mode.
- **Color** — one accent, Blue `#7B9BDB`, used only on the brand dot, primary CTA, focus rings, link hover and active indicators. Text on Blue is near-black `#0A101C` (≈6:1). Success green `#3E9E5C` is the only semantic color and appears mostly as a 6px dot inside neutral pills.
- **Highlight & glow** — the one "sleek" addition. A 1px `#EEF3FF` top-edge at 7% on lifted panels, and an Blue halo (`--glow-cta`) behind the primary CTA; `--glow-active` on the selected pill tab; `--glow-underline` on the active nav link. One glow per viewport.
- **Type** — Inter throughout (display 600, body 400), tracking from -3px at 80px to 0 at 14px; eyebrow is the only positive-tracked style (+0.4px, uppercase). JetBrains Mono for IDs, salaries, versions.
- **Spacing** — 4px base: 4/8/12/16/24/32/48/96. Buttons 8×14, inputs 8×12, tabs 6×14, cards 24, testimonials 32, CTA banner 48. 96px between sections; 1280px container.
- **Radii** — 8px buttons/inputs (never pill CTAs), 12px cards, 16px screenshot panels, pill for tabs/badges.
- **Borders & depth** — 1px hairlines (`#242A33`, strong `#323945`, tertiary `#434B58`). No drop shadows, ever. Hover lifts a card from surface-1 → surface-2 and hairline → hairline-strong.
- **Backgrounds** — flat. No gradients, spotlight cards, textures, or full-bleed photography. Product UI (job tracker lists) is the imagery, framed in 16px surface-1 panels.
- **Imagery vibe** — dark UI captures; if photography is ever used (avatars), keep it desaturated/neutral so Blue stays the only saturated color.
- **Motion** — quiet: 120–180ms `cubic-bezier(.25,.1,.25,1)` on background, border and glow. No bounces, no entrance animations.
- **Hover** — primary brightens to `#93AFE6` and its glow widens; secondary/tertiary step up one surface; links go ink-subtle → ink (nav) or → Blue hover (inline).
- **Press** — primary darkens to `#6583C4` and drops the glow; neutrals step up another surface. No scale/shrink.
- **Focus** — 2px `#8AA8E3` ring at 50%.
- **Transparency & blur** — only for glow tints and the selected-row wash (`--color-glow-soft`). No backdrop blur.
- **Layout** — sticky 56px top nav with hairline bottom; 3-up card grids → 2-up at 1024 → 1-up at 768.

## Iconography
- No icon set was provided. The kit uses **Lucide** (1.5–2px stroke outline icons) from CDN — `https://unpkg.com/lucide-static@0.460.0/icons/<name>.svg`, rendered via CSS mask so they inherit `currentColor`. **This is a substitution — flag for replacement if GetEmployed adopts another set.**
- Icons are monochrome ink-subtle at 15–20px; never Blue except as an active indicator.
- No emoji. Unicode is limited to "→" in tertiary links and "·" as a meta separator.
- **No logo** exists; `Wordmark` renders "GetEmployed" in Inter 600 with an Blue dot. `assets/` is intentionally empty until a real mark is supplied.

## Fonts
Inter and JetBrains Mono load from Google Fonts (`tokens/fonts.css`). They are free substitutes for Linear's proprietary faces; no binaries are bundled.
