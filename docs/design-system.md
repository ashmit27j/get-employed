# Design system (v2)

Ported from `prototype/design-system/DESIGN.md`. The code is `packages/ui`:

- `src/theme.css` is the **only token source**. It defines the Tailwind v4 theme and the CSS variables.
- `src/components/` holds the React components.
- `/dev/components` in `apps/app` is the live catalogue (development only).

Where the prototype's `DESIGN.md` table and its `tokens.css` disagree on a hex value (for example canvas `#07090D` vs `#07090C`), `tokens.css` wins, because that's what the pages actually render.

## Using it

```css
/* apps/*/src/app/globals.css */
@import "tailwindcss";
@import "@ge/ui/theme.css";
@source "../../../../packages/ui/src";
```

```tsx
import { Button, MatchRing, Panel } from "@ge/ui";
<div className="rounded-lg border border-hairline bg-surface-1 p-6 text-small text-ink-muted shadow-edge" />;
```

- The theme resets Tailwind's defaults, so `bg-blue-500`, `shadow-md`, `rounded-3xl` and `text-sm` don't exist. Only the tokens below do.
- `packages/ui/src/design-rules.test.ts` fails if a component uses a raw colour or a pixel font size.
- Every token is also a CSS variable (`var(--color-primary)`), and the prototype's names still work in plain CSS: `--rounded-*`, `--space-*`, `--edge-highlight`, `--glow-*`, `--duration-*`.
- Fonts come from `next/font` in each app layout (`--font-inter`, `--font-jetbrains-mono`). The theme builds `font-sans` and `font-mono` from them.
- Internal links in components go through `LinkProvider` (next/link in both apps).

## Principles

- **The dark canvas is the whitespace.** Sections separate by lifting onto surface-1 panels with a 1px hairline. Dark by default, with a light theme (D25): the same token names get light values under `:root[data-theme="light"]` in `theme.css`. Components never branch on the theme.
- **One saturated hue: blue `#7B9BDB`.** It marks the primary CTA, focus, the active state, the highlighted word, and data worth looking at (match score, ATS delta, salary band). Never decoration.
- **Product UI is the imagery.** No photography, and no gradients as backgrounds.
- **Depth comes from surface steps, hairlines, a 7% top edge (`shadow-edge`), and blue glow on the primary CTA and active state.** No drop shadows. One glow per viewport.

## Colour

| Utility / variable                                     | Value                                 | Use                                                                                         |
| ------------------------------------------------------ | ------------------------------------- | ------------------------------------------------------------------------------------------- |
| `primary` / `primary-hover` / `primary-pressed`        | #7B9BDB / #93AFE6 / #6583C4           | CTA, focus, active, key data                                                                |
| `on-primary`                                           | #0A101C                               | Text on blue                                                                                |
| `glow` / `glow-soft`                                   | blue 22% / 10%                        | Halo; selected-row and active-chip wash                                                     |
| `selection`                                            | blue 35%                              | Highlight marker, `::selection`                                                             |
| `primary-50…950`, `primary-soft`, `primary-line`       | tints                                 | Icon tiles, tinted panels, text on tint                                                     |
| `canvas`, `surface-1…4`                                | #07090C → #272C33                     | Page → nested UI                                                                            |
| `hairline` / `hairline-strong` / `hairline-tertiary`   | #252A30 / #333941 / #434B58           | Borders; strong on hover and featured; tertiary for dashed underlines                       |
| `scrim`                                                | canvas 72%                            | Behind modals                                                                               |
| `paper` / `paper-rule` / `paper-ink`                   | #FFF / #E6EAF0 / #0A101C              | The only light surface: resume preview, hovered source chip                                 |
| `ink` / `ink-muted` / `ink-subtle` / `ink-tertiary`    | #E4E7EA / #C4C8CE / #8B9199 / #7B8189 | Headings / body on panels / secondary / meta. All pass AA                                   |
| `success`                                              | #3E9E5C                               | 6px status dots, "offer received"                                                           |
| `{success,warning,danger,teal,violet}-{ink,soft,line}` | oklch tones                           | Status and category tags **only**, never icons or CTAs. `danger-text` for removed diff text |

Score colours (`scoreTone`): green (`success-ink`) at 80 and above, amber (`warning-ink`) at 60 and above, red (`danger-ink`) below.

## Type

Inter (400/500/600) for everything. JetBrains Mono (`font-mono`) for numbers you compare, IDs, versions and salaries. Tracking tightens as size grows. Eyebrow and micro are the only positive tracking. Each `text-*` utility sets size, line height and tracking together.

| Utility           | Size / line / tracking            | Use                                                      |
| ----------------- | --------------------------------- | -------------------------------------------------------- |
| `text-cta`        | 104 / 1.05 / -4px                 | Final CTA only                                           |
| `text-hero`       | 80 / 1.05 / -3px                  | H1 (marketing)                                           |
| `text-section`    | 56 / 1.1 / -1.8px                 | Section H2                                               |
| `text-section-sm` | 48 / 1.1 / -1.5px                 | H2 in split layouts                                      |
| `text-stat`       | 40 / 1 / -1px                     | Prices, match score, salary median                       |
| `text-headline`   | 28 / 1.2 / -0.6px                 | App page title, pricing tier                             |
| `text-title`      | 22 / 1.25 / -0.4px                | Card title                                               |
| `text-lead`       | 18 / 1.55                         | Hero sub, section intro, testimonial                     |
| `text-body`       | 16 / 1.5                          | Default                                                  |
| `text-small`      | 14 / 1.6                          | App UI text, lists, nav, labels                          |
| `text-ui`         | 13 / 1.45                         | Dense UI, chips, terminal                                |
| `text-caption`    | 12 / 1.4                          | Badges, meta, footer                                     |
| `text-micro`      | 11 / 1.4 / +0.5px                 | Step numbers, counts (add `tracking-normal` for numbers) |
| `text-eyebrow`    | 13 / 1.3 / +0.4px, 500, uppercase | Section eyebrow (`<Eyebrow>`)                            |

Display sizes scale with `clamp()` under 1024px: hero 44–80, section 36–56, section-sm 32–48, cta 56–104.

## Space and layout

- The spacing base is 4px: `p-1` = 4px and `p-6` = 24px. Use the scale 4, 8, 12, 16, 20, 24, 32, 40, 48. 6 (`1.5`) and 10 (`2.5`) are the only half-steps, for chip and list gaps.
- Sections: 120px top (`--space-section`), or 72px for a section that continues the one before (`--space-section-sm`).
- Container 1280 (`max-w-page`), gutter 24, nav 56.
- Breakpoints:
  - `max-lg` (below 1024): 3-up grids go 2-up, split layouts stack, nav links collapse.
  - `max-md` (below 768): everything goes 1-up, and the app switches to its mobile layout.

## Radius

`rounded-xs` 4 (chart bars) · `sm` 6 (inner rows) · `md` 8 (buttons, inputs) · `lg` 12 (cards) · `xl` 16 (screenshot frame, code window, modal) · `2xl` 20 (final CTA panel) · `full` (badges, tags, tabs, chips).

## Depth

| Utility                   | Use                                                     |
| ------------------------- | ------------------------------------------------------- |
| `shadow-edge`             | Every lifted panel (7% top highlight)                   |
| `shadow-focus`            | Inputs and buttons on keyboard focus                    |
| `shadow-glow-cta(-hover)` | Primary button                                          |
| `shadow-glow-active`      | Selected pill tab, moved tracker card, salary band peak |
| `shadow-glow-underline`   | Active nav link, scroll progress                        |
| `shadow-glow-dot`         | The assistant's blue dot                                |

Keyboard focus shows a 2px `primary-hover` outline everywhere (base layer). Components that draw their own ring set `data-ds-focus`.

## Motion

- **UI state:** 120–180ms `ease-standard` on colour, background, border and glow (`duration-(--duration-base) ease-standard`).
- **Entrance:** `<Reveal>`. 1000ms `ease-out-expo`, 32px rise, 8px blur to 0, staggered 80ms.
- **Emphasis:** `<Highlight>`. The marker wipes in over 700ms `ease-wipe` once it is fully in view.
- **Expand:** accordion rows, 500ms `ease-out-expo` on `grid-template-rows`.
- **Ambient:** source marquee (45s linear), product tour auto-advance (5.2s per view, pauses on hover).
- **In the app:** quiet. Only state transitions, plus streaming text (`animate-blink`), spinners (`animate-spin`) and the interview orb.
- **`prefers-reduced-motion`:** animations and transitions become instant, and `Reveal`/`Highlight` render in their final state.

## Components

`packages/ui` exports all of these. Props are typed, so see the source for details.

| Group       | Components                                                                                                                                           |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Foundations | `Icon` (Lucide by kebab-case name, see `icons.ts`), `Wordmark`, `BrandWordmark`, `Container`, `Eyebrow`, `SectionHeading`, `Kbd`, `Avatar`, `CoLogo` |
| Actions     | `Button` (primary / secondary / tertiary; sm / md / lg; `href` renders a link), `IconButton`                                                         |
| Fields      | `TextInput`, `TextArea`, `Select`, `SortSelect`, `Dropdown`, `Combobox`, `InlineSelect`, `Toggle`, `TimePicker`, `TimeRangePicker`, `Field`          |
| Choices     | `PillTabs` (marketing), `Segmented` (app), `Chip` (toggle or removable)                                                                              |
| Status      | `StatusBadge`, `ToneBadge`, `Tag`, `QuotaBar`, `StepList`, `EmptyState`                                                                              |
| Scores      | `MatchRing`, `ScoreBar`, `ConfidenceMeter`, `SalaryBadge` (stated vs estimated), `MetricReadout`                                                     |
| Containers  | `Card`, `Panel`, `PageHeader`, `Modal`, `PricingCard`, `TestimonialCard`, `CodeWindow`, `Accordion`, `SourceChip`                                    |
| Marketing   | `TopNav`, `Footer`, `Reveal`, `Highlight`, `ScrollProgress`                                                                                          |
| App         | `DiffText`, `DiffBlock`, `ChatBubble`, `ChatAction`, `Dropzone`, `StageCard`                                                                         |

Ported with the pages that use them (roadmap Phases 4–5):

- **App shell:** `Sidebar`, `Topbar`, `ChatDock`, `MobileTabBar`, `MobileDrawer`.
- **Documents:** `ResumePaper`, `ResumeCard`, `TemplatePicker`, `LatexEditor`, `MarkdownView`.
- **Interview:** `AIOrb`, `TranscriptReadout`, `MeetingButton`.
- **Other pages:** `AuthArt`, `FeedbackDialog`.

Accessibility built in:

- Tabs follow the ARIA tabs pattern: `role="tablist"`, arrow keys, roving `tabindex`.
- Listboxes support arrow keys, Enter and Escape, and the combobox sets `aria-activedescendant`.
- The accordion wires each `aria-expanded` button to its region with `aria-controls`.
- `Modal` has `aria-modal`, moves focus into the dialog and back out, and closes on Escape.
- `Toggle` uses `role="switch"`, and progress bars have `role="progressbar"` with values.

## Content rules

Second person, sentence case, no exclamation marks, no emoji. Concrete numbers and mechanics over aspiration. Unicode is limited to → and ·. Salaries are written in ₹ and LPA.
