---
description: Run a full UI/UX audit (a11y, performance, lint, visual tests) and fix issues
allowed-tools: Bash, Read, Edit, Write
---

Run a full UI/UX audit of `apps/app`. Steps:

1. Start the app in the background with `pnpm --filter @ge/app dev` (port 4000) and wait for
   `http://localhost:4000/api/health`. Use $ARGUMENTS as the base URL if given.
   Audit these public pages: `/`, `/privacy`, `/terms`, `/signin`, `/dev/components`.
2. Don't add packages to package.json. Run the one-off tools with `pnpm dlx`
   (pa11y, @axe-core/cli, lighthouse). Use the repo's own ESLint and Prettier.
3. Run these checks and capture the output:
   - `pnpm format:check`
   - `pnpm --filter @ge/app lint`, plus a one-off run with eslint-plugin-jsx-a11y's recommended
     rules (pass them on the command line or in a temporary config; don't commit it)
   - `pnpm --filter @ge/ui test` (includes design-rules.test.ts: no raw colours or px font sizes)
   - Stylelint only on `apps/app/src/app/globals.css` and `packages/ui/src/theme.css`, and only
     if it can understand Tailwind v4 at-rules (`@theme`, `@custom-variant`, `@utility`).
     Otherwise skip it and say why.
   - `pa11y`, `axe` and `lighthouse --output=json --chrome-flags="--headless"` against each page.
     Write the reports to the scratchpad, not the repo.
   - `pnpm --filter @ge/app test:e2e` only if `DATABASE_URL` points at localhost (Docker).
     The suite writes data, so never run it against a hosted database. Say when you skip it.
4. Auto-fix what is safe: `pnpm format`, `eslint --fix`.
5. Fix accessibility, performance and responsive issues in the code (alt text, labels, aria,
   heading order, image sizes). Use tokens from `packages/ui/src/theme.css` only.
6. Re-run the checks that failed to confirm the fixes.
7. Stop the dev server. Give a summary table: check, status before, status after, and the issues
   that need my decision.

Don't edit `prototype/`. Don't delete files or change design intent (colours, tokens, layout,
copy) without asking. A contrast failure that comes from a token value is a decision for me,
not a fix.
