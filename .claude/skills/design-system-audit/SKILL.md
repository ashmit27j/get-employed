---
name: design-system-audit
description: Audit, document, or extend your design system. Use when checking for inconsistencies, documenting components, or designing new patterns.
---

# Design System

If the project has a design-system source (e.g. `design-system/DESIGN.md`, `tokens.css`, `CHANGES.md`), treat it as the reference for every mode below.

## Audit mode

Scan for:

- Hardcoded color, spacing and type values
- Naming inconsistencies
- Duplicate and near-duplicate components
- Missing states (hover, focus, disabled, loading)
- Accessibility gaps

## Documentation mode

Produce for each component:

- A variants table
- States (default, hover, active, focus, disabled, error, loading)
- Accessibility notes (role, keyboard, screen reader)
- Do / Don't examples

## Extend mode

Design a new pattern that:

- Matches existing tokens
- Composes from existing primitives where possible
- Documents its tradeoffs
