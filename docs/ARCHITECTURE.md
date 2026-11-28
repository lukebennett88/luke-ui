# Architecture

Group code by what it does, not by its technical type.

## Ownership and interfaces

- Colocate implementation, styles, tests, fixtures, and helpers with the function that owns them.
  Another consumer does not make a module shared. A control-specific sizing constant stays with that
  control even when a related control imports it. Share a module only when its responsibility is
  cross-cutting and can be named independently of its callers.
- Prefer verticals directly under an app's `src/`, named for what they do, such as `playground/` or
  `settings/`. A `features/` wrapper is not required. A type folder such as `components/`, `lib/`,
  or `shared/` does not make its contents shared.
- Within a workspace, import defining modules directly. Related verticals may depend on one another
  when the dependency follows ownership, such as a composed field using Field primitives.
  Foundations never depend on their consumers. Independent verticals stay out of each other's state
  and orchestration. Keep dependencies explicit, without internal barrels, feature allowlists, or
  abstractions that only hide an import.
- Across workspaces, use declared package interfaces. Libraries never depend on apps, and apps never
  import each other's implementation. Build tooling may inspect source and package metadata.
  [Public API](PUBLIC_API.md) owns export eligibility.
- Routing entrypoints own registration, parameters, loaders, metadata, and delegation. Substantial
  state, UI, and workflows belong to the responsible vertical. Root composition wires providers and
  app-wide services without owning the features it mounts.
- Keep browser value imports away from build-only modules, including transitively: source walkers,
  build plugins, generators, and server loaders. Keep runtime-neutral contracts separate from those
  implementations. Erased type-only imports are allowed. Preserve lazy loading and pre-hydration
  entrypoints.

## Lint configuration ownership

Put workspace-specific lint overrides in that workspace's `lint.config.ts` and spread them into the
root `vite.config.ts`, with paths relative to the repository root. Vite+ lints from the root
configuration and does not merge workspace overrides itself.

## Workspace boundaries

- `@luke-ui/react` never depends on docs or the published themes.
- `playground-core` imports no Luke UI components, themes, or docs. Its browser subpaths never
  import its Node generator.
- Apps consume public entrypoints. `apps/squint` redeclares the report contract instead of importing
  a workflow script.
- Files that `scaffolding` generates belong to their destination owners.
- App-specific ownership lives in each app's README.

## React library

Zones, in dependency order `exports → core → theme → shared`:

- `src/exports/`: public adapters.
- `src/core/`: component and styling implementation.
- `src/theme/`: compiler, foundations, and theme fixtures.
- `src/shared/`: small domain-free helpers.

A zone may import its own zone or any lower zone. Keep `src/core/` as an enforced boundary.
`core/styles/`, layout utilities, types, provider infrastructure, and test utilities are genuinely
cross-cutting. Keep component and compiler logic out of `shared`.

Within `core`, a family owns its components, primitive parts, recipes, styles, tests, and
family-specific utilities, including sizing, even when another family consumes them. Related
families import defining modules directly, without re-export layers. Public entrypoints stay
independent of implementation layout. Families need not share a shape, and primitives move only when
ownership changes. `core/sizing/` owns cross-control size vocabulary and dimensions. Field owns
common field anatomy and validation presentation.

[Components](COMPONENTS.md) owns file shapes and scaffolding, [Styling](STYLING.md) owns styling
contracts, and [Testing](TESTING.md) owns test placement. Update creation plans and their tests when
changing source layouts.

## Enforcement

Prefer package and module structure, then existing static analysis, then focused tests. Add a
restriction only for a specific independence or dependency-direction contract, scoped to the actual
file or import. Put it in an existing lint, check, or test task, with a fixture it rejects. Never
ban a directory by name alone.

The root `pnpm run check` runs Knip, Oxlint boundaries, and Unbarrelify. The React
`module-boundaries.test.ts` and docs `type-definitions-client-boundary.test.ts` run only in
`pnpm run test:code`. A green graph check proves its configured invariants, not that every module
has the right owner.
