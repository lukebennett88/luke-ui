# Components

Use this guide when you add or change a public component in `@luke-ui/react`.

## Components and primitives

Luke UI exposes one normal component API. Start with the component that fits the use case.

When the component API does not cover a custom composition, drop down to a primitive under
`@luke-ui/react/primitives/*`. Primitives describe a lower-level composition API, not implementation
simplicity. Foundational components such as `Text`, `Icon`, `Heading`, and `Box` remain normal
component entrypoints.

```ts
import { Button } from '@luke-ui/react/button';
import { ComboboxRoot } from '@luke-ui/react/primitives/combobox';
import { Field, FieldLabel } from '@luke-ui/react/primitives/field';
import { TextInputRoot } from '@luke-ui/react/primitives/text-input';
import { Text } from '@luke-ui/react/text';
```

Do not add a root `@luke-ui/react/primitives` barrel. Import each primitive entrypoint explicitly.

## Component creation

Use the component generator for new normal component entrypoints:

```sh
pnpm run scaffold:component --args <name> <docs-group> <Yes|No>
```

Use the primitive generator for new `@luke-ui/react/primitives/*` entrypoints:

```sh
pnpm run scaffold:primitive --args <name> <Yes|No> <Yes|No>
```

The final component argument chooses visual coverage. The primitive arguments choose hosted docs,
then visual coverage. Pass the literal choice `Yes` or `No` for each to avoid interactive prompts.

Creation rules live in `packages/scaffolding/src/component-creation-plan.ts` and
`primitive-creation-plan.ts`. Keep validation, defaults, and scaffold rules in those modules. Omit
`--args` and the values to answer interactive prompts. Add `--dry-run` after the arguments to list
planned files without writing them. Only components accept documentation groups.

The component generator creates the component guide's primary
`apps/docs/src/examples/<component>/basic.tsx` example and references it with `ExampleBlock`. The
primitive generator creates `apps/docs/src/examples/<name>-primitive/basic.tsx`, the matching MDX
page under `components/primitives/`, and updates `components/primitives/meta.json`. Replace the
placeholder content with one focused, renderable use of the component or primitive.

Do not move creation rules into one-off generator code.

Public subpath modules live under `src/exports/`. Single-segment subpaths use a flat module such as
`src/exports/button.ts`. Grouped subpaths use nested modules such as
`src/exports/primitives/button.ts`. A component's implementation lives under `src/core/`. Support
modules and multi-part primitives each keep their own file. Public entrypoints use explicit named
exports. See [PUBLIC_API.md](PUBLIC_API.md) for the public surface rules.

## Package structure

[Architecture](ARCHITECTURE.md#react-library) owns source zones, functional ownership, and
dependency directions.

A component directory contains `<component>.tsx`, `recipe.css.ts` for its public recipe,
`styles.css.ts` when private styling is needed, and `<component>.browser.test.tsx` for behaviour,
axe, and visual captures. Multi-part primitives keep a file per part. New primitive scaffolds live
under their family directory in `primitive/`, alongside any composed control. Existing families may
still use `core/primitives/`.

### Generated exports

The React package's `package.json#exports` map is the public subpath contract. Component and
primitive scaffolding adds the source entry and its `./dist/` target together. `vp pack` builds
those entries but does not rewrite the export map. Keep the `stylesheet` build entry excluded from
the public map in the package's `vite.config.ts`.

Vanilla Extract serialises recipes to `#recipe-engine`. Pack, Vitest, and the docs app alias it to
`src/core/styles/recipe-engine.ts`. Pack bundles a relative runtime chunk. The specifier is private.

## Icons

Icon SVGs live in `packages/@luke-ui/react/icons`. After adding, renaming, or removing one,
regenerate the icon masks and the `iconNames` union:

```bash
pnpm --dir packages/@luke-ui/react run generate:icons
```

The generated `iconNames` export drives the docs gallery at `/docs/iconography`, so a new icon
appears there with no further changes.
