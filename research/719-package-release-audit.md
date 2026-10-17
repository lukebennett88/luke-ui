# Dependency, build, and test audit

Release audit for [#719](https://github.com/lukebennett88/luke-ui/issues/719), against
`58f5386ac1a0fb7da305852b692cc7101d90e556` and the dependency correction alongside this record. This
is a dated maintainer assessment, not an additional public API promise. The
[public API inventory](711-public-api-audit.md) and
[theme authoring contract](715-theme-authoring-contract.md) own the earlier design decisions.

## Shipped dependencies

The ranges below are the catalog-expanded package ranges at this revision. `pnpm pack` replaces
`catalog:` and `workspace:` references. A dependency used only by a compiler entry still needs to be
installed because that entry ships in the same package. A type-only import also needs a declared
dependency, even though it adds no browser JavaScript.

### React package

| Dependency                     | Published range                          | Reason and consumer impact                                                                                                                             | Decision                                                                                                                                                 |
| ------------------------------ | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `react` (peer)                 | `^19.3.0`                                | Hooks, contexts, JSX runtime, and React Compiler output use the application's React 19 copy.                                                           | Retain as a peer. Bundling would duplicate React.                                                                                                        |
| `react-dom` (peer)             | `^19.3.0`                                | React Aria renders portals and the application renders and hydrates through React DOM.                                                                 | Retain as a peer even without a direct Luke UI import.                                                                                                   |
| `react-aria-components` (peer) | `^1.22.0`                                | Controls, collections, slots, validation, and overlays share the application's React Aria contexts. Component subpaths keep imports targeted.          | Retain as a peer. Bundling would split those contexts.                                                                                                   |
| `@capsizecss/core`             | `^4.1.3`                                 | `theme/stylesheet.ts` calls `precomputeValues`. The compiler exports `FontMetrics`. Installed by every consumer, but absent from runtime-only bundles. | Retain declared. Compiler use is real and there is no measured install problem that justifies bundling.                                                  |
| `@luke-ui/rainbow-sprinkles`   | `0.0.0` at the audited workspace version | Box's generated code imports `create-runtime-fn`. Its authoring entry also installs Vanilla Extract.                                                   | Retain the 0.x support package and its narrow runtime subpath. Publish a matching version with React through #721. This is not a stable Luke UI 1.x API. |
| `@react-aria/utils`            | `^3.34.1`                                | Ref, id, and event composition in `merge-props.ts`, controls, and ScrollFade. The declared range can share an installed version with React Aria.       | Retain declared. Copying the helpers would take ownership of React Aria integration behaviour.                                                           |
| `@vanilla-extract/dynamic`     | `^2.1.5`                                 | `assignInlineVars` supplies responsive values, container sizes, skeletons, and overlays.                                                               | Retain the small runtime helper rather than maintaining a copy.                                                                                          |
| `@vanilla-extract/recipes`     | `^0.5.7`                                 | Extracted recipe code imports `createRuntimeFn`. This differs from the private Luke UI slotted recipe runtime.                                         | Retain declared. The browser receives the runtime subpath, not the authoring entry.                                                                      |
| `csstype`                      | `^3.2.3`                                 | Public layout declarations refer to CSS property types. No browser code.                                                                               | Retain as a dependency so declarations resolve without relying on React's transitive packages.                                                           |
| `react-aria`                   | `^3.53.0`                                | `use-visually-hidden.ts` imports `react-aria/useFocusWithin` for focus-reveal behaviour.                                                               | Retain the declared subpath dependency. Bundling would duplicate upstream hook code already used by React Aria Components.                               |
| `spin-doctor`                  | `^0.0.1`                                 | `use-press-action.ts` delays an Action-owned spinner without delaying explicit pending state. The package's published unpacked size is 12,630 bytes.   | Retain declared. Its measured size gives no install-cost reason to bundle or replace it.                                                                 |

### Support and theme packages

| Package           | Dependency                      | Published range                           | Reason, cost, and decision                                                                                                                                                                                                                                                               |
| ----------------- | ------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rainbow           | `@vanilla-extract/css`          | `^1.21.3`                                 | The root authoring entry calls `style`, `createVar`, and `addFunctionSerializer`. Retain declared. It adds authoring dependencies to installation, but the separate runtime subpath keeps them out of Box's browser bundle. Internalising the engine would not be a bounded release fix. |
| Rainbow           | `@vanilla-extract/dynamic`      | `^2.1.5`                                  | `create-runtime-fn` calls `assignInlineVars`. Retain declared and share it with React where resolution permits.                                                                                                                                                                          |
| Rainbow           | `csstype`                       | `^3.2.3`                                  | `dist/css.d.ts`, reached through `types.d.ts` from both entries, imports it. Move it from development to runtime dependencies. This adds no browser code and removes reliance on transitive hoisting.                                                                                    |
| Paper and Tactile | `@luke-ui/react` (peer)         | `^0.0.0` at the audited workspace version | The root uses `getThemeClassName`, and input declarations use compiler types. Retain as a peer. #721 must set the release range against token and compiler compatibility.                                                                                                                |
| Paper and Tactile | `@capsizecss/metrics` (inlined) | `4.3.0` recorded in `inlinedDependencies` | Only Inter's metrics are bundled into `./input`. Retain this exception: installing the full font-metrics catalogue for one object would impose avoidable cost. Neither theme has a runtime dependency.                                                                                   |

React's build permits no bundled external dependency (`deps.onlyBundle: []`). Build tools,
Fontsource, Capsize unpacking, browser tooling, and the private theme-build package remain
development dependencies. No additional bundling is justified by the measured consumer cost. The
existing consumer test compares Luke UI's additional installed bytes with its peers and reports the
largest own packages on failure.

## Versions and clean consumption

The supported floors in this revision are React and React DOM 19.3.0, React Aria Components 1.22.0,
and TypeScript 5.8.2, the first published 5.8 release. React 19.0 is not covered by these peer
ranges. `setup.ts` resolves the lowest published peer versions and the lowest published `~5.8.0`,
then checks the actual installed versions. A second consumer resolves the newest compatible
versions. Both use the final packed declarations with `skipLibCheck: false` and `bundler` and
`nodenext` resolution. Theme generation runs under Node 24 or later.

The reusable [packed-consumer harness](../packages/@luke-ui/react/src/core/packed-consumer/)
installs actual tarballs with npm outside the workspace. It checks dependency ranges, exact imports
against declarations, export targets, file contents, peer deduplication, SSR, hydration without
replacing server nodes, and working hydrated field handlers. This audit extends it to check the
installed support packages' JavaScript and declaration dependencies too.

On 2026-10-17, `npm view @luke-ui/rainbow-sprinkles versions --json` returned E404. Packing version
`0.0.0` proves workspace release consistency, not registry availability. React must not be published
with an unavailable Rainbow version. [#721](https://github.com/lukebennett88/luke-ui/issues/721)
already owns matching versions, protected publishing, and rerunning this harness against registry
snapshots and the stable release.

## Boundaries and extension points

| Surface inspected         | Evidence and decision                                                                                                                                                                                                                                                                                                |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Package subpaths          | `src/exports/` explicitly names exports, and `vp pack` generates the map. There is no root barrel or private styles entry. `package-exports.test.ts` checks absent paths and traverses all public declaration closures for styling-engine leaks. Retain.                                                             |
| Internal zones            | Root lint rules prohibit `theme` from importing `core` or `exports`, while `core` may import `theme`. `shared` imports no other zone. Internal modules import defining files. Retain the existing zones rather than adding a generic engine abstraction.                                                             |
| Runtime and compiler      | `/theme` exports runtime values. `/theme/compiler` owns generation and Capsize. The consumer measures Blockquote, Button, Box, Form, and theme imports and rejects compiler code, styling authoring, and unrelated components. A positive source-map assertion prevents an empty result from passing.                |
| Components and primitives | The #711 inventory records independent uses for primitive and recipe exports. Composed fields supply ordinary anatomy, while field/control primitives and render callbacks support custom composition. `utils` remains `mergeProps`, `cx`, and `pxToRem`. No speculative export or wrapper is needed.                |
| Product policy            | Button's 300ms Action spinner delay is an explicit presentation default, with external `isPending` available. Combobox's screen-width tray decision stays internal. Single-selection controls expose their supported value contract. None is evidence for a generic async, overlay, or collection framework. Retain. |
| Overlays                  | Private `MobileOverlay` handles the combobox tray, while React Aria owns dialog/portal semantics. `copyScopeColorMode` copies a nested trigger mode when an overlay mounts. Browser tests cover scope copying and mobile paths. A composed Dialog remains separately owned by #799.                                  |
| Theme roots and inputs    | A theme root imports its name and runtime class helper, not `./input`. The consumer measures each root and rejects bundled input/compiler code. The theme compiler validates each input in an inheritance chain. Keep compiler compatibility in #721's peer-range decision.                                          |

## Builds and assets

`react/vite.config.ts` builds neutral ESM with declarations and source maps. Vanilla Extract emits
static CSS. The build resolves private `#recipe-engine` references to relative chunks, keeps peers
external, fails on unapproved bundling, and runs publint and Are the Types Wrong. Public declaration
closures must not reference Rainbow or Vanilla Extract. CSS imports remain explicit and component
imports do not inject a stylesheet.

`generate:icons` writes the spritesheet to `.generated/`, and the build copies it to `dist/`. Turbo
assigns generation and build separate output directories, so restoring either cache cannot overwrite
the other. The consumer checks exported CSS/SVG resolution and a real client build, the CSS layer
order, and an external SVG URL rather than a data URL.

The shared theme build compiles the emitted `dist/input.js`, copies pinned Inter bytes and the OFL
licence, and emits separate CSS and font exports. The consumer checks font metrics against the
shipped font, actual browser font responses, custom display-font trims, and the docs' Node theme
compilation sample. The watch integration test proves input edits regenerate the stylesheet.

## Test architecture

| Gate                    | Contract and decision                                                                                                                                                                                                                                   |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Root `check`            | Barrels, formatting, lint, types, docs, cycles, and unused code. Turbo supplies generation/build prerequisites. Retain.                                                                                                                                 |
| Unit tests              | Pure logic, public type contracts, compiler validation, and package export/declaration contracts. These detect local failures without installing consumers. Retain.                                                                                     |
| Browser tests           | Luke UI composition, accessibility, layout, overlays, and real Tailwind cascade integration. Retain the separate Tailwind project because it has its own stylesheet and plugin cost.                                                                    |
| Visual tests            | Representative theme/state captures and explicit comparison approval. They test appearance, unlike behaviour and package tests. Retain the gate.                                                                                                        |
| Packed consumers        | One global setup installs/builds newest and minimum consumers, then scenarios inspect those builds. Font rendering uses only one peer set because it does not depend on peer versions. Retain this shared setup rather than adding another smoke suite. |
| Theme watch integration | An actual watcher proves successive input edits rebuild CSS. Its process cost justifies a separate command. Retain.                                                                                                                                     |

The source declaration scanner and installed-package checks overlap deliberately: the first gives
fast feedback on private API leakage, while the second proves installable final output. SSR in the
consumer tests hydration and package resolution, not another component interaction matrix. No
demonstrated redundant suite warrants removal.

## Findings and disposition

| Finding                                               | Affected flow and evidence                                                                                                             | Classification and action                                                                                                                                                              |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rainbow omits its declaration dependency              | `dist/css.d.ts` imports `csstype`, but the package lists it only in `devDependencies`. A transitive dependency can mask the omission.  | **Release blocker, fixed here.** Declare `csstype` and check support-package imports in the existing clean-consumer harness.                                                           |
| Rainbow is absent from npm and publishing is disabled | Registry query returns E404. `.github/workflows/release.yml` only prints a disabled message. Packed consumers supply sibling tarballs. | **Release blocker, tracked by #721.** Publish compatible support/theme versions through protected provenance-backed publishing and run real registry consumers before releasing React. |
| Formal React Server Components support                | The package proves ESM, SSR, and hydration. Those checks do not prove RSC boundaries. #709 explicitly defers formal RSC support.       | **Post-1.0.** Keep the documented SSR contract and avoid an unsupported RSC promise.                                                                                                   |

Exact local and CI results belong in the pull request's verification section. A successful packed
run does not satisfy the separate registry-release gate in #721 or the device sign-off in #718.
