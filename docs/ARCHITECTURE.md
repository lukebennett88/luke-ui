# Architecture

## Ownership and interfaces

- Colocate implementation, styles, tests, fixtures, and helpers with the function that owns them.
  Another consumer does not make a module shared. A control-specific sizing constant stays with that
  control even when a related control imports it. Share a module only when its responsibility is
  cross-cutting and can be named independently of its callers.
- Put functional directories directly under an app's `src/`, with no `features/` wrapper. A
  directory name such as `components/`, `lib/`, or `shared/` does not establish shared ownership.
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

## Workspace responsibilities

Permitted dependency directions, not mandatory imports:

- Root `design-system`: orchestration, catalog, lint, and graph checks. `functions/_middleware.ts`
  deliberately depends on docs negotiation helpers on the server.
- `.github/scripts`: may inspect repository files and invoke workspace tasks. No application depends
  on it at runtime.
- `@luke-ui/react`: depends on Rainbow Sprinkles, never on docs or published themes.
- `@luke-ui/rainbow-sprinkles`: independent of React components, themes, and apps. Its existing
  entrypoints are intentional public interface.
- `theme-paper` and `theme-tactile`: build through `theme-build` and React's compiler. Neither owns
  the other. Runtime consumers use only the theme identity and CSS.
- `theme-build`: depends on the public React compiler contract. It holds the packaging contract both
  themes share and no theme design decisions.
- `playground-core`: library-independent. It imports no Luke UI components, themes, or docs, and
  docs supplies host policy. Browser subpaths never import its Node generator.
- `scaffolding`: may write library exports, docs, and fixtures as one operation. Generated files
  belong to their destination owners.
- `apps/docs`: public React, theme, and playground-core interfaces. Source analysis is a build-only
  exception.
- `apps/squint` and `apps/reference-app`: public React entrypoints, each with its own theme input.
  Squint reads published report data over HTTP and redeclares that contract instead of importing a
  workflow script. Its browser app does not import `src/worker/`, the Pages Functions backend.

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

## Docs ownership

- Playground owns host policy. Generic compilation and protocol belong to playground-core. Routes
  keep registration and metadata. Playground depends explicitly on Appearance for theme appearance.
- Appearance never depends on Playground.
- Site navigation owns sidebar preference persistence and consumes search and appearance controls.
- Search's server index consumes the content source.
- Article presentation may consume type-reference and example UI.
- Copy feedback, links, typography, reference-table styling, URL and base-path resolution, and
  content discovery stay app infrastructure because they span several surfaces.
- `src/lib/theme-prefs-script.ts` composes the appearance and sidebar pre-hydration setup outside
  both owners, so neither depends on the other. It runs inline before first paint. Keep it aligned
  with both browser stores.

### Guides and executable examples

[Documentation](DOCUMENTATION.md#where-documentation-lives) owns content locations and URLs. Keep
both discovery roots. Fumadocs discovers `content/docs` with `baseUrl: '/'`, so content paths and
`meta.json` determine routes. ExampleBlock globs `src/examples/*/*.tsx`, and remark validation,
source inlining, reachability, Knip entries, and scaffolding also know that root. Moving a guide
beside its TSX would change URLs and break example tooling. Guides and examples share an owner
without colocation.

## Reference app ownership

`src/settings/` owns the stored settings aggregate, including persistence, query invalidation, the
shell, and the outlet contract. Profile, preferences, and security own their own UI, workflows, and
validation, without copying that infrastructure, and import neither routes nor each other.
`src/routes/` keeps registration and composition. The home summary and root provider consume
settings through defining contracts. Keep the consumer-level tests for persistence, validation,
mutation ordering, and navigation.

## Enforcement

Prefer package and module structure, then existing static analysis, then focused tests. Leave
judgements that cannot be checked reliably to agent guidance. Add a restriction only for a specific
independence or dependency-direction contract, scoped to the actual file or import. Put a new
automated boundary in an existing lint, check, or test task, and make it reject a forbidden fixture.
Never ban a directory by name alone, and do not build a second dependency scanner.

Mechanisms and their limits:

- Knip (`knip.config.ts`): cycles, unused code and dependencies, and unresolved imports. It does not
  assign ownership or compile CSS. Stylesheet entries and the theme-build `publint` exception mark
  known discovery gaps.
- Oxlint (`vite.config.ts`): React zone direction, playground-core browser and Node restrictions,
  and scoped app boundaries. Patterns match specifier spelling, so they neither prove transitive
  isolation nor catch every relative spelling.
- Unbarrelify (`@luke-ui/react#check:barrels`): internal React re-exports only. Existing app
  re-exports are not evidence of a repo-wide check.
- React `module-boundaries.test.ts`: resolves relative static imports, including type imports,
  across the four zones. It skips tests, stories, fixtures, aliases, and dynamic imports.
- Docs `type-definitions-client-boundary.test.ts`: traverses static browser value imports from the
  API table and rejects generator dependencies. It deliberately erases type-only edges and does not
  cover every browser entry, dynamic import, or asset query.

The root `pnpm run check` runs Knip, Oxlint, Unbarrelify, `check:docs`, and `check:llms`. The two
boundary tests run only in `pnpm run test:code`. Oxlint and the React boundary test overlap on zone
direction but catch different cases. Keep both until a consolidation preserves resolved-path
coverage, static feedback, and rejection fixtures.

To investigate, use `pnpm list -r --depth -1`, `pnpm run check:cycles`, `pnpm run check:unused`, or
`pnpm exec knip` with `--trace-file <path>`, `--trace-export <name>`, or
`--trace-dependency <package>`. Assign owners from defining modules and both value and type imports,
and use history only when those leave ownership ambiguous. A green graph check proves its configured
invariants, not that every module has the right owner. [Workflows](WORKFLOWS.md) owns Turbo ordering
and verification commands.
