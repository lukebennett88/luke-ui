# Conventions

## TypeScript

Strict mode. Use `import type`. Explicit `.js` extensions for local imports.

## Formatting

Managed by `oxfmt`. Tabs, 2 width, 80 width, single quotes (TS), double quotes (JSX).

## Naming

- **Components**: `PascalCase` (`Button.tsx`)
- **Props**: `PascalCaseProps` (`ButtonProps`)
- **Files**: `kebab-case` (`close-button.tsx`)
- **CSS**: `*.css.ts`
- **Stories**: `*.stories.tsx`

## Component Pattern

Wrap `react-aria-components`. Use `composeRenderProps` for styling.

Components follow a three-tier taxonomy (see `CONTEXT.md` for full definitions):

- **Atom** — single conceptual unit used directly by app devs (`Text`, `Link`, `Icon`, `Heading`, `Numeral`, `Emoji`, `LoadingSpinner`). Gets a doc page.
- **Composed** — combines atoms/primitives into a ready-to-drop-in pattern (`Button`, `IconButton`, `CloseButton`, `TextField`, `ComboboxField`). Gets a doc page.
- **Primitive** — building block for library authors only; never doc'd publicly. May be a single file (e.g. `text-input`) or a multi-file kit (e.g. `combobox/*`, `field/*`).

## Package paths

Composed components are exported at their bare name (`@luke-ui/react/button`).
Primitive kits that underpin a composed component are exported at
`[composed]/primitive` (`@luke-ui/react/text-field/primitive`,
`@luke-ui/react/combobox-field/primitive`, `@luke-ui/react/field/primitive`).
The `button/primitive` path follows the same pattern.

## Exports

Managed by `tsdown`. Do not hand-edit `.generated/entries.ts`; it is generated. `package.json#exports` is updated automatically at build.
