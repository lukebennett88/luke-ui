# @luke-ui/react Agent Guide

- Do not hand-edit `.generated/entries.ts` or `package.json` exports; entries are generated, tsdown updates exports at build.
- When adding a component, use `pnpm generate:component` from repo root (not manual file creation) so the group barrel, styles index, and docs are updated correctly.
- Stories (`*.stories.tsx`) are the tests; there are no separate `*.test.tsx` files.
- React Compiler is enabled — do not use `useCallback` or `useMemo`; the compiler auto-memoizes.

## Component Structure

Each component directory contains:

- `[component].docs.mdx` — documentation (consumed by `apps/docs`)
- `[component].stories.tsx` — Storybook stories (also serve as tests)
- `index.tsx` — component implementation
- `primitive/` — optional primitive exports

## Component Taxonomy

Components follow a three-tier system (Atom/Composed/Primitive). See `docs/CONVENTIONS.md` for definitions.

**Important:** Primitives (exports from `*/primitive/`) are building blocks for library authors only and don't require docs or stories.
