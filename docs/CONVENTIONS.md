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

## Testing

Use the smallest test surface that proves the behavior.

- **Unit tests**: pure logic, generators, scripts, docs tooling, package metadata, and non-React utilities. Put these in `src/**/__tests__/**/*.test.ts`.
- **Storybook play tests**: React component behavior that belongs in a real story. For `@luke-ui/react` components, stories are the component tests; do not add separate `*.test.tsx` component tests unless Storybook cannot exercise the behavior cleanly.
- **Storybook visual tests**: public UI states and visual variants worth reviewing for regressions.
- **Browser Vitest tests**: non-component DOM logic that needs real browser APIs and does not fit a story.

## Component Pattern

Wrap `react-aria-components`. Use `composeRenderProps` for styling.

Components follow a three-tier taxonomy (see `CONTEXT.md` for full definitions):

- **Atom** — single conceptual unit used directly by app devs (`Text`, `Link`, `Icon`, `Heading`, `Numeral`, `Emoji`, `LoadingSpinner`). Gets a doc page.
- **Composed** — combines atoms/primitives into a ready-to-drop-in pattern (`Button`, `IconButton`, `CloseButton`, `TextField`, `ComboboxField`). Gets a doc page.
- **Primitive** — building block for library authors only; documented in package docs but not in hosted docs. May be a single file (e.g. `text-input`) or a multi-file kit (e.g. `combobox/*`, `field/*`).

## Package paths

Composed components are exported at their bare name (`@luke-ui/react/button`).
Primitive kits that underpin a composed component are exported at
`[composed]/primitive` (`@luke-ui/react/text-field/primitive`,
`@luke-ui/react/combobox-field/primitive`, `@luke-ui/react/field/primitive`).
The `button/primitive` path follows the same pattern.

## Exports

Managed by `tsdown` entry globs. Do not hand-edit `package.json#exports`.
Create files in paths the package build already discovers.
