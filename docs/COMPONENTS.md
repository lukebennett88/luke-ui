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

Primitive scaffolding is not handled by the component generator.

Public subpath `index.ts` files are export-only. A component's implementation lives in a named
sibling file. Support modules and multi-part primitives each keep their own file.

The component creation rules live in `packages/turbo-generators/src/component-creation-plan.ts`.
That module owns component-name validation, documentation groups, conformance tiers, and defaults.
Turbo and Plop collect answers and invoke that flow. Keep new creation rules in the plan module so
tests can prove the files, exports, stories, docs, and checks a component needs.

The generator creates the component guide's primary `apps/docs/src/examples/<component>/basic.tsx`
example and references it with `ExampleBlock`. Replace the placeholder content with one focused,
renderable use of the component.

Do not move creation rules into one-off generator code.

## Icons

Icon SVGs live in `packages/@luke-ui/react/icons`. After adding, renaming, or removing one,
regenerate the spritesheet and the `iconNames` union:

```bash
pnpm --dir packages/@luke-ui/react run generate:icons
```

The generated `iconNames` export drives the docs gallery at `/docs/iconography`, so a new icon
appears there with no further changes.
