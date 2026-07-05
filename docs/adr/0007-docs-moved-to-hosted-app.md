# Docs moved to the hosted docs app

Component documentation has moved out of `@luke-ui/react` and into the hosted docs app in
`apps/docs`. The hosted docs app is now the primary docs surface. The package README links to it,
and package docs are no longer shipped on npm.

This supersedes [ADR-0003](0003-package-docs-surface.md), which established a separate
package-docs surface, and [ADR-0006](0006-docs-md-structure-standard.md), which standardised the
`.docs.md` prose format.

## Decision

- All component prose lives in `apps/docs/content/docs/**/*.mdx`.
- Component MDX pages are the authoritative docs for app developers and library authors.
- API reference tables are generated from TypeScript types with `fumadocs-typescript`'s
  `remarkAutoTypeTable` plugin.
- Interactive examples live in `apps/docs/src/examples/<component>/` and render through the `<Example>`
  component.
- `llms.txt`, `llms-full.txt`, and `.md` per-page routes are provided by Fumadocs built-ins.
- The `@luke-ui/react` package README links to the hosted docs.
- The package no longer ships generated docs under `packages/@luke-ui/react/docs/` or includes them
  in the npm `files` allowlist.

## Rejected options

We rejected keeping the two-surface split (hosted docs + package docs). Maintaining the package docs
generator, virtual modules, and a separate prose source in `src/<component>/<component>.docs.md`
created duplication and tooling overhead without reaching a meaningfully different audience. The
same readers can use the hosted docs, the `llms.txt` index, and the per-page `.md` routes.

## Consequences

- Prose is co-located with the docs app instead of the component source.
- Component docs no longer need a `.docs.md` file or an `<include>` of generated package docs.
- The `generate:docs` and `check:docs` scripts in `@luke-ui/react` are removed.
- The `@luke-ui/docs-tools` package and package-docs Vite plugins are removed.
- The hosted docs app type-checks and builds the full docs surface.
- ADR-0003 and ADR-0006 are superseded.
