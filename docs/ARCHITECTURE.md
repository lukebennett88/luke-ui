# Architecture

This guide owns functional ownership and dependency policy across the monorepo. Use it when placing
code, choosing an import, or changing a package boundary. The migration backlog lives in
[#1053](https://github.com/lukebennett88/luke-ui/issues/1053). Existing locations in the inventory
below describe the baseline, not permission to spread an ownership gap.

## Ownership and interfaces

Colocate implementation, styles, tests, fixtures, and helpers with the function that owns them.
Another consumer does not make a module shared. A control-specific sizing constant stays with that
control even when a related control imports it. Keep a shared module when its responsibility is
cross-cutting and can be named independently of its callers.

Prefer functional directories directly under an app's `src/`, such as `playground/`, `search/`, or
`settings/`. A single-file function can remain a single file. There is no required `features/`
wrapper. Generic `components/`, `lib/`, and `shared/` directories are not forbidden, but a directory
name does not establish shared ownership.

Within a workspace, import defining modules directly. Closely related verticals may depend on one
another when the dependency follows ownership, such as a composed field using Field primitives.
Foundations must not depend on their consumers. Independent verticals must not reach into each
other's state or orchestration. Keep the dependency explicit rather than adding internal barrels, a
global feature allowlist, or an abstraction whose only purpose is hiding the import.

Across workspaces, use declared package interfaces. Apps consume library entrypoints, libraries do
not depend on apps, and apps do not import each other's implementation. Build tooling may inspect
source and package metadata for generation or validation. This is a build-time responsibility, not a
browser API. [Public API](PUBLIC_API.md) owns export eligibility and consumer contracts.

Routing entrypoints own route registration, parameters, loaders, metadata, and delegation. Put
substantial state transitions, UI, and workflows in the responsible vertical. Root composition may
wire providers and app-wide services. It must not become the owner of a feature merely because the
feature is mounted there.

A vertical may contain browser, server, and generator modules. Colocation does not permit browser
value imports of build-only modules, including transitive imports. Keep runtime-neutral contracts
separate from filesystem access, TypeScript analysis, and asset generation. Type-only dependencies
are allowed when erased from runtime output. Preserve lazy loading and pre-hydration entrypoints.

## Lint configuration ownership

Keep workspace-specific lint overrides in that workspace's `lint.config.ts`, as in
`apps/docs/lint.config.ts` and `apps/reference-app/lint.config.ts`. Export the overrides and import
and spread them into the root `vite.config.ts`. Use paths relative to the repository root.

Vite+ runs repository lint from the root configuration. It does not merge workspace lint overrides
automatically, so each workspace's overrides must be imported there. Keep repository-wide rules in
the root configuration.

## Workspace responsibilities

Arrows in this inventory mean permitted dependency direction, not mandatory imports. Manifests,
public export maps, and the source owners below are the reproducible inventory, rather than a second
hand-maintained list of every component.

| Workspace                                           | Owner and dependency direction                                                                                                                                                                                                                  |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Root `design-system`                                | Task orchestration, dependency catalog, lint configuration, and repository graph checks. `functions/_middleware.ts` owns Cloudflare request negotiation, with a deliberate server-side dependency on docs negotiation helpers.                  |
| `.github/scripts` (`@luke-ui/workflow-scripts`)     | CI, cleanup, visual comparison, and task-graph validation. May inspect repository files and invoke workspace tasks. No application runtime dependency on this workspace.                                                                        |
| `packages/@luke-ui/react`                           | Published components, primitives, styling runtime, theme foundations and compiler. Depends on Rainbow Sprinkles, never on docs or published theme implementations.                                                                              |
| `packages/@luke-ui/rainbow-sprinkles`               | Published styling machinery: property definitions, specificity, and runtime style resolution. Independent of React components, themes, and apps. Its existing package entrypoints are an intentional public interface.                          |
| `packages/@luke-ui/theme-paper` and `theme-tactile` | Published theme inputs and generated theme assets. Build through `theme-build` and React's theme compiler. Runtime consumers use the theme identity and CSS. Neither theme owns the other.                                                      |
| `packages/@luke-ui/theme-build`                     | Private build configuration and shared font assets for Paper and Tactile. Depends on the public React compiler contract. Shared because both theme packages use the same packaging contract, not because it owns theme design decisions.        |
| `packages/@luke-ui/playground-core`                 | Private, library-independent compiler, protocol, hash, formatter, specifier and generation contracts. Docs supplies host policy. Core must not import Luke UI components, themes, or docs. Browser subpaths must not import its Node generator. |
| `packages/scaffolding` (`@luke-ui/scaffolding`)     | Component and primitive creation plans, templates, and application of those plans. May write library exports, docs, and fixtures as one operation. Generated files belong to their destination owners.                                          |
| `apps/docs`                                         | Hosted guides, examples, reference generation, playground host, and site infrastructure. Depends on public React, theme, and playground-core interfaces. Source analysis is a build-only exception.                                             |
| `apps/reference-app`                                | Consumer demonstration of settings, profiles, preferences, security, and app composition. Depends on public React entrypoints. Its theme input belongs to this app.                                                                             |

## React library

Retain `src/core/`. It distinguishes component and styling implementation from theme compilation,
domain-free helpers, and public adapters. Flattening it would remove a useful enforced boundary
without resolving ownership inside it.

`src/exports/` contains public adapters, `src/core/` contains component implementation, `src/theme/`
contains the compiler, foundations, and theme fixtures, and `src/shared/` contains small domain-free
helpers.

The zone direction is `exports → core → theme → shared`, with direct imports to lower zones also
allowed. Same-zone imports are allowed. `shared` has no upward dependencies. `core/styles/`, layout
utilities, types, provider infrastructure, and test utilities have real cross-cutting contracts.
Component and compiler logic must not migrate to `shared` to bypass the direction.

Within `core`, the component family owns its composed control, primitive parts, recipes, and local
helpers. Separate public component and primitive subpaths do not require separate implementation
owners. Current composed directories and `core/primitives/<name>/` can migrate together by family.
Field owns common field anatomy, validation presentation, and necessity context. Composed fields may
import those defining modules directly. Button and link variants may reuse button anatomy and
recipes without treating every primitive as an independent vertical.

Combobox and Checkbox own their composed fields, primitive parts and family-specific sizes. The
button family owns its icon policy, Icon owns icon dimensions and viewBox geometry, and
LoadingSpinner owns its geometry while using Icon dimensions. `core/sizing/` retains the
control-size context and vocabulary, field icon mapping, minimum target and cross-control choice
dimensions.

[Components](COMPONENTS.md) owns concrete file shapes and scaffolding commands.
[Styling](STYLING.md) owns styling contracts. [Testing](TESTING.md) owns test placement and
fixtures. Migrations must update creation plans and their tests with any source-layout change.

## Docs ownership

The app's target owners and their existing seams are:

| Owner                    | Current responsibilities and intended boundary                                                                                                                                                                                                                                                                          |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Playground               | `src/playground/` owns host UI, session, Monaco, skeleton, policy and generators. Routes retain registration and metadata. Host policy stays here, generic compilation/protocol stays in playground-core. Theme appearance is an explicit dependency on preferences.                                                    |
| Type reference           | Prop analysis, type tokens/model, collection, enrichment, generated definition assets, loading state, tables, and popovers split between `lib/` and `components/`. Own browser and generator modules together, with separate runtime contracts. Preserve the client dependency test and asset/link validation.          |
| Site navigation          | `src/navigation/` owns the header, drawer, docs navigation/shell, site destinations, container queries, and sidebar preference persistence. Sidebar state belongs to navigation even though its pre-hydration setup shares the theme script entrypoint. Navigation consumes search and appearance controls.             |
| Appearance               | `src/appearance/` owns the theme preference model/store, theme controls, and pre-hydration theme setup. Playground may consume this contract. Appearance must not depend on the playground. Keep the early inline script and browser store aligned.                                                                     |
| Search                   | Provider, dialog, result-text processing, and `/api/search` adapter. Server index creation consumes the content source. Browser UI must not import the server source loader.                                                                                                                                            |
| Content and examples     | MDX source/discovery, page metadata, Markdown/LLM/sitemap output, example rendering/source inlining and validation, code highlighting, guides, samples, and executable examples. Article presentation may consume type-reference and example UI. Source walkers and build plugins remain outside browser import graphs. |
| Reference and landing UI | Token reference views, icon gallery, component index, and home showcase own their presentation. Shared copy feedback, links, typography, table presentation, base-path and URL contracts may remain app infrastructure when their responsibility spans these surfaces.                                                  |

The split between `components/` and `lib/` is an ownership gap where it separates one of these
functions. It is not evidence of a forbidden dependency by itself. Shared reference-table styling,
MDX typography, site URL resolution, and content discovery do not need separate copies per vertical.

### Guides and executable examples

Keep published-library implementation separate from docs-app content.
[Documentation](DOCUMENTATION.md#where-documentation-lives) owns authored and generated content
locations, public URLs, navigation, and MDX contracts.

Fumadocs discovers `content/docs` through `source.config.ts`. Its loader uses `baseUrl: '/'`, so
content paths and `meta.json` determine existing routes and navigation. ExampleBlock separately
loads `src/examples/*/*.tsx` through Vite globs. Remark validation, source inlining, reachability,
Knip entry configuration, and scaffolding also know that example root. Moving an MDX guide beside a
TSX file under `src/` would not preserve discovery automatically.

Keep those discovery roots for now. Guides and examples have the same docs owner despite separate
physical roots. Physical colocation is not an actionable migration until the discovery and URL
contract can be preserved through the existing pipeline. No generated library-source docs or new
content-copying pipeline is needed to satisfy ownership.

## Reference app ownership

Use `settings/` as the owner of the persisted settings aggregate, query contract, shared settings
shell, navigation, and row presentation. Profile, preferences, and security belong under that owner,
with their own UI, workflows, and feature-specific validation. The current `api/`, `components/`,
`styles/`, `workflows/`, and substantial route implementations split these responsibilities.

Profile owns avatar upload state, profile fields, and email change. Preferences owns configuration,
mutation state, and optimistic interface preview. Security owns clearing saved settings. Shared
persistence and query invalidation remain settings infrastructure: they coordinate one stored
aggregate and must not be copied into each child. Move the outlet contract out of routing so child
screens do not import a route module for settings state.

The home summary and root provider may consume settings through defining contracts. Browser storage,
router/query setup, global styling, and app theme input remain app infrastructure. Keep the existing
consumer-level tests exercising persistence, validation, mutation ordering, and navigation.

## Enforcement and reproduction

Prefer package/module structure, then existing static analysis, then focused tests. Agent guidance
covers ownership judgements that cannot be checked reliably. Add a restriction during a migration
only for a specific independence or dependency-direction contract. Scope exceptions to the actual
file/import. A new automated boundary must reject a forbidden fixture and run through the existing
verification path. Do not ban a directory solely by name.

From a worktree installed with `pnpm install`, use:

```sh
pnpm list -r --depth -1
pnpm run check
pnpm run test:code
```

The root check already runs Knip cycles and unused analysis, Oxlint, and the React Unbarrelify
check. For a focused investigation, reuse `pnpm run check:cycles`, `pnpm run check:unused`, or
Knip's `--trace-file <path>` / `--trace-export <name>` / `--trace-dependency <package>` options via
`pnpm exec knip`. Inspect defining modules and both value and type imports to assign owners. Use
history only when these relationships leave ownership ambiguous. Do not build a second dependency
scanner or turn import counts into an architecture target.

| Mechanism                                       | Invariant and limits                                                                                                                                                                                                                                                                                                           |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Knip (`knip.config.ts`)                         | Repository cycles, unused files/exports/dependencies and unresolved imports. Explicit entries cover routes, examples, MDX, generated-script inputs and path-loaded fixtures. It does not assign functional ownership or compile CSS. Stylesheet entries and the theme-build `publint` exception document known discovery gaps. |
| Oxlint (`vite.config.ts`)                       | React zone direction and playground-core browser/Node restrictions, alongside ordinary code rules. Import patterns inspect specifier spelling. They do not prove transitive runtime isolation or resolve every differently spelled relative path.                                                                              |
| Unbarrelify (`@luke-ui/react#check:barrels`)    | Internal React re-exports, exempting public `src/exports/`. It does not run across the apps. Existing app re-exports are not evidence that the whole repo has this check.                                                                                                                                                      |
| React `module-boundaries.test.ts`               | Resolves relative static imports across the four zones, including type imports, with positive/negative scanner fixtures. Excludes tests, stories and fixtures. Does not follow aliases or dynamic imports. Runs in `test:code`, not root `check`.                                                                              |
| Docs `type-definitions-client-boundary.test.ts` | Traverses static browser value imports from the API table and rejects generator dependencies. Type-only edges are deliberately erased. Does not cover every browser entry, dynamic import, or asset query. Runs in `test:code`.                                                                                                |
| Docs checks and existing tests                  | `check:docs` / `check:llms` enforce content, examples, navigation, API and generated-output contracts through root `check`. Browser/unit tests cover actual feature behaviour. They complement graph analysis.                                                                                                                 |

Oxlint and the React resolving test overlap on zone direction but do not enforce exactly the same
cases. Keep both until a demonstrated consolidation preserves resolved-path coverage, static
feedback, and rejection fixtures. Knip cycle detection and Unbarrelify enforce different invariants.
The docs transitive value-import test is also distinct from zone lint. No additional architecture
framework is needed. Future per-vertical restrictions belong in existing lint/check tasks as each
migration lands, while behaviour remains covered by existing test tasks.

[Workflows](WORKFLOWS.md) owns Turbo ordering and verification commands. A green graph check proves
its configured invariants, not that every module has the right functional owner.
