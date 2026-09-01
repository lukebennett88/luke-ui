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
import { Text } from '@luke-ui/react/text';
import { InputGroup } from '@luke-ui/react/primitives/input-group';
import { Field, FieldLabel } from '@luke-ui/react/primitives/field';
import { ComboboxRoot } from '@luke-ui/react/primitives/combobox';
```

Do not add a root `@luke-ui/react/primitives` barrel. Import each primitive entrypoint explicitly.

## Component creation

Use the component generator for new normal component entrypoints:

```sh
pnpm run generate:component --args <name> <docs-group>
```

Use the primitive generator for new `@luke-ui/react/primitives/*` entrypoints:

```sh
pnpm run generate:primitive --args <name>
```

The component creation rules live in `packages/turbo-generators/src/component-creation-plan.ts`. The
primitive creation rules live in `packages/turbo-generators/src/primitive-creation-plan.ts`. Those
modules own name validation, documentation groups, conformance contracts, and defaults. Turbo and
Plop collect answers and invoke that flow. Keep new creation rules in the plan module so tests can
prove the files, exports, stories, docs, and checks a component or primitive needs.

The component generator creates the component guide's primary
`apps/docs/src/examples/<component>/basic.tsx` example and references it with `ExampleBlock`. The
primitive generator creates `apps/docs/src/examples/<name>-primitive/basic.tsx`, the matching MDX
page under `components/primitives/`, and updates `components/primitives/meta.json`. Replace the
placeholder content with one focused, renderable use of the component or primitive.

Do not move creation rules into one-off generator code.

Public subpath modules live under `src/exports/`. Single-segment subpaths use a flat module such as
`src/exports/button.ts`. Grouped subpaths use nested modules such as
`src/exports/primitives/button.ts`. A component's implementation lives under `src/core/`. Support
modules and multi-part primitives each keep their own file.

## Icons

Icon SVGs live in `packages/@luke-ui/react/icons`. After adding, renaming, or removing one,
regenerate the spritesheet and the `iconNames` union:

```bash
pnpm --dir packages/@luke-ui/react run generate:icons
```

The generated `iconNames` export drives the docs gallery at `/docs/iconography`, so a new icon
appears there with no further changes.
