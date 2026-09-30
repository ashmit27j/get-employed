# GetEmployed Design System v2

Rebuilt from the marketing mockup (`marketing/index.html`) as it exists in Sept 2026. The mockup is ground truth: where the v1 guide and the page disagreed, the page won. Files:

- `tokens.css` — the only token source (color, type, space, radius, depth, motion) plus base element rules.
- `ge-ds.js` — components, plain JS, exported as `window.GE_DS`. Needs React 18 on `window`.
- `compat.css` — v1 aliases kept only because the product app screens still read them. Not part of the system; delete after migration.
- `CHANGES.md` — what was removed, merged, renamed and why.
- `../Design System.dc.html` — live specimen of every token and component.

## Principles
- Dark canvas is the whitespace. Sections separate by lifting onto surface-1 panels with a 1px hairline.
- One saturated hue: Blue `#7B9BDB`. It marks the primary CTA, focus, active state, the highlighted word, and data you should look at (match score, ATS delta, salary band). Never decoration.
- Product UI is the imagery. No photography, no gradients as backgrounds.
- Depth comes from surface steps, hairlines, a 7% top edge, and blue glow on the primary CTA / active state. No drop shadows.

## Color
| Token | Value | Use |
|---|---|---|
| `--color-primary` / `-hover` / `-pressed` | #7B9BDB / #93AFE6 / #6583C4 | CTA, focus, active, key data |
| `--color-on-primary` | #0A101C | Text on blue (6.7:1) |
| `--color-glow` / `-glow-soft` | blue 22% / 10% | Wordmark halo / selected-row wash (app) |
| `--color-selection` | blue 35% | Text highlight marker, `::selection` |
| `--color-canvas` → `--color-surface-4` | #07090D, #0F1218, #151920, #1B2029, #262C36 | Page → nested UI |
| `--color-hairline` / `-strong` | #242A33 / #323945 | Borders; strong on hover/featured |
| `--color-paper` / `-paper-rule` / `-paper-ink` | #FFF / #E6EAF0 / #0A101C | The only light surface: resume preview, hovered source chip |
| `--color-ink` | #E4E7EC | Headings, primary text (15.9:1) |
| `--color-ink-muted` | #C3C8D1 | Body on panels (11.6:1) |
| `--color-ink-subtle` | #8A919C | Secondary text (6.2:1) |
| `--color-ink-tertiary` | #7A818C | Meta, timestamps, legal (4.9:1 canvas, 4.6:1 surface-1) |
| `--color-success` | #3E9E5C | 6px status dots, "offer received" |

All text tokens pass WCAG AA 4.5:1 on canvas, surface-1 and surface-2.

## Type
Inter (400/500/600) for everything; JetBrains Mono for numbers you compare, IDs, versions, terminal. Tracking tightens as size grows; eyebrow and micro labels are the only positive tracking.

| Token | Size / line / tracking | Use |
|---|---|---|
| `cta` | 104 / 1.05 / -4px | Final CTA only |
| `hero` | 80 / 1.05 / -3px | H1 |
| `section` | 56 / 1.1 / -1.8px | Section H2 |
| `section-sm` | 48 / 1.1 / -1.5px | H2 in split layouts (Self-host, FAQ) |
| `stat` | 40 / 1 / -1px | Prices, match score, salary median |
| `headline` | 28 / 1.2 / -0.6px | Pricing tier, sign-up title |
| `title` | 22 / 1.25 / -0.4px | Card title, changelog title |
| `lead` | 18 / 1.55 | Hero sub, section intro, testimonial |
| `body` | 16 / 1.5 | Default, FAQ |
| `small` | 14 / 1.6 | Step copy, lists, nav, inputs labels |
| `ui` | 13 / 1.45 | Product-mock UI, terminal |
| `caption` | 12 / 1.4 | Badges, tags, footer |
| `micro` | 11 / 1.4 / +0.5px mono | Step numbers, filter label |
| `eyebrow` | 13 / 1.3 / +0.4px, 500, uppercase | Section eyebrow |

Responsive: display sizes scale with `clamp()` (hero 44–80, section 36–56, section-sm 32–48, cta 56–104).

## Space & layout
4px base: 4, 8, 12, 16, 20, 24, 32, 40, 48; 6 and 10 are the only half-steps (chip/list gaps). Sections: 120px top (`--space-section`), 72px for a section that continues the previous one (`--space-section-sm`). Container 1280, gutter 24, nav 56.
Breakpoints (media queries, not tokens): 1024 → 3-up grids go 2-up, split layouts stack, nav links collapse; 768 → everything 1-up.

## Radius
4 xs (chart bars) · 6 sm (inner rows, tour items) · 8 md (buttons, inputs, inner cells) · 12 lg (cards) · 16 xl (screenshot frame, code window) · 20 2xl (final CTA panel) · full (badges, tags, tabs, chips).

## Depth
`--edge-highlight` on every lifted panel · `--focus-ring-shadow` on inputs and DS buttons (keyboard focus only) · `--glow-cta(-hover)` on primary buttons · `--glow-active` on selected tab / moved tracker card / salary band peak · `--glow-underline` on active nav link, scroll progress, tour progress. One glow per viewport.

## Motion
The page is more animated than v1 allowed; the system now describes what it actually does.
- UI state: 120–180ms `--ease-standard` on color, background, border, glow.
- Entrance: `Reveal` — 1000ms `--ease-out-expo`, 32px rise, 8px blur → 0, staggered 80ms.
- Emphasis: `Highlight` marker wipes in over 700ms `--ease-wipe` once fully in view. Hero headline wipes with the same curve.
- Expand: accordion rows 500ms `--ease-out-expo` on `grid-template-rows`.
- Ambient: source marquee (45s linear), product tour auto-advance (5.2s per view, pauses on hover and has a pause button).
- `prefers-reduced-motion`: reveals and wipes are instant, marquee slows to 120s, tour typing and hero examples stop.

## Components (`window.GE_DS`) ↔ where the mockup uses them
| Component | Props | Mockup use |
|---|---|---|
| `Icon` | name, size | Everywhere (Lucide via CSS mask) |
| `Wordmark` | size | TopNav, Footer, Sign up |
| `Container` | id, top, bottom | Every section |
| `Eyebrow` | — | Section eyebrows |
| `SectionHeading` | size lg / md | Every H2 |
| `Button` | variant primary / secondary / tertiary; size sm / md / lg; fullWidth, disabled, iconLeft/Right, href | Nav, hero, outbox card, pricing, CTA, sign up (tertiary: product app) |
| `TextInput` | label, hint, iconLeft + input props | Hero search, sign up |
| `StatusBadge` | tone neutral / success / accent | Hero count, "Verified", "Open source", changelog tag |
| `Tag` | label | Feature card chips, hero filter chips |
| `PillTabs` | options, value, onChange, label | Monthly / Yearly |
| `TopNav` | links, active, onNavigate, onSignIn, onCta | Header |
| `Footer` | columns, note, githubUrl, onLink | Footer |
| `Card` | variant default / featured / screenshot / testimonial; eyebrow, title, interactive | Feature cards, product-tour frame |
| `PricingCard` | tier, price, period, description, features, cta, featured | Pricing |
| `TestimonialCard` | quote, name, role, avatar | Testimonials |
| `ChangelogRow` | version, date, title, items, tag | Changelog |
| `CodeWindow` | children | Self-host terminal |
| `Accordion` | items [[q,a]], defaultOpen | FAQ |
| `SourceChip` | name, icon (`lucide:x`, `si:x`, or none) | Job-board marquee |
| `Reveal` | delay, y | Section entrances |
| `Highlight` | delay | "for engineers", "like you" |
| `ScrollProgress` | — | 2px bar at the top |

## Page patterns (compositions, not components)
Built only from the tokens and components above; they live in `marketing/`.
- **Product tour** (`ProductMock.jsx`) — sidebar tabs + five animated views inside `Card variant="screenshot"`.
- **Step figures** (`Figures.jsx`) — isometric line drawings in hairline/ink-tertiary with one primary-stroked element.
- **Hero search parser** (`Home.jsx`) — `TextInput` + `Button` + `Tag` chips.
- **Final CTA** — surface-1 panel, radius 2xl, `cta` type with per-letter reveal and the Highlight treatment.
- **Clone box** (`Pricing.jsx`) — inline `$ git clone` command with copy action.

## Content rules
Second person, sentence case, no exclamation marks, no emoji. Concrete numbers and mechanics over aspiration. Unicode limited to → and ·. ₹ and LPA for salaries.
