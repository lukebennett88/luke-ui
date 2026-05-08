# Package docs are a separate AI-native surface

`@luke-ui/react` ships its own per-export documentation under `packages/@luke-ui/react/docs/`, generated from JSDoc and authored prose, separate from the hosted Fumadocs site at `apps/docs`.

Two doc surfaces, two audiences. Hosted docs target app developers building UIs; their navigation and content shape are tuned for human discovery. Package docs target anyone reading the package off npm — library authors and coding agents — and document every public export path. Primitives are documented in package docs but listed in a de-emphasised "Library authors" section of `README.md` and `llms.txt`; hosted docs continue to omit primitives entirely (see ADR-0001).

We rejected the hold-the-line option (no primitive docs anywhere) because agents reaching for `text-field/primitive` need its type contract; expecting them to read source only doesn't match the AI-native goal. We rejected a single unified surface because navigation tuned for app developers crowds out library-author content, and tuning the other way clutters the marketing site.

## Consequences

- JSDoc and TypeScript types are authoritative for API tables. Co-located prose sources are renamed `*.docs.mdx` → `*.docs.md` and contain prose only; Props tables are generated from types via `ts-morph`. For atom and composed components, important inherited props from `react-aria-components` are re-declared on the package's own interfaces with full JSDoc so they appear in the local "own props" table; long-tail inherited props are covered by a single "Extends `react-aria-components` `<Component>`" pointer.
- Generated artifacts under `packages/@luke-ui/react/docs/` are committed for GitHub-readable contract and PR-time review. Per-export pages and `llms.txt` are committed; the aggregated `llms-full.md` is built into `dist/docs/` and not committed. `linguist-generated=true` via `.gitattributes` collapses the generated tree in PR diffs. CI fails on stale via `pnpm --filter @luke-ui/react generate:docs && git diff --exit-code`.
- The hosted `apps/docs` site renders the generated package Markdown directly via a small `<RenderMarkdown>` component sharing Fumadocs' remark/rehype stack, so the hosted page and the npm-shipped page are byte-identical. Story-driven interactivity (`<storyClient.WithControl />`) sits above the rendered Markdown in the hosted page, not interleaved.
- Page shape auto-adapts by export shape, not tier. Single-export paths render as a component-style page; multi-export paths render as an enumerated overview. Tier appears as a label and as de-emphasis in the index, not as a separate page template.
- Scope is tiered: full pages for the 17 component-shaped exports, overview pages for `recipes`, `theme`, `tokens`, `utils`, and index-only entries (no dedicated `.md` file) for `stylesheet.css`, `spritesheet.svg`, `package.json`.
- A single `generate:docs` script (in `scripts/generate-docs.ts`, alongside `generate-color-tokens.ts` and `build-icons.ts`) emits both `README.md`'s index and `llms.txt`, with a flag controlling whether the "Library authors" section is included; hosted `apps/docs` calls the same shared builder for its own `/llms.txt` route.
- The package `README.md` is hand-authored; it is the front door, not an enumeration. It pitches, links to `docs/` and `llms.txt`, and is the only docs file the generator does not own.
- The package `LICENSE` is a hand-committed copy of the workspace-root MIT license; sync drift risk is negligible.
- First npm publish is deferred. `version` stays at `0.0.0` until a separate release-engineering initiative; V1 success is verified by `npm pack --dry-run` against the `package.json#files` allowlist `["dist", "docs", "README.md", "LICENSE"]`.
