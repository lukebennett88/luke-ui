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
Split into `primitives/` (base) and `composed/` (opinionated).

## Exports

Managed by `tsdown`. Do not hand-edit `.generated/entries.ts`; it is generated. `package.json#exports` is updated automatically at build.
