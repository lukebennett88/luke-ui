# @luke-ui/react Agent Guide

- Do not hand-edit `.generated/entries.ts` or `package.json` exports; entries are generated, tsdown updates exports at build.
- When adding a component, use `pnpm generate:component` from repo root (not manual file creation) so the group barrel, styles index, and docs are updated correctly.
- Stories (`*.stories.tsx`) are the tests; there are no separate `*.test.tsx` files.
- React Compiler is enabled — do not use `useCallback` or `useMemo`; the compiler auto-memoizes.

## Component Structure

Each component directory contains:

- `[component].docs.md` — authored usage guidance consumed by the docs generator
- `[component].stories.tsx` — Storybook stories (also serve as tests)
- `index.tsx` — component implementation
- `primitive/` — optional primitive exports

## Component Taxonomy

Components follow a three-tier system (Atom/Composed/Primitive). See `docs/CONVENTIONS.md` for definitions.

**Important:** Primitives (exports from `*/primitive/`) are building blocks for library authors. They are not promoted in beginner app-developer navigation, but they are part of the public API and should have enough generated documentation for power users and agents.

## Documentation Generation

JSDoc and TypeScript types drive generated docs under `docs/`. When adding or modifying a component:

- Function-level JSDoc on the exported component describes what it is for an app developer.
- The exported `Props` interface carries an `@tier` JSDoc tag (`atom`, `composed`, or `primitive`).
- Each prop has JSDoc and, where defaults exist in the React component destructure, an `@default` tag.
- For atom and composed components, re-declare important props inherited from `react-aria-components` on the package's own interface with full JSDoc so they appear in the generated own-props table. Use the type passthrough pattern: `isDisabled?: RACButtonProps['isDisabled']`. Do not re-declare every RAC prop; only include load-bearing props an app developer will reach for.
- The long tail of inherited props is covered by the generated extends pointer.

Co-located prose (`*.docs.md`) explains usage judgement. The generator splices it into the rendered page. Do not put props tables, import blocks, or component descriptions in `*.docs.md`; those are generated.

Run `pnpm --filter @luke-ui/react generate:docs` to regenerate `docs/`. CI fails on stale docs via `pnpm --filter @luke-ui/react check:docs`.
