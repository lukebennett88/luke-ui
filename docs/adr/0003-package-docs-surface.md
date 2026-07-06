# Package docs are a separate AI-native surface

> **Superseded by [ADR-0007](0007-docs-moved-to-hosted-app.md).** Package docs are no longer shipped
> on npm. The hosted docs app is the primary docs surface.

`@luke-ui/react` ships per-export documentation under `packages/@luke-ui/react/docs/`. Those docs
are generated from JSDoc, TypeScript types, and authored prose. They are separate from the hosted
Fumadocs site in `apps/docs`.

## Decision

Luke UI has two docs surfaces:

- **Hosted docs** target app developers building UIs. Their navigation and page shape are tuned for
  human discovery.
- **Package docs** target anyone reading the package off npm, including library authors and coding
  agents. They document every public export path.

Primitives are documented in package docs, but listed in a de-emphasised "Library authors" section
in `README.md` and `llms.txt`. Hosted docs continue to omit primitives.

## Rejected options

We rejected documenting no primitives anywhere. Agents and library authors who reach for
`text-field/primitive` need the type contract without reverse engineering source.

We rejected one unified docs surface. Navigation tuned for app developers crowds out library-author
content. Navigation tuned for library authors clutters the hosted site.

## Consequences

- JSDoc and TypeScript types are authoritative for API tables.
- Co-located prose sources are `*.docs.md` files. They contain prose only.
- Prop tables are generated from types with `ts-morph`.
- Atom and composed component interfaces should re-declare important inherited
  `react-aria-components` props with full JSDoc. Long-tail inherited props are covered by a single
  "Extends `react-aria-components` `<Component>`" pointer.
- Generated files under `packages/@luke-ui/react/docs/` are not committed. They are produced by
  `pnpm --filter @luke-ui/react generate:docs`, or by `turbo generate`.
- `dist/docs/llms-full.md` is built output and is not committed.
- CI validates that the generator runs. It does not compare generated files to a committed snapshot.
- Hosted docs embed generated package docs into component MDX pages with Fumadocs `<include>`.
  Story-driven interactivity sits above the included Markdown.
- `source.config.ts` strips leading generated titles from included Markdown so the hosted page does
  not duplicate its frontmatter title.
- Page shape follows export shape, not tier. Single-export paths render component-style pages.
  Multi-export paths render overview pages.
- Tier appears as index labelling, not as a separate page template.
- Full pages cover component-shaped exports. Overview pages cover `recipes`, `theme`, `tokens`, and
  `utils`.
- `stylesheet.css`, `spritesheet.svg`, and `package.json` are index-only entries.
- A single `generate:docs` script emits the package README index and `llms.txt`. The hosted app
  calls the same shared builder for its `/llms.txt` route.
- The package `README.md` is hand-authored. It is the front door, not a generated enumeration.
- The package `LICENSE` is a hand-committed copy of the workspace MIT license.
- First npm publish is deferred. `version` stays at `0.0.0` until a separate release-engineering
  initiative. V1 package readiness is verified with `npm pack --dry-run` against the
  `package.json#files` allowlist: `["dist", "docs", "README.md", "LICENSE"]`.
