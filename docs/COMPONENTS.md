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
pnpm run generate:component --args <name> <docs-group> <Yes|No>
```

Use the primitive generator for new `@luke-ui/react/primitives/*` entrypoints:

```sh
pnpm run generate:primitive --args <name> <Yes|No> <Yes|No>
```

The final component argument chooses visual coverage. The primitive arguments choose hosted docs,
then visual coverage. Pass the literal choice `Yes` or `No` for each to avoid interactive prompts.

Creation rules live in `packages/turbo-generators/src/component-creation-plan.ts` and
`primitive-creation-plan.ts`. Keep validation, defaults, and scaffold rules there so Turbo and Plop
share them. Only components accept documentation groups.

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

- `src/core/` holds implementation, styles, helpers, and colocated tests and fixtures.
- `src/exports/` holds the public modules. See [PUBLIC_API.md](PUBLIC_API.md#what-is-public).
- `src/theme/` holds the compiler, foundations, and visual theme fixtures in `__fixtures__/`.
  Published themes live in `packages/@luke-ui/theme-*`.
- `src/shared/` holds small, domain-free primitives such as class-name constants and typed object
  helpers. Keep component, compiler, and recipe logic in their own zones.

`exports` may import from `core`, `theme`, and `shared`. `core` may import from `theme` and
`shared`. `theme` may import from `shared`. `shared` imports from no other zone. Lint in the root
`vite.config.ts` enforces the internal zone boundaries.

A component directory contains `<component>.tsx`, `recipe.css.ts` for its public recipe,
`styles.css.ts` when private styling is needed, and `<component>.browser.test.tsx` for behaviour,
axe, and visual captures. Multi-part primitives keep a file per part.

### Generated exports

Do not hand-edit `package.json#exports`. `vp pack` derives exports from its `src/exports/` entry
configuration during build. The `stylesheet` build entry is excluded from the public map with
`exports.exclude` in the package's `vite.config.ts`.

Vanilla Extract serialises recipes to `#recipe-engine`. Pack, Vitest, and the docs app alias it to
`src/core/styles/recipe-engine.ts`. Pack bundles a relative runtime chunk. The specifier is private.

## Icons

Icon SVGs live in `packages/@luke-ui/react/icons`. After adding, renaming, or removing one,
regenerate the spritesheet and the `iconNames` union:

```bash
pnpm --dir packages/@luke-ui/react run generate:icons
```

The generated `iconNames` export drives the docs gallery at `/docs/iconography`, so a new icon
appears there with no further changes.
