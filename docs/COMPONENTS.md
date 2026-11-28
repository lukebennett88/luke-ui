# Components

## Components and primitives

Start with the normal component entrypoint. Drop down to a primitive under
`@luke-ui/react/primitives/*` only for a custom composition the component API does not cover. A
primitive is a lower-level composition API, not a simpler implementation. Foundational components
such as `Text`, `Icon`, `Heading`, and `Box` stay normal component entrypoints.

```ts
import { Button } from '@luke-ui/react/button';
import { ComboboxRoot } from '@luke-ui/react/primitives/combobox';
import { Field, FieldLabel } from '@luke-ui/react/primitives/field';
import { TextInputRoot } from '@luke-ui/react/primitives/text-input';
import { Text } from '@luke-ui/react/text';
```

Import each primitive entrypoint explicitly. Do not add a root `@luke-ui/react/primitives` barrel.

## Component creation

Create normal component entrypoints and `@luke-ui/react/primitives/*` entrypoints with the
generators:

```sh
pnpm run scaffold:component --args <name> <docs-group> <Yes|No>
```

```sh
pnpm run scaffold:primitive --args <name> <Yes|No> <Yes|No>
```

The final component argument chooses visual coverage. The primitive arguments choose hosted docs,
then visual coverage. Pass the literal `Yes` or `No` for each to avoid interactive prompts. Add
`--dry-run` after the arguments to list planned files without writing them.

Keep validation, defaults, and scaffold rules in
`packages/scaffolding/src/component-creation-plan.ts` and `primitive-creation-plan.ts`, not in
one-off generator code.

Each generator creates a placeholder example under `apps/docs/src/examples/`. The primitive
generator also creates the MDX page under `components/primitives/` and updates its `meta.json`.
Replace the placeholder with one focused, renderable use of the component or primitive.

## Package structure

[Architecture](ARCHITECTURE.md#react-library) owns source zones, functional ownership, and
dependency directions.

Public subpath modules live under `src/exports/`, flat for single-segment subpaths such as
`src/exports/button.ts` and nested for grouped ones such as `src/exports/primitives/button.ts`.
Implementation lives under `src/core/`.

A component directory contains `<component>.tsx`, `recipe.css.ts` for its public recipe,
`styles.css.ts` when private styling is needed, and `<component>.browser.test.tsx` for behaviour,
axe, and visual captures. Multi-part primitives keep a file per part. New primitive scaffolds live
in `src/core/<family>/primitive/`, alongside any composed control. Existing families may still use
`src/core/primitives/`.

### Generated exports

The React package's `package.json#exports` map is the public subpath contract. Scaffolding adds each
source entry and its `./dist/` target together. `vp pack` builds those entries but does not rewrite
the map. Keep the `stylesheet` build entry excluded from the public map in the package's
`vite.config.ts`.

Vanilla Extract serialises recipes to the private `#recipe-engine` specifier. Pack, Vitest, and the
docs app alias it to `src/core/styles/recipe-engine.ts`.

## Icons

Icon SVGs live in `packages/@luke-ui/react/icons`. After adding, renaming, or removing one,
regenerate the icon masks and the `iconNames` union:

```bash
pnpm --dir packages/@luke-ui/react run generate:icons
```

The generated `iconNames` export drives the docs gallery at `/docs/iconography`, so a new icon needs
no other change.
