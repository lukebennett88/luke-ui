# Reference app

A small settings application for [#713](https://github.com/lukebennett88/luke-ui/issues/713), using
Luke UI's public consumer API. Its layout and controls follow Linear Settings.

- Preferences saves theme, text size, pointer cursor, and link underlines as they change.
- Profile edits full name, job title, and username inline, with validation and retry on failure.
  Email uses a dialog. Profile pictures accept PNG, JPEG, or WebP images up to 1 MB.
- Security & access clears the profile and preferences saved in this browser after confirmation.

React Router Data Mode owns navigation and route errors. Its settings loader waits for the TanStack
Query cache, which owns saved settings and mutations. The persistent settings layout applies pending
preference changes while saving. Dialog drafts and image reading stay local to their workflows. Zod
validates mutation inputs at the API boundary. Settings persist in localStorage across navigation
and reload. The fake API adds a fixed 280 ms latency. Tests can set latency and fail the next
mutation through `settingsApi`, without a debug UI.

Luke UI owns layout, typography, buttons, and text fields. React Aria Components supplies select,
switch, menu, and dialog behaviour. Vanilla Extract owns the remaining product presentation, using
public theme variables. [`FRICTION.md`](./FRICTION.md) records the remaining consumer gaps.

Run commands from the repository root:

```bash
pnpm run dev:reference-app
pnpm exec turbo run check:format check:lint check:types --filter=reference-app
TURBO_FORCE=true pnpm exec turbo run test --filter=reference-app
pnpm run check
```

The dev server runs at http://localhost:5174.

The theme source is `src/theme/input.ts`. Turbo generates `src/generated/stylesheet.css` before dev,
build, checks, and tests through Luke UI's public `defineTheme` API. Edit the source rather than the
generated CSS.
