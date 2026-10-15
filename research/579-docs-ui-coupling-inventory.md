# Docs UI coupling inventory for #579

This is the temporary migration ledger for
[#577](https://github.com/lukebennett88/luke-ui/issues/577). Update it when implementation finds
another dependency. [#678](https://github.com/lukebennett88/luke-ui/issues/678) deletes it after
verifying the actual #577 end state. The original research snapshot was `origin/main` at `9cb67c9d`
on 26 September 2026. The #672 implementation updates below reflect `origin/main` at `8db0b4e7` on
27 September 2026.

## Decision and evidence

Contain Fumadocs as a content, MDX, search-data, and generation provider. Own the rendered shell and
content UI in the docs app, using Luke UI's public components, primitives, recipes,
`@luke-ui/react/styles`, theme vars, and docs-local Vanilla Extract `.css.ts`. Replace Fumadocs as a
framework only if this containment cannot reach #577. No current evidence requires full replacement.
Docs Vanilla Extract integration is an app-level decision independent of Luke UI styling-engine
portability.

#669 added the docs app's Vanilla Extract dependency and Vite/Vitest plugins. #672 uses the root
body class to set the page layout and replaces the unused `--docs-text-color` smoke rule. Tailwind
and Fumadocs styles remain for later consumer migrations.

The migration aims at Luke UI's visual language. **Visual parity with the existing Fumadocs/Tailwind
UI is not a goal.** Preserve useful behaviour, information architecture, semantics, accessibility,
and interaction contracts. Do not import `packages/@luke-ui/react/src/...` into docs runtime UI. A
missing public seam should be recorded as an extension API gap before using a monorepo-only
shortcut.

Static evidence: `rg` over `apps/docs` imports, `className`, `fd-`, CSS, package/configuration, MDX,
playground scripts, and Luke UI exports; review of route, component, generator, and protocol code. A
root `pnpm run build` generated the package and docs outputs. The app was then inspected at
`localhost:3000` with browser snapshots and temporary screenshots, which are not committed.
Inspected states include home, installation, styling, Button guide and API props, token reference,
icon gallery and its empty filter, desktop and mobile navigation, search open/results, mobile theme
popover, example frame, playground loading/ready/error, mobile viewport, fullscreen, light/dark, a
temporary RTL view, and 404. Desktop screenshots show the Fumadocs notebook sidebar/TOC and code
blocks alongside Luke UI controls; the mobile drawer is a Fumadocs overlay. The playground showed a
real Monaco editor and iframe preview after its skeleton. The follow-up issues cover individual MDX
pages and keyboard transitions not visually exercised here.

Classification key: **Existing** = public Luke UI component/primitive or supported extension seam;
**Component gap** = reusable Luke UI component justified by the docs use cases; **Extension gap** =
a needed public styling/composition seam; **Local UI** = docs-owned component styled with Luke UI
and `.css.ts`; **Structure** = docs-local layout CSS. A concern can use an existing component while
its surrounding frame remains local UI or structure. No confirmed extension API gap was found in the
current source: `@luke-ui/react/styles`, `theme`, recipes, primitives, and utilities appear
sufficient. Implementation must record a concrete gap if that proves false. Code block display is
docs-local UI (#670), not a Luke UI component gap: build a docs-owned CodeBlock in `apps/docs` with
Vanilla Extract `.css.ts` and public Luke UI tokens/controls. Keep syntax highlighting with Shiki in
the docs app (existing highlight plugin / pipeline); do not put Shiki inside `@luke-ui/react`.
Inline `@luke-ui/react/code` remains the design-system code primitive. The `#recipe-engine` Vite
alias points into package internals but has no consumer found by `rg`; #678 must verify and remove
it if still dead.

## Visible and structural inventory

Each row names its current owner, Fumadocs dependency, Tailwind dependency, CSS/token dependency,
role, classification, direction, prerequisite, and owning follow-up. `fd-*` means Fumadocs
colour/layout variables consumed by Tailwind classes or Fumadocs CSS.

| Surface / concern                             | Current owner                                                                                                                              | Fumadocs                                                     | Tailwind                                                                               | CSS / tokens                                                                                              | Role and state                                                        | Class                           | Direction                                                                                                   | Prerequisite           | Issue      |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------ | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------- | ---------------------- | ---------- |
| Root document and providers                   | `src/routes/__root.tsx`, `src/components/theme-controls.tsx`, `src/styles/docs-root.css.ts`                                                | `RootProvider` context; search and theme UI disabled         | none in root document/layout                                                           | `app.css` still imports Fumadocs CSS and Tailwind pending later consumers; Luke UI theme/spritesheet URLs | SSR/hydration, colour mode, theme identity, spritesheet, local search | Existing + Structure            | Keep Luke UI theme/spritesheet and local providers; remove global styling imports after consumer migrations | #669                   | #672, #677 |
| Global styling and cascade                    | `src/styles/app.css`, Vite/Vitest configs, package                                                                                         | Fumadocs neutral/preset CSS                                  | `tailwindcss` import, Vite plugins and packages                                        | `@layer`, `--color-fd-*` to `--luke-*` bridge, `#nd-*` overrides                                          | Generated utility CSS and Fumadocs visual rules power most docs UI    | Structure                       | Move authored rules to `.css.ts`, replace Fumadocs rules, then remove CSS imports and build integration     | #669 and all consumers | #677, #678 |
| Site header and global links                  | `src/components/site-nav.tsx`, `site-nav.css.ts`, `docs-site-nav.tsx`, `docs-shell.css.ts`, `lib/site-destinations.ts`                     | none in visible header; route-native links                   | none in header; root build still includes Tailwind for remaining consumers             | Luke UI tokens in local `.css.ts`                                                                         | Active destination, repository link, mobile theme/search controls     | Local UI + Structure            | Header and triggers use docs-local styling; retain route/tree data through adapter                          | #669                   | #672       |
| Desktop docs navigation                       | `src/components/docs-shell.tsx`, `docs-shell.css.ts`, `docs-nav.tsx`, `src/lib/source.ts`                                                  | none; `DocsLayout` and the adapter are removed               | none in desktop navigation; root build still includes Tailwind for remaining consumers | Docs-local `.css.ts`, Luke UI tokens                                                                      | Group labels, active item, sticky sidebar                             | Local UI + Structure            | Render page tree and sidebar locally (done in #672; the adapter went with #673)                             | #669                   | #672       |
| Mobile docs drawer                            | `src/components/docs-site-nav.tsx`, `docs-nav.tsx`, `docs-shell.css.ts`                                                                    | none in visible drawer                                       | none in drawer; root build still includes Tailwind for remaining consumers             | Docs-local `.css.ts` and Luke UI tokens                                                                   | Drawer, backdrop, close, route links, focus                           | Local UI                        | Own drawer and navigation semantics locally                                                                 | #669                   | #672       |
| Search trigger and dialog                     | `src/components/site-nav.tsx`, `search.tsx`, `search-dialog.tsx`, `search.css.ts`, `routes/__root.tsx`                                     | `fumadocs-core/search` client only                           | none in trigger/dialog; root build still includes Tailwind for remaining consumers     | Docs-local `.css.ts` and Luke UI tokens                                                                   | Shortcut, modal, query, result/empty/loading, focus return            | Local UI                        | Own visible search dialog; retain core index/query data                                                     | #669                   | #672       |
| Theme popover and choice controls             | `src/components/site-nav.tsx`, `theme-controls.tsx`, `site-nav.css.ts`, `theme-controls.css.ts`, `playground/icon-toggle-button-group.tsx` | none in visible controls; root context retained              | none                                                                                   | Luke UI `buttonRecipe`, root theme, docs-local `.css.ts`                                                  | Tactile/Paper and light/dark/system; portal needs theme root          | Existing + Local UI             | Local popover and theme wrapper; shared toggle group uses docs `.css.ts` (done in #676)                     | #669                   | #672, #676 |
| Home and 404                                  | `src/routes/index.tsx`, `src/components/{home-hero,home-features,not-found}.tsx` (+ `home-features.css.ts`)                                | none; home install uses docs CodeBlock (#670)                | none                                                                                   | Luke UI layout props; feature-cell hairline in docs `.css.ts`                                             | Marketing hero, install command, feature grid, error navigation       | Existing + Local UI + Structure | Own page layout with Luke UI props (done in #675)                                                           | #669, #670             | #675       |
| Docs article layout and chrome                | `src/routes/$.tsx`, `src/components/docs-article/`                                                                                         | `useFumadocsLoader` and page-tree types only                 | none                                                                                   | Docs-local `.css.ts` (`docs-article.css.ts`, `block-link.css.ts`), Luke UI tokens                         | Title, description, actions, article, TOC, previous/next              | Local UI + Structure            | Own article/TOC/page chrome; keep source loader and tree (done in #673)                                     | #672                   | #673       |
| Page actions                                  | `src/components/page-actions.tsx`, `page-actions.css.ts`, `lib/use-copy-button.ts`                                                         | none; the copy hook is local                                 | none                                                                                   | Luke UI Button/Link/Icon, docs-local `.css.ts`                                                            | Source, Markdown, edit links and copy feedback                        | Existing + Structure            | Luke UI controls with layout in `.css.ts` (done in #673)                                                    | #669, #673             | #673, #678 |
| MDX prose and native elements                 | `src/routes/$.tsx`, `components/docs-article/mdx-elements.tsx`, `source.config.ts`, `content/docs/**/*.mdx`                                | none; `fumadocs-ui/mdx` is no longer imported                | none                                                                                   | Luke UI Prose, Heading, Text, Link, Code, Blockquote, ScrollFade; `mdx-elements.css.ts`                   | Paragraphs, lists, links, tables, headings, anchors; fences via #670  | Existing + Local UI             | #670 maps fences to docs CodeBlock; #673 replaced the rest of the MDX map (done)                            | #670, #672             | #673       |
| MDX custom content UI                         | `content/docs/**/*.mdx`, `components/docs-article/mdx-elements.tsx`                                                                        | none                                                         | none                                                                                   | `mdx-elements.css.ts`, `block-link.css.ts`                                                                | Cross-links, content cards, heading anchor copy                       | Local UI                        | Docs-local renderers in `.css.ts`, same semantics (done in #673)                                            | #673                   | #673       |
| Code block display                            | `apps/docs/src/components/code-block/` (+ home, source, example, MDX `pre`)                                                                | none (done via #670)                                         | residual frame classes outside CodeBlock only                                          | Luke UI tokens via `.css.ts`; Shiki theme properties                                                      | Title/copy, syntax display, horizontal overflow, loading              | Local UI                        | Done (#670): docs CodeBlock owns fences and samples; Shiki stays in the docs highlight pipeline             | #669                   | #670       |
| Generated API/props tables                    | `component-props-table.tsx`, `type-table.tsx`, `routes/$.tsx`, `source.config.ts`                                                          | typescript generator only; local `TypeTable`                 | none                                                                                   | native `<table>` + docs `.css.ts` (CQ/interaction); RAC Button disclosure                                 | Generated prop descriptions and expandable groups                     | Existing + Local UI             | Keep generator/type nodes; own table/disclosure UI (done in #674)                                           | #673                   | #674       |
| Icon gallery, token explorer, component index | `src/components/{icon-gallery,token-explorer,components-index}.tsx` (+ `.css.ts`)                                                          | none                                                         | none                                                                                   | Luke UI layout + inputs; native token `<table>`; docs `.css.ts` for borders/CQ                            | Responsive cards/tables, filtering, copy, empty states                | Existing + Local UI             | Own widgets with layout primitives and public Luke UI seams (done in #674); shared toggle cleaned in #676   | #673                   | #674       |
| Example frame and StoryWrapper                | `example-block.tsx`, `example-preview.tsx`, `example-code-preview.tsx` (+ `.css.ts`), `lib/story-wrapper.tsx`, `src/examples/**`           | none; source panel uses docs CodeBlock (#670)                | none                                                                                   | Luke UI `Box` / controls; docs `.css.ts` for frame, resize CQ, code expand                                | Live examples, code toggle, resize grip, loading/error, canvas        | Existing + Local UI + Structure | Frame and preview chrome in `.css.ts`; keep StoryWrapper and examples (done in #675)                        | #670, #673             | #675       |
| Playground host and split panels              | `routes/playground/index.tsx`, `components/playground/{pane-toolbar,preview-toolbar,viewport-toggle,playground.css.ts}.tsx`                | global site header/search only                               | none                                                                                   | Docs `.css.ts`, Luke UI tokens; Monaco surface literals; kernel in `@luke-ui/playground-core` (#671)      | Editor/preview split, viewport/fullscreen, errors, iframe cover       | Local UI + Structure            | Own host styles with `.css.ts` and Luke UI controls (done in #676)                                          | #669, #671, #672       | #676       |
| Playground editor and skeleton                | `components/playground/{editor,editor-skeleton,editor-skeleton-script,monaco-format}.ts*`, `lib/monaco-setup.ts`                           | none                                                         | none                                                                                   | Monaco CSS/themes; docs `.css.ts` for shell/skeleton/pill; format/hash in `@luke-ui/playground-core`      | Monaco completion/format, pre-hydration skeleton, loading             | Local UI + Structure            | Keep Monaco; host/skeleton styles in `.css.ts` (done in #676)                                               | #669, #671             | #676       |
| Playground preview runtime                    | `routes/playground/preview.tsx`, `components/playground/preview-runner.tsx`, `lib/story-wrapper.tsx`                                       | root provider reaches preview route, no direct visual import | none                                                                                   | Docs `.css.ts` runner shell; Luke UI root/theme; compile in `@luke-ui/playground-core/compiler`           | Compiled component, error boundary, preview theme                     | Existing + Structure            | Keep real Luke UI canvas; core compile extracted, host retains runner shell (done in #676)                  | #671                   | #676       |
| Responsive, RTL, focus, light/dark            | all above                                                                                                                                  | retained non-visual Fumadocs only                            | none in docs UI sources; build still emits Tailwind until #677/#678                    | Luke UI theme tokens; docs `@container` queries                                                           | Cross-cutting behavioural and visual states                           | Local UI + Structure            | Verify state matrix in each consumer PR; use logical properties                                             | #669                   | #672–#678  |

The current MDX corpus has no callout use. There is no presentational Tailwind in `src/examples/**`
or `src/samples/**`: their rendered UI is intentional Luke UI demonstration content. The single
`@import 'tailwindcss'` in `content/docs/docs/styling.mdx` is a deliberate _displayed code example_
about using Box with Tailwind. Keep it if the example remains useful; it does not justify a docs-app
Tailwind dependency.

## #672 implementation update

The docs shell, desktop docs navigation, mobile drawer, site header, search dialog, and theme
wrapper now have docs-local renderers and `.css.ts` styling. Theme controls consume the shared
playground toggle group (utility-free after #676). The docs route's notebook adapter was removed in
#673. The root `RootProvider` stays for non-visual framework context, with Fumadocs search and theme
UI disabled. The core search index/query, source loader, and page-tree data remain intentionally.

## Retained non-visual Fumadocs inventory

| Dependency                                                           | Files                                                                                                               | Role                                                         | Outcome                                                                                        |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| `fumadocs-mdx` config/plugin/generated `.source`                     | `source.config.ts`, `vite.config.ts`, package scripts, `src/routes/$.tsx` browser collection                        | Content sourcing, MDX compilation, browser module loading    | Retain behind source/MDX adapter; #673 changes rendered components only.                       |
| `fumadocs-core/source`, schema, loader and page tree                 | `source.config.ts`, `src/lib/source.ts`, `src/routes/$.tsx`                                                         | Metadata, tree, page lookup and serialization                | Retain; #672 and #673 consume the data without Fumadocs UI.                                    |
| `fumadocs-core/search` client/server and `zbsearch`                  | `src/components/search-dialog.tsx`, `src/routes/api/search.ts`                                                      | Static search index/query                                    | Retain data/search logic behind #672's local dialog.                                           |
| `fumadocs-typescript` and `remarkAutoTypeTable`                      | `source.config.ts` (distinct attachers per tag), `src/lib/create-component-props-generator.ts`, generated `.source` | Extract public prop/type data                                | Retain; #674 replaces visual tables. Unified merges same-fn plugins, so wrappers are required. |
| `fumadocs-core/framework` via `RootProvider` and `useFumadocsLoader` | `routes/__root.tsx`, `routes/$.tsx`                                                                                 | Routing integration for the type table and loader data       | Retain. The local pathname provider is removed. Docs links use TanStack Router directly.       |
| `fumadocs-core/page-tree` (`findPath`, `flattenTree`)                | `components/docs-article/docs-pager.tsx`, `components/docs-nav.tsx`                                                 | Previous/next ordering within a root section, and tree types | Retain. Headless, no visual output.                                                            |
| `fumadocs-core/toc` (`AnchorProvider`, `useActiveAnchor`)            | `components/docs-article/docs-article.tsx`, `docs-toc.tsx`                                                          | Active-heading tracking for the table of contents            | Retain. Headless, no CSS. Replace with a local observer only if the package goes.              |
| `lucideIconsPlugin`                                                  | `src/lib/source.ts`                                                                                                 | Page-tree icon metadata                                      | Retain or map to local icons if needed for local docs navigation; #672 owns the decision.      |

`fumadocs-ui` remains for `RootProvider` (non-visual framework context) and the stylesheet imports
pending #677/#678. Every docs visual consumer (#672–#676) no longer imports its visual components or
uses `--color-fd-*` / Tailwind utilities in source. The stylesheet imports, the unused
`--color-fd-*` bridge, and the `fumadocs-ui > lucide-react` prebundle entry must be removed or
explained by #677/#678. The local `use-copy-button.ts` already has no Fumadocs runtime import; its
source-provenance comment is a cleanup candidate, not active visual coupling.

## #673 implementation update

`DocsArticle` (`components/docs-article/`) replaces the Fumadocs notebook page. It renders the title
block, `Prose` body, previous/next pager, a sticky table of contents column, and a `<details>`
disclosure below the table of contents breakpoint, into the `toc-bar`, `main`, and `toc` areas of
`DocsShell`. The notebook rendered no breadcrumb on the baseline pages, so none is added.
`fumadocs-layout-adapter.tsx`, `docs-tree-pathname-provider.tsx`, and the `--fd-docs-row-*` shell
variables are removed. The `#docs-shell article` rules left `app.css`.

The MDX map in `routes/$.tsx` now uses Luke UI and local renderers for `a`, `h1`-`h6`, `p`, `code`,
`pre`, `img`, `table`, `blockquote`, `em`, `strong`, `Cards`, and `Card`. `TypeTable`,
`ComponentPropsTable`, `ExampleBlock`, `SourceCodeBlock`, and `IconGallery` stay mapped as they
were. Inline `code` renders through Luke UI `Code` and a fence's `<code>` child stays plain, because
the `pre` mapping provides a flag that `MdxCode` reads. Widgets that carry Tailwind utilities keep
winning over `Prose` rules through layer order. Widgets without them can pick up `Prose` rhythm and
are #674/#675's to restyle.

## #674 implementation update

Local `TypeTable` (`components/type-table.tsx`) replaces `fumadocs-ui/components/type-table`. It
keeps the generated `TypeNode` contract from `fumadocs-typescript` / `remarkAutoTypeTable` and
renders a semantic Name | Type | Default `<table>` in the style of React Aria's prop tables. Each
prop is a data row with its description in a second row, deprecated names are struck through,
required props get an asterisk only when the table mixes required and optional, and the Default
column appears only when some prop has a default. Below 30rem of container inline size the header
hides and the cells stack. `ComponentPropsTable` renders one table per type: the "Component props"
group is the first body with no header, and each other group is its own body behind a disclosure row
whose rows render only while expanded. A URL hash that targets a prop in a collapsed group expands
it. Type links sit in the type cell. Optional props lose their redundant `| undefined` in the
generator wrappers. Token explorer purpose groups use React Aria `Disclosure` via Box `renderRoot`,
with a `Cluster` trigger (chevron, `Text` title, `Text` count) and `Stack` spacing. Token explorer
tables use the same docs-local `reference-table` module as the props tables (`TableBox`, `CellText`,
frame, header cells, rules, and the stacked narrow layout), so each group is a native `<table>` (Box
cannot render `th`/`td`) in the props table's bordered frame. Paths and variables are plain
monospace `Text`, not `Code` chips. Decorative samples use `aria-hidden` on the sample content, not
the cell, and their static parts are Box props; only the token's own `var()` values stay inline.
Descriptions render in a `div`, so MDX paragraphs never nest inside a paragraph.

The shared table styling lives in `reference-table.tsx` and `reference-table.css.ts`, used by the
props tables and the token explorer. The props table's styling lives on Luke UI primitives: `Box`
through `renderRoot` for the table elements (padding, border, radius, surface fills), `Text` for
every piece of text at the `label` type style, `Stack` and `Cluster` for descriptions, parameter
lists, the name and required marker, and the group trigger. The remaining docs `.css.ts` rules each
carry a `DS gap:` comment naming the missing capability: container queries, table layout, per-side
borders, vertical alignment, scroll margin, a code font without a chip, and nested-code and
paragraph flattening. The token explorer adds only the motion sample's keyframes with reduced
motion, and the disclosure trigger reset (Luke `Button` has no plain variant) with the chevron's
`aria-expanded` rotation.

`IconGallery`, `TokenExplorer`, and `ComponentsIndex` no longer use Tailwind utilities or `fd-*`
tokens. Filtering, counts, copy feedback, empty states, disclosure semantics, and table headers
remain. The shared playground toggle groups are utility-free after #676. #674 did not need a new
public Luke UI export: Luke UI Button/TextInputField/Icon/Text/Box layout cover the controls, and
docs continue to use RAC Disclosure / native `<details>` for collapsible regions (same pattern as
the #673 TOC bar).

## #675 implementation update

Example frames, source panels, home, and 404 no longer use Tailwind utilities or Fumadocs visual
imports. Layout that Luke UI can express stays on primitives (`Grid` `alignItems`, `Stack`
`paddingBlockStart`, `Box` positioning and `maxInlineSize`). Docs `.css.ts` keeps only what the
design system cannot express cleanly: concentric frame radii and isolation, feature-cell
`borderBlockStart`, resize container queries and grip interaction selectors, and code-collapse
animation. Source panels and the home install command use the docs `CodeBlock` from #670; Shiki
still highlights through `highlight-source-plugin`. `StoryWrapper` remains the live Luke UI example
canvas. `not-prose` stays on widgets that sit inside `Prose`. Playground host utilities and
`use-is-desktop.ts` remain for #676.

## #676 implementation update

The playground host no longer uses Tailwind utilities or Fumadocs visual colour tokens. Host chrome
lives in `playground.css.ts` and `icon-toggle-button-group.css.ts`: panel group orientation via root
`@container` (with `!important` so CSS wins over a stale `react-resizable-panels` orientation),
separator thumb, toolbars, compile error, preview frame/iframe pointer lock, loading overlays, and
Monaco-matched editor/skeleton colours. `useIsDesktop` now observes `documentElement.clientWidth`
against `breakpoints.bp768` so JS orientation agrees with the container query. Shared theme and
viewport toggles keep `buttonRecipe` and drop utility `className`s. Monaco, the playground-core
protocol/hash/format/compile path, share hashes, and StoryWrapper are unchanged. Global Tailwind and
Fumadocs CSS imports remain for #677/#678 cleanup; the `--color-fd-*` bridge has no docs-owned
consumers left.

## Playground extraction boundary

The **host-independent core landed in #671** as the private workspace package
`packages/@luke-ui/playground-core` (`@luke-ui/playground-core`). It has no root barrel. Its browser
subpaths are `./compiler` (sucrase compile against a host scope), `./protocol` (code and result
messages, origin/source trust checks, page session with an `onPreviewReady` hook), `./hash` (code
hash with optional host params), `./format` (lazy Prettier with host style options), and
`./specifiers` (base React specifiers, generic `exports`-map specifiers, import allowlist check).
`./generate` is Node-only: scope-module rendering and the Monaco type-map builder. Nothing in core
names Luke UI. Docs remains the first host: `docs-playground-specifiers.ts` names `@luke-ui/react`
and adds third-party/`#docs` extras, `docs-playground-hash.ts` adds the skeleton `shape` param,
`playground-format.ts` holds the Prettier style, `playground-appearance-message.ts` defines the
theme message, and `generate-playground-types.ts` keeps the repo paths and type-package allowlist.
Scope generation currently emits 51 runtime modules; types generation emits ~1,220 virtual files
(~3.4 MB raw). `vite.config.ts`'s `optimizeDeps` list is separate runtime prebundling, not type
generation.

The docs host retains routes, Monaco editor/theme, site theme controls, StoryWrapper, preview
iframe, resize panels, toolbar, loading UI, and `.css.ts` styling. The core `playground:ready`,
`playground:code`, `playground:success`, and `playground:error` messages, the docs
`luke-ui-docs:appearance` message, origin/source checks, initial URL hash, and the missed-ready
retry are behaviour contracts. #671 extracted the kernel; #676 migrates the host presentation. The
package is private and unpublished.

## Ordered follow-up graph

| Order | Issue                                                       | Purpose                                              | Blocked by       | Blocks                             |
| ----- | ----------------------------------------------------------- | ---------------------------------------------------- | ---------------- | ---------------------------------- |
| 1     | [#669](https://github.com/lukebennett88/luke-ui/issues/669) | Docs Vanilla Extract setup                           | —                | #672, #673, #674, #675, #676, #678 |
| 2     | [#670](https://github.com/lukebennett88/luke-ui/issues/670) | Docs-local CodeBlock (Shiki in docs)                 | —                | #673, #675, #678                   |
| 3     | [#671](https://github.com/lukebennett88/luke-ui/issues/671) | Private playground core (`@luke-ui/playground-core`) | —                | #676, #678                         |
| 4     | [#672](https://github.com/lukebennett88/luke-ui/issues/672) | Local docs shell/navigation/search                   | #669             | #673, #676, #677, #678             |
| 5     | [#673](https://github.com/lukebennett88/luke-ui/issues/673) | Local article and MDX presentation                   | #669, #670, #672 | #674, #675, #677, #678             |
| 6     | [#674](https://github.com/lukebennett88/luke-ui/issues/674) | Local data widgets                                   | #669, #673       | #677, #678                         |
| 7     | [#675](https://github.com/lukebennett88/luke-ui/issues/675) | Examples, source, home and 404                       | #669, #670, #673 | #677, #678                         |
| 8     | [#676](https://github.com/lukebennett88/luke-ui/issues/676) | Playground host presentation                         | #669, #671, #672 | #677, #678                         |
| 9     | [#677](https://github.com/lukebennett88/luke-ui/issues/677) | Remove remaining visual dependencies                 | #672–#676        | #678                               |
| 10    | [#678](https://github.com/lukebennett88/luke-ui/issues/678) | Terminal cleanup and #577 verification               | #669–#677        | Close #577                         |

The graph ends in no docs-owned Tailwind styling: #669 makes `.css.ts` available, #670 adds a
docs-local CodeBlock that replaces Fumadocs `CodeBlock`/`Pre` (Shiki stays in the docs app; no
public Luke UI CodeBlock), #672–#676 replace every visual consumer, #677 reconciles/removes
remaining CSS and utility use, and #678 deletes build/package/configuration residue and this ledger.
Fumadocs content, MDX, search data and type generation can stay behind adapters. If implementation
discovers another coupling, update this ledger and the affected issues rather than treating this
snapshot as a scope limit.

## Mechanical reconciliation

This table assigns every discovered active visual source group exactly one migration outcome. Search
the listed patterns again in #677 and #678. Generated CSS is an output of the listed
source/configuration, not a separate feature to preserve.

| Dependency group and current matches                                                                                                                                              | Outcome                                                                                                    | Issue                      |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | -------------------------- |
| `fumadocs-ui/provider/tanstack`, `components/dialog/search` type, `components/ui/popover`, search trigger slots, notebook sidebar trigger, notebook layout and shared layout type | Local UI replaces visible shell/search; the notebook context and adapter are removed, `RootProvider` stays | #672                       |
| Notebook page components and `fumadocs-ui/mdx`; MDX Cards/Card, headings, prose, tables, anchors, TOC (not code fences) (done in #673)                                            | Replace visual renderers; retain content/MDX data                                                          | #673                       |
| `fumadocs-ui/components/type-table` and `components/ui/collapsible`                                                                                                               | Replaced by local `TypeTable` and a native table; retain generated type data (done in #674)                | #674                       |
| `fumadocs-ui/components/codeblock` / `Pre` in home, examples, source block, and MDX fences                                                                                        | Replaced by docs-local CodeBlock (#670); Shiki stays in the docs highlight pipeline                        | #670                       |
| `fumadocs-ui/css/neutral.css`, `css/preset.css`, `--color-fd-*`, `#nd-*`, `--fd-*`, `text-fd-*`, `bg-fd-*`, `border-fd-*`                                                         | Remove when visual consumers are replaced                                                                  | #672–#677                  |
| Tailwind `className` utility strings in `routes/{__root,index,$,playground/index}.tsx`                                                                                            | All route host utilities replaced (#672/#673/#675/#676)                                                    | #672, #673, #675, #676     |
| Tailwind utilities in `components/{site-nav,docs-site-nav,theme-controls}.tsx`                                                                                                    | Replaced by local `.css.ts` in #672; shared toggle group cleaned in #676                                   | #672, #676                 |
| Tailwind utilities in `components/{home-hero,home-features,not-found,page-actions,example-block,source-code-block}.tsx`                                                           | Replaced with docs `.css.ts` / Luke UI props (done in #673/#675)                                           | #673, #675                 |
| Tailwind utilities in `components/{component-props-table,components-index,icon-gallery,token-explorer}.tsx`                                                                       | Replaced with docs `.css.ts` (done in #674); shared toggle cleaned in #676                                 | #674                       |
| Tailwind utilities in `components/playground/{editor-skeleton,editor,icon-toggle-button-group,pane-toolbar,preview-runner,preview-toolbar}.tsx`                                   | Replaced with docs `.css.ts` (done in #676)                                                                | #676                       |
| Tailwind `@import`, generated CSS, `@tailwindcss/vite` in Vite/Vitest, `tailwindcss` and `@tailwindcss/vite` packages                                                             | Remove after consumers migrate; terminal issue owns dead build/package/config cleanup                      | #677, #678                 |
| `fumadocs-ui > lucide-react` prebundle entry and unused internal `#recipe-engine` Vite alias                                                                                      | Verify need and remove dead integration                                                                    | #678                       |
| `fumadocs-core`, `fumadocs-mdx`, `fumadocs-typescript`, `.source`, core search, source tree, Markdown/LLM output                                                                  | Intentionally retain non-visual infrastructure                                                             | #672–#674 adapter boundary |
| `content/docs/docs/styling.mdx` Tailwind import shown as code; real Luke UI component examples under `src/examples/**` and source samples under `src/samples/**`                  | Intentional teaching/example content, not docs UI styling                                                  | Retain; verify #678        |

Reconciliation commands for follow-ups:
`rg -n 'fumadocs-ui|@tailwindcss|tailwindcss|fd-|#nd-' apps/docs`,
`rg -l 'className=|className:' apps/docs/src --glob '!*.test.*'`, inspect
`apps/docs/dist/client/assets/*.css` after build, and compare any residual match to one row above.
Do not count generated `.source`, build outputs, or displayed MDX code as active styling without
tracing the owner. #678 owns the final absence check and the decision to close #577.

## Container queries in docs-owned styles

Docs-owned size queries use `@container` against the root container that the Luke UI theme
stylesheet declares on `:where(:root)`. The conditions live in
`apps/docs/src/lib/docs-container-queries.ts`. Environmental queries (`prefers-reduced-motion`,
`forced-colors`, `hover: none`) stay `@media`. Playground panel orientation and separator thumb
sizing use the root `@container` via `docsTabletMinInlineSize`; `useIsDesktop` reads the same
`clientWidth` threshold. Example preview resize already uses a named card `@container`. #674's
type-table column breakpoint already uses a named `@container` so shell queries keep resolving
against `:root`.
