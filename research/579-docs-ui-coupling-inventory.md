# Docs UI coupling inventory for #579

This is the temporary migration ledger for
[#577](https://github.com/lukebennett88/luke-ui/issues/577). Update it when implementation finds
another dependency. [#678](https://github.com/lukebennett88/luke-ui/issues/678) deletes it after
verifying the actual #577 end state. The source snapshot is `origin/main` at `9cb67c9d` on 26
September 2026.

## Decision and evidence

Contain Fumadocs as a content, MDX, search-data, and generation provider. Own the rendered shell and
content UI in the docs app, using Luke UI's public components, primitives, recipes,
`@luke-ui/react/styles`, theme vars, and docs-local Vanilla Extract `.css.ts`. Replace Fumadocs as a
framework only if this containment cannot reach #577. No current evidence requires full replacement.
Docs Vanilla Extract integration is an app-level decision independent of Luke UI styling-engine
portability.

#669 adds the docs app's Vanilla Extract dependency and Vite/Vitest plugins. A `base`-layer class on
the root body sets an unused custom property from a public Luke UI token to prove CSS generation and
loading. This `--docs-text-color` smoke rule is temporary scaffolding. #678 removes it if no docs UI
uses it by then. Tailwind and Fumadocs remain in place for the later consumer migrations.

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

| Surface / concern                             | Current owner                                                                                             | Fumadocs                                                                    | Tailwind                                                          | CSS / tokens                                                                                       | Role and state                                                       | Class                           | Direction                                                                                               | Prerequisite           | Issue      |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------- | ---------- |
| Root document and providers                   | `src/routes/__root.tsx`, `src/components/theme-controls.tsx`                                              | `RootProvider`, search dialog type, `next-themes` integration               | body/root layout classes                                          | `app.css`, Luke UI root and theme stylesheet URLs, `text-fd-foreground`                            | SSR/hydration, colour mode, theme identity, spritesheet, lazy search | Existing + Structure            | Keep Luke UI theme/spritesheet; isolate or replace visual provider ownership, use `.css.ts`             | #669                   | #672       |
| Global styling and cascade                    | `src/styles/app.css`, Vite/Vitest configs, package                                                        | Fumadocs neutral/preset CSS                                                 | `tailwindcss` import, Vite plugins and packages                   | `@layer`, `--color-fd-*` to `--luke-*` bridge, `#nd-*` overrides                                   | Generated utility CSS and Fumadocs visual rules power most docs UI   | Structure                       | Move authored rules to `.css.ts`, replace Fumadocs rules, then remove CSS imports and build integration | #669 and all consumers | #677, #678 |
| Site header and global links                  | `src/components/site-nav.tsx`, `docs-site-nav.tsx`, `lib/site-destinations.ts`                            | core `Link`/pathname; UI search triggers and popover/sidebar trigger        | layout, colour, hover/focus, responsive classes                   | `fd-*`, `--fd-docs-row-1`, `--fd-header-height`                                                    | Active destination, repository link, mobile theme/search controls    | Local UI + Structure            | Own header and triggers locally; retain route/tree data only through adapter                            | #669                   | #672       |
| Desktop docs navigation                       | `src/routes/$.tsx`, `lib/layout.shared.tsx`, `lib/source.ts`                                              | `DocsLayout` notebook, page tree                                            | layout config classes                                             | Fumadocs preset, sidebar selectors in `app.css`                                                    | Group labels, active item, sticky sidebar                            | Local UI + Structure            | Render page tree in docs-local navigation with Luke UI visuals                                          | #669                   | #672       |
| Mobile docs drawer                            | notebook sidebar from `DocsLayout`, `docs-site-nav.tsx`                                                   | `SidebarTrigger`, overlay/sidebar implementation                            | responsive trigger classes                                        | `#nd-sidebar-mobile` overrides, preset CSS                                                         | Drawer, backdrop, close, route links, focus                          | Local UI                        | Own drawer and navigation semantics locally                                                             | #669                   | #672       |
| Search trigger and dialog                     | `src/components/{site-nav,search}.tsx`, root route                                                        | UI search triggers/dialog slots; core search client                         | trigger sizing/responsive classes                                 | Fumadocs dialog/preset tokens                                                                      | Shortcut, modal, query, result/empty/loading, focus return           | Local UI                        | Own visible search dialog; retain core index/query data                                                 | #669                   | #672       |
| Theme popover and choice controls             | `site-nav.tsx`, `theme-controls.tsx`, `playground/{color-mode-toggle,icon-toggle-button-group}.tsx`       | UI Popover; `RootProvider` theme state                                      | local layout and icon sizing classes                              | Luke UI `buttonRecipe`, `rootClassName`, theme styles                                              | Tactile/Paper and light/dark/system; portal needs theme root         | Existing + Local UI             | Keep exported button recipe and Luke UI theme; own popover and local toggle styles                      | #669                   | #672, #676 |
| Home and 404                                  | `src/routes/index.tsx`, `src/components/{home-hero,home-features,not-found}.tsx`                          | home `CodeBlock` (removed in #670)                                          | grids, spacing, widths, responsive classes                        | Luke UI Button/Heading/Text/Stack after #670                                                       | Marketing hero, install command, feature grid, error navigation      | Existing + Local UI + Structure | #670 owns the install CodeBlock swap; #675 moves remaining page layout to `.css.ts`                     | #669, #670             | #675       |
| Docs article layout and chrome                | `src/routes/$.tsx`, `lib/layout.shared.tsx`                                                               | `DocsPage`, `DocsTitle`, `DocsDescription`, `DocsBody`, notebook TOC/footer | margin/padding/prose opt-out classes                              | preset prose and article rules, `#nd-notebook-layout` overrides                                    | Title, description, actions, article, TOC, previous/next             | Local UI + Structure            | Own article/TOC/page chrome; keep source loader and tree                                                | #672                   | #673       |
| Page actions                                  | `src/components/page-actions.tsx`, `lib/use-copy-button.ts`                                               | no active UI import; copied hook originated from Fumadocs                   | `not-prose`, flex/icon classes                                    | Luke UI Button/Link/Icon, Fumadocs prose opt-out                                                   | Source, Markdown, edit links and copy feedback                       | Existing + Structure            | Keep Luke UI controls, move layout to `.css.ts`; remove obsolete provenance comment if appropriate      | #669, #673             | #673, #678 |
| MDX prose and native elements                 | `src/routes/$.tsx`, `source.config.ts`, `content/docs/**/*.mdx`                                           | `fumadocs-ui/mdx` defaults                                                  | generated prose/utility styling                                   | preset CSS; Luke UI Prose/Heading/Link/Code candidates                                             | Paragraphs, lists, links, tables, headings, anchors; fences via #670 | Existing + Local UI             | #670 maps fences to docs CodeBlock; #673 replaces the rest of the MDX map; keep MDX compiler and source | #670, #672             | #673       |
| MDX custom content UI                         | `content/docs/**/*.mdx`, MDX map in `routes/$.tsx`                                                        | Fumadocs Cards/Card and default heading anchors                             | Fumadocs-generated classes                                        | preset CSS                                                                                         | Cross-links, content cards, heading anchor copy                      | Local UI                        | Supply docs-local renderers in `.css.ts`, preserve semantics                                            | #673                   | #673       |
| Code block display                            | `apps/docs/src/components/code-block/` (+ home, source, example, MDX `pre`)                               | none (done via #670)                                                        | residual frame classes outside CodeBlock only                     | Luke UI tokens via `.css.ts`; Shiki theme properties                                               | Title/copy, syntax display, horizontal overflow, loading             | Local UI                        | Done (#670): docs CodeBlock owns fences and samples; Shiki stays in the docs highlight pipeline         | #669                   | #670       |
| Generated API/props tables                    | `component-props-table.tsx`, `routes/$.tsx`, `source.config.ts`                                           | UI `TypeTable`/Collapsible; typescript generator                            | table/group classes                                               | `fd-*`, preset CSS                                                                                 | Generated prop descriptions and expandable groups                    | Local UI                        | Keep generator/type nodes; own table/disclosure UI                                                      | #673                   | #674       |
| Icon gallery, token explorer, component index | `src/components/{icon-gallery,token-explorer,components-index}.tsx`                                       | indirect page/prose host only                                               | many grid/table/filter/empty/copy classes                         | `fd-*`; Luke UI inputs, icons, tokens                                                              | Responsive cards/tables, filtering, copy, empty states               | Existing + Local UI             | Own widgets in `.css.ts` with public Luke UI seams                                                      | #673                   | #674       |
| Example frame and StoryWrapper                | `example-block.tsx`, `lib/story-wrapper.tsx`, `src/examples/**`                                           | code block only (removed in #670)                                           | frame, resize, container query, loading/error classes             | `fd-*`, Luke UI `Box`, `ScrollFade`, `vars`                                                        | Live examples, code toggle, resize grip, loading/error, canvas       | Existing + Local UI + Structure | #670 swaps the source panel to docs CodeBlock; #675 migrates the frame; keep StoryWrapper and examples  | #670, #673             | #675       |
| Playground host and split panels              | `routes/playground/index.tsx`, `components/playground/{pane-toolbar,preview-toolbar,viewport-toggle}.tsx` | global site header/search only                                              | split, resize, full-screen, viewport, error and overlay classes   | `fd-*`, hardcoded Monaco surface colours; kernel in `@luke-ui/playground-core` (#671)              | Editor/preview split, viewport/fullscreen, errors, iframe cover      | Local UI + Structure            | Own host styles with `.css.ts` and Luke UI controls                                                     | #669, #671, #672       | #676       |
| Playground editor and skeleton                | `components/playground/{editor,editor-skeleton,editor-skeleton-script}.ts*`, `lib/monaco-setup.ts`        | none                                                                        | editor shell/skeleton classes                                     | Monaco CSS/themes, Catppuccin, `fd-*` pill; format/hash/shape in `@luke-ui/playground-core` (#671) | Monaco completion/format, pre-hydration skeleton, loading            | Local UI + Structure            | Keep Monaco; move host/skeleton styles to `.css.ts`                                                     | #669, #671             | #676       |
| Playground preview runtime                    | `routes/playground/preview.tsx`, `components/playground/preview-runner.tsx`, `lib/story-wrapper.tsx`      | root provider reaches preview route, no direct visual import                | runner flex classes                                               | Luke UI root/theme and spritesheet; compile/require in `@luke-ui/playground-core` (#671)           | Compiled component, error boundary, preview theme                    | Existing + Structure            | Keep real Luke UI canvas; core compile extracted, host retains runner shell                             | #671                   | #676       |
| Responsive, RTL, focus, light/dark            | all above                                                                                                 | notebook/dialog/popover/sidebar supply part of behaviour                    | `md:`, `sm:`, `dark:`, `focus-visible:`, logical utility variants | Fumadocs and Luke UI theme tokens                                                                  | Cross-cutting behavioural and visual states                          | Local UI + Structure            | Verify state matrix in each consumer PR; use logical properties                                         | #669                   | #672–#678  |

The current MDX corpus has no callout use. There is no presentational Tailwind in `src/examples/**`
or `src/samples/**`: their rendered UI is intentional Luke UI demonstration content. The single
`@import 'tailwindcss'` in `content/docs/docs/styling.mdx` is a deliberate _displayed code example_
about using Box with Tailwind. Keep it if the example remains useful; it does not justify a docs-app
Tailwind dependency.

## Retained non-visual Fumadocs inventory

| Dependency                                               | Files                                                                                                                | Role                                                      | Outcome                                                                                     |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `fumadocs-mdx` config/plugin/generated `.source`         | `source.config.ts`, `vite.config.ts`, package scripts, `src/routes/$.tsx` browser collection                         | Content sourcing, MDX compilation, browser module loading | Retain behind source/MDX adapter; #673 changes rendered components only.                    |
| `fumadocs-core/source`, schema, loader and page tree     | `source.config.ts`, `src/lib/source.ts`, `src/routes/$.tsx`                                                          | Metadata, tree, page lookup and serialization             | Retain; #672 and #673 consume the data without Fumadocs UI.                                 |
| `fumadocs-core/search` client/server and `zbsearch`      | `src/components/search.tsx`, `src/routes/api/search.ts`                                                              | Static search index/query                                 | Retain data/search logic behind #672's local dialog.                                        |
| `fumadocs-typescript` and `remarkAutoTypeTable`          | `source.config.ts`, `src/lib/create-component-props-generator.ts`, `component-prop-analysis.ts`, generated `.source` | Extract public prop/type data                             | Retain; #674 replaces visual tables.                                                        |
| Fumadocs framework pathname/Link and `useFumadocsLoader` | `docs-tree-pathname-provider.tsx`, `site-nav.tsx`, `routes/$.tsx`                                                    | Routing integration                                       | Keep only if needed in the adapter; #672/#673 should prefer router-native links outside it. |
| `lucideIconsPlugin`                                      | `src/lib/source.ts`                                                                                                  | Page-tree icon metadata                                   | Retain or map to local icons if needed for the local tree; #672 owns the decision.          |
| `next-themes`                                            | root/theme/preview                                                                                                   | Colour-mode state, not Fumadocs visual CSS                | Retain if useful after `RootProvider` replacement.                                          |

`fumadocs-ui` is not on this retained list. Its visual components, type imports, stylesheet imports,
and `fumadocs-ui > lucide-react` prebundle entry must be removed or explained by #677/#678. The
local `use-copy-button.ts` already has no Fumadocs runtime import; its source-provenance comment is
a cleanup candidate, not active visual coupling.

## Playground extraction boundary

The **host-independent core landed in #671** as the private workspace package
`packages/@luke-ui/playground-core` (`@luke-ui/playground-core`). Pure message schemas,
origin/source validation, page session, hash encoding, import allowlist helpers, source compilation,
format logic, and portable scope-module rendering take host-supplied inputs (React package
`exports`, optional extra specifiers, live `playgroundScope` map). Docs remains the first host:
`scripts/generate-playground-scope.ts` and `docs-playground-specifiers.ts` pass Luke UI exports plus
docs third-party/`#docs` extras; `generate-playground-types.ts` still resolves repo paths for Monaco
virtual files. Scope generation currently emits 51 runtime modules; types generation emits ~1,220
virtual files (~3.4 MB raw). `vite.config.ts`'s `optimizeDeps` list is separate runtime prebundling,
not type generation.

The docs host retains routes, Monaco editor/theme, site theme controls, StoryWrapper, preview
iframe, resize panels, toolbar, loading UI, and `.css.ts` styling. `playground:ready`,
`playground:code`, `playground:appearance`, `playground:success`, and `playground:error` messages,
origin/source checks, initial URL hash, and the missed-ready retry are behaviour contracts. #671
extracted the kernel; #676 migrates the host presentation. The package is private and unpublished.

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

| Dependency group and current matches                                                                                                                                              | Outcome                                                                               | Issue                              |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------- |
| `fumadocs-ui/provider/tanstack`, `components/dialog/search` type, `components/ui/popover`, search trigger slots, notebook sidebar trigger, notebook layout and shared layout type | Replace visible UI and restrict framework integration to adapter                      | #672                               |
| Notebook page components and `fumadocs-ui/mdx`; MDX Cards/Card, headings, prose, tables, anchors, TOC (not code fences)                                                           | Replace visual renderers; retain content/MDX data                                     | #673                               |
| `fumadocs-ui/components/type-table` and `components/ui/collapsible`                                                                                                               | Replace visual table/disclosure; retain generated type data                           | #674                               |
| `fumadocs-ui/components/codeblock` / `Pre` in home, examples, source block, and MDX fences                                                                                        | Replaced by docs-local CodeBlock (#670); Shiki stays in the docs highlight pipeline   | #670                               |
| `fumadocs-ui/css/neutral.css`, `css/preset.css`, `--color-fd-*`, `#nd-*`, `--fd-*`, `text-fd-*`, `bg-fd-*`, `border-fd-*`                                                         | Remove when visual consumers are replaced                                             | #672–#677                          |
| Tailwind `className` utility strings in `routes/{__root,index,$,playground/index}.tsx`                                                                                            | Replace with docs `.css.ts`                                                           | #672, #673, #675, #676             |
| Tailwind utilities in `components/{site-nav,docs-site-nav,theme-controls}.tsx`                                                                                                    | Replace with docs `.css.ts`                                                           | #672 (playground controls in #676) |
| Tailwind utilities in `components/{home-hero,home-features,not-found,page-actions,example-block,source-code-block}.tsx`                                                           | Replace with docs `.css.ts`                                                           | #673, #675                         |
| Tailwind utilities in `components/{component-props-table,components-index,icon-gallery,token-explorer}.tsx`                                                                       | Replace with docs `.css.ts`                                                           | #674                               |
| Tailwind utilities in `components/playground/{editor-skeleton,editor,icon-toggle-button-group,pane-toolbar,preview-runner,preview-toolbar}.tsx`                                   | Replace with docs `.css.ts`                                                           | #676                               |
| Tailwind `@import`, generated CSS, `@tailwindcss/vite` in Vite/Vitest, `tailwindcss` and `@tailwindcss/vite` packages                                                             | Remove after consumers migrate; terminal issue owns dead build/package/config cleanup | #677, #678                         |
| `fumadocs-ui > lucide-react` prebundle entry and unused internal `#recipe-engine` Vite alias                                                                                      | Verify need and remove dead integration                                               | #678                               |
| `fumadocs-core`, `fumadocs-mdx`, `fumadocs-typescript`, `.source`, core search, source tree, Markdown/LLM output                                                                  | Intentionally retain non-visual infrastructure                                        | #672–#674 adapter boundary         |
| `content/docs/docs/styling.mdx` Tailwind import shown as code; real Luke UI component examples under `src/examples/**` and source samples under `src/samples/**`                  | Intentional teaching/example content, not docs UI styling                             | Retain; verify #678                |

Reconciliation commands for follow-ups:
`rg -n 'fumadocs-ui|@tailwindcss|tailwindcss|fd-|#nd-' apps/docs`,
`rg -l 'className=|className:' apps/docs/src --glob '!*.test.*'`, inspect
`apps/docs/dist/client/assets/*.css` after build, and compare any residual match to one row above.
Do not count generated `.source`, build outputs, or displayed MDX code as active styling without
tracing the owner. #678 owns the final absence check and the decision to close #577.
