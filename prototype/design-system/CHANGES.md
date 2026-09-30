# Design system v1 → v2: what changed

v2 is rebuilt from the marketing mockup. Usage was counted across the mockup, the v1 components and the 14 product-app screens before anything was removed — nothing the app reads was deleted without a `compat.css` alias.

## Removed
| What | Why |
|---|---|
| `--color-brand-secure` | Used nowhere. |
| `--color-highlight` (#EEF3FF), `--color-highlight-edge` | Only fed `--edge-highlight`; the value is now inline there. |
| `--color-primary-focus` | Only fed the focus ring, which hard-coded its own rgba anyway. |
| `--color-semantic-overlay` | Used nowhere. |
| `--color-inverse-surface-1` | Only used by the `inverse` Button variant (removed). |
| 15 semantic aliases (`--surface-*`, `--border-*`, `--text-*`, `--accent*`, `--focus-ring`) | Zero uses; a second naming layer over the same values. |
| `--weight-*` | Zero uses. |
| `--type-display-xl/lg-*`, `--type-subhead-*`, `--type-button-*`, `*-ls` variants no one read | Mockup hard-codes its display sizes; replaced by the scale it actually uses. |
| All `--spacing-*`, `--pad-*`, `--bp-*` tokens | Zero uses anywhere. Breakpoints can't be used in media queries as custom properties; now documented instead. |
| `--rounded-xxl` (24px) | Never used; the mockup's large panel is 20px → `--rounded-2xl`. |
| `--elevation-0`, `--elevation-2` | Zero uses. |
| `Button variant="inverse"` | Zero uses. |
| `Card` variants `logo`, `pricing` | `logo` unused; `pricing` was identical to `feature`. |
| `CTABanner` | Zero uses; the page's final CTA is a bespoke pattern. |
| `LOGO_MARK` (base64 PNG), `assets/logo-orange.png` | Unused, and the orange mark is from the retired palette. The Wordmark is the mark. |
| `ui_kits/website/*` compiled into the bundle | Page code doesn't belong in a component bundle; the kit lives in `marketing/`. |
| v1 guide claims: "no entrance animations", "96px between sections", "tracking 0 at 14px" | Contradicted by the mockup. Rewritten to match it. |

## Merged / renamed
| v1 | v2 | Note |
|---|---|---|
| `--font-display`, `--font-text` (both Inter) | `--font-sans` | The mockup already referenced `--font-sans`, which didn't exist — the ATS row fell back to mono. |
| `--rounded-pill`, `--rounded-full` (both 9999px) | `--rounded-full` | |
| `--color-inverse-canvas / -surface-2 / -ink` | `--color-paper / -paper-rule / -paper-ink` | Named for what they are: the one light surface. |
| `--color-semantic-success` | `--color-success` | |
| `--type-card-title`, `--type-body-sm`, `--type-body-lg`, `--type-mono` | `--type-title`, `--type-small`, `--type-lead`, `--type-ui` | |
| Card `feature` / `pricing-featured` | `default` / `featured` | |
| Mockup-local `Eyebrow`, `H2`, `Section`, `Tag`, `Sel`, `Reveal`, `Icon`, FAQ list, terminal, source pebble, scroll bar | `Eyebrow`, `SectionHeading`, `Container`, `Tag`, `Highlight`, `Reveal`, `Icon`, `Accordion`, `CodeWindow`, `SourceChip`, `ScrollProgress` | Were orphans on the page side. `Reveal` no longer needs the Motion library. `MiniLabel` was unused and deleted. |

## Added
`--color-selection` (the highlight marker was hard-coded 5×), `--type-cta/hero/section/section-sm/stat/ui/micro`, `--space-*`, `--space-section(-sm)`, `--gutter`, `--rounded-2xl`, `--ease-out-expo`, `--ease-wipe`, `--duration-slow`, `--duration-reveal`, a global `:focus-visible` rule.

## Value changes
| Token / component | v1 → v2 | Why |
|---|---|---|
| `--color-ink-tertiary` | #646B76 → #7A818C | 3.7:1 → 4.9:1 on canvas (mockup change C02). |
| One-off radii in the page | 10 → 8, 14 → 16, 9/3 → full/4 | Off-scale values (C01). |
| One-off type in the page | 17 → 16 (FAQ) / 18 (Self-host intro), 15 → 16 | Off-scale values (C01). |
| `section-sm` tracking | -1.8px → -1.5px | Tracking now scales with size. |
| `Button` focus ring | on any focus → keyboard focus only | No ring after a mouse click. |
| `Button tertiary` background | canvas → transparent | Works on any surface (app only). |
| `ChangelogRow` | dropped radius + canvas fill | Invisible on the canvas. |
| `Accordion`, `PillTabs`, `TopNav` | + aria-expanded/controls, tablist label, aria-current | Accessibility (C03). |

## Not done here
- The bound design-system project is read-only from this project, so v2 lives in `design-system/`. Publishing it means copying these files over the DS project's `tokens/`, `components/` and `README.md`, then deleting `assets/logo-orange.png`, `components/cards/CTABanner.*`, `components/navigation/logoMark.js` and `guidelines/colors-highlight.html` there.
- The 14 product-app screens still load v1. Migrating them is mechanical (swap the stylesheet + bundle, add `compat.css`, then retire aliases screen by screen).
