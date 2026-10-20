# Reference app

A settings app for [#713](https://github.com/lukebennett88/luke-ui/issues/713) that uses Luke UI
through its public consumer API. The home page at `/` links to Settings, whose layout and controls
follow Linear Settings.

- Preferences saves theme, text size, pointer cursor, and link underlines as they change.
- Profile edits full name, job title, and username inline, with validation and retry on failure.
  Email uses a dialog. Profile pictures accept PNG, JPEG, or WebP images up to 1 MB.
- Security & access clears the profile and preferences saved in this browser after confirmation.

React Router Data Mode owns navigation and route errors. React Aria's `RouterProvider` sends Luke UI
`Link` navigation through React Router. The root route's loader fills the TanStack Query cache
before anything renders, and each mutation writes its result back to that cache. Zod validates
mutation inputs at the API boundary. Settings persist in localStorage. The fake API adds 280 ms of
latency. Tests set latency and fail the next mutation through `settingsApi`.

Luke UI owns layout, typography, links, buttons, text fields, selects, and switches. The settings
rows draw their own labels, so their selects and switches use Luke UI primitives. React Aria
Components supplies menu and dialog behaviour. Vanilla Extract owns the remaining product
presentation, using public theme variables. [`FRICTION.md`](./FRICTION.md) records the remaining
consumer gaps.

The theme source is `src/theme/input.ts`. A small Vite plugin in `vite.config.ts` passes it to
`defineTheme` from `@luke-ui/react/theme/compiler` and serves the result as
`virtual:reference-theme.css`. `index.html` sets the theme's identity class on `<html>`. Vite
restarts the dev server when the theme source changes.

The app imports `@luke-ui/react` from its built `dist`. Turbo builds prerequisites and starts the
package watchers alongside the app. Component and generated-asset edits rebuild automatically. Run
commands from the repository root:

```bash
pnpm run dev:reference-app
pnpm exec turbo run check:types --filter=reference-app
pnpm test:reference-app
pnpm run check
```

Package scripts perform individual operations. Use root commands to resolve their prerequisites:

```bash
pnpm build:reference-app
pnpm check:lint
```

The dev server runs at http://localhost:5174.

Cloudflare Pages deploys the app from the repository root, so it also picks up the docs site's
`functions/` middleware. `public/_routes.json` excludes every path, so that middleware never runs
for the app and Pages serves `dist` as static assets.
