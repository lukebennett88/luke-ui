# Components

Use this guide when you add or change a public component in `@luke-ui/react`.

## Component tiers

Luke UI uses three component tiers. The tier decides the export path, docs page, and audience.

| Tier      | Audience        | Rule                                                                                                     | Examples                                                                                  |
| --------- | --------------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Atom      | App developers  | Presents one conceptual unit. It may compose other atoms internally, but consumers treat it as one unit. | `Text`, `Link`, `Icon`, `Heading`, `Numeral`, `Emoji`, `LoadingSpinner`                   |
| Composed  | App developers  | Combines atoms and primitives into an opinionated, ready-to-use pattern.                                 | `Button`, `IconButton`, `TextField`, `ComboboxField`                                      |
| Primitive | Library authors | Provides lower-level public API for composed components or custom components.                            | `button/primitive`, `field/primitive`, `text-field/primitive`, `combobox-field/primitive` |

A primitive can be one component, such as `TextInput`, or a group of related components, such as the
combobox primitives.

Do not call atoms or primitives "base" or "raw" in source comments or docs. Use the tier name.

`Field` is a primitive even though it composes other components. App developers reach field UI
through wrappers such as `TextField` and `ComboboxField`.

## Package paths

Atoms and composed components export from their bare package path:

```ts
import { Button } from '@luke-ui/react/button';
import { Text } from '@luke-ui/react/text';
```

Primitives that support a composed component export from `[composed]/primitive`:

```ts
import { TextInput } from '@luke-ui/react/text-field/primitive';
import { Field, FieldLabel } from '@luke-ui/react/field/primitive';
import { ComboboxRoot } from '@luke-ui/react/combobox-field/primitive';
```

Do not add top-level primitive paths such as `@luke-ui/react/field` or `@luke-ui/react/text-input`.
The `/primitive` segment makes the lower-level audience visible.

Keep primitives public when consumers need them to build custom composed components. Do not make a
primitive internal only to simplify the export map.

## Component creation

Use the generator for new atoms and composed components:

```sh
pnpm run generate:component --args <name> <atom|composed> <docs-group> <recipe|none>
```

The component creation rules live in `packages/turbo-generators/src/component-creation-plan.ts`.
Turbo and Plop are adapters that apply the plan. Keep new creation rules in the plan module so
dry-run tests can prove which files, exports, stories, docs, and checks a component needs.

Do not move creation rules into one-off generator code.
