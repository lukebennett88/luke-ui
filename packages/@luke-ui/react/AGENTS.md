# @luke-ui/react agent guide

- Do not hand-edit `.generated/entries.ts` or `package.json#exports`. Entries are generated, and
  `tsdown` updates exports during build.
- When adding a component, use `pnpm generate:component` from the repo root. Do not create component
  files by hand. The generator updates group barrels, the styles index, and docs wiring.
- Stories (`*.stories.tsx`) are the component tests. Do not add separate `*.test.tsx` component
  tests unless Storybook cannot exercise the behaviour.
- React Compiler is enabled. Do not use `useCallback` or `useMemo` unless there is a specific reason
  the compiler cannot handle.

## Component structure

A component directory contains:

- `[component].docs.md`: authored usage guidance consumed by the docs generator
- `[component].stories.tsx`: Storybook stories that also serve as tests
- `index.tsx`: component implementation
- `primitive/`: optional primitive exports

## Component taxonomy

Components follow the Atom, Composed, and Primitive taxonomy. See `docs/CONVENTIONS.md` for
definitions.

Primitives exported from `*/primitive/` are building blocks for library authors. They are not
promoted in beginner app-developer navigation, but they are public API and should have enough
generated documentation for power users and agents.

## Documentation generation

JSDoc and TypeScript types drive generated docs under `docs/`.

When adding or modifying a component:

- Function-level JSDoc on the exported component should describe the component for an app developer.
- The exported `Props` interface must carry an `@tier` JSDoc tag: `atom`, `composed`, or
  `primitive`.
- Each prop should have JSDoc. If the component destructures a default value, include an `@default`
  tag.
- Atom and composed components should re-declare important inherited `react-aria-components` props
  on the package's own interface with full JSDoc. Use the passthrough pattern, for example
  `isDisabled?: RACButtonProps['isDisabled']`.
- Do not re-declare every React Aria Components prop. Re-declare only props an app developer is
  likely to reach for.
- Long-tail inherited props are covered by the generated "Extends" pointer.

## Generated docs

Generated docs are ignored by Git. After changing JSDoc or `.docs.md` prose, run:

```sh
pnpm --filter @luke-ui/react generate:docs
```

Use `pnpm --filter @luke-ui/react check:docs` as a smoke test that the generator is healthy. It is
not a stale-file check because generated output is ignored.

## Dev loop

During `pnpm dev` or `turbo dev`, the docs app does two things:

1. Watches generated `docs/*.md` files and hot-reloads pages when they change.
2. Watches `src/**/*.{ts,tsx,docs.md}` in the package and re-runs `generate:docs` on change,
   debounced by about 300ms.

The loop is the same for prose and JSDoc edits:

1. Edit `[component].docs.md`, `index.tsx` JSDoc, or prop types.
2. Save.
3. The generator re-runs, `docs/*.md` updates, and the page reloads.

If the generator fails during a mid-edit syntax error, the dev server logs the error and keeps
running. The next successful save regenerates the docs.
