# @luke-ui/react agent guide

- Do not hand-edit `.generated/entries.ts` or `package.json#exports`. Entries are generated, and
  `tsdown` updates exports during build.
- When adding a component, use `pnpm generate:component` from the repo root. Do not create component
  files by hand. The generator updates group barrels, the styles index, and docs wiring.
- Stories (`*.stories.tsx`) are the component tests. Do not add separate `*.test.tsx` component
  tests unless Storybook cannot exercise the behaviour. Follow the story authoring and play-function
  guidance in `docs/TESTING.md#writing-stories`.
- React Compiler is enabled. Do not use `useCallback` or `useMemo` unless there is a specific reason
  the compiler cannot handle.

## Component structure

A component directory contains:

- `[component].stories.tsx`: Storybook stories that also serve as tests
- `index.tsx`: component implementation
- `primitive/`: optional primitive exports

## Exported prop types

Define exported component props with an interface extending a named `DistributiveOmit` alias, then
wrap it with `Prettify`:

```ts
type _ComponentOmit = DistributiveOmit<SourceType, OmittedKeys>;

interface _ComponentProps extends _ComponentOmit, StyleProps {
	/** Documented prop. */
	myProp?: string;
}

export type ComponentProps = Prettify<_ComponentProps>;
```

Rules:

- Use `interface extends` — avoid type intersections (`&`) for prop types. Interfaces display
  clearly in IDE tooltips and extend naturally.
- Wrap the exported type with `Prettify` from `../types/prettify.js` so consumers see a flat,
  readable type in their IDE.
- Use `DistributiveOmit` from `../types/distributive-omit.js` for prop omission. Its strict key
  constraint validates and autocompletes omitted keys, so misspelled or obsolete keys cannot pass
  silently. Define a named alias because interfaces cannot extend conditional types directly.
- Name the internal interface `_ComponentProps` (underscore prefix) and export the Prettified
  version as `ComponentProps`.

## Component taxonomy

Components follow the Atom, Composed, and Primitive taxonomy. See `docs/CONVENTIONS.md` for
definitions.

Primitives exported from `*/primitive/` are building blocks for library authors. They are not
promoted in beginner app-developer navigation, but they are public API and should have enough
documentation in the hosted docs app for power users and agents.

## Documentation

JSDoc and TypeScript types drive the docs app.

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
- Long-tail inherited props are covered by the docs app's "Extends" pointer.
