# docs

Documentation app for the Luke UI design system. [DOCUMENTATION.md](../../docs/DOCUMENTATION.md)
owns the content rules, and [Docs app styling](../../docs/STYLING.md#docs-app-styling) owns the
stylesheet rules.

## Commands

Run from the repository root:

```bash
pnpm run dev:docs
pnpm run build:docs
pnpm run check
```

## Architecture

Luke UI components and docs-local Vanilla Extract styles own the visible UI. Fumadocs provides only
MDX compilation, the page tree, search data, and prop extraction. Its one UI import is
`RootProvider`, with search and theme UI disabled. Import no other Fumadocs UI or CSS.

- A module imported by browser code must not import `node:fs` or `node:path`, including through
  `src/lib/`. Such an import can leave an MDX body empty while the page still returns HTTP 200.
- Keep both discovery roots. Fumadocs discovers `content/docs` with `baseUrl: '/'`, so content paths
  and `meta.json` determine routes. `ExampleBlock`, remark validation, source inlining, Knip, and
  scaffolding all know `src/examples/*/*.tsx`. Moving a guide beside its TSX changes URLs and breaks
  example tooling.
- `/sitemap.xml`, `/robots.txt`, and Markdown 404 links use `SITE_URL` and `VITE_BASE_URL`.
  Cloudflare Pages also reads both at request time, so keep those bindings aligned with the build.
- The docs article and each example frame use `isolation: isolate`, so example content cannot paint
  over the sticky header. Leave the header `z-index` alone.

## Ownership

- `src/playground/` owns host policy. Generic compilation and protocol belong to
  `@luke-ui/playground-core`, imported only through its subpaths. Playground depends on
  `src/appearance/` for theme appearance, never the reverse.
- `src/navigation/` owns sidebar preference persistence and consumes search and appearance controls.
- `src/lib/theme-prefs-script.ts` composes the appearance and sidebar pre-hydration setup outside
  both owners. It runs inline before first paint, so keep it aligned with both browser stores.
- Search's browser UI never imports the server content source.
- Copy feedback, links, typography, reference-table styling, URL resolution, and content discovery
  are app infrastructure, because they span several surfaces.

## Playground

- `<ExampleBlock>` offers "Open in playground" only when every import is in
  `docs-playground-specifiers.ts`.
- The page creates one session on mount and calls `resync()` for a preview that announced ready
  before the listener attached.
- The page posts `luke-ui-docs:appearance` on a theme change and from `onPreviewReady`, so the
  preview applies the theme before the replayed code renders.
