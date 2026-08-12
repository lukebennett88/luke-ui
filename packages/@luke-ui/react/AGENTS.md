# @luke-ui/react agent guide

- Do not hand-edit `.generated/entries.ts` or `package.json#exports`. Entries are generated, and
  `vp pack` updates exports during build. The `build:done` hook in `vite.config.ts` runs
  `scripts/finalize-package-manifest.ts` to strip internal-only pack entries from the public export
  map and wire the private `#recipe-engine` import. Pack `alias` resolves `#recipe-engine` to source
  during the build. This runs after each pack, including watch mode.
- When adding a component, use `pnpm generate:component` from the repo root. Do not create component
  files by hand. The generator updates the stylesheet manifest, conformance manifest, and docs
  wiring.
- Read [`docs/TESTING.md`](../../docs/TESTING.md) before adding or changing component tests. It is
  the only normative testing guide. Component tests use the shared browser renderer; stories are
  documentation and render/a11y fixtures, not assertion files.
- React Compiler is enabled. Do not use `useCallback` or `useMemo` unless there is a specific reason
  the compiler cannot handle.

## Component structure

A component directory contains:

- `[component].stories.tsx`: Storybook documentation and render/a11y fixtures
- `[component].browser.test.tsx`: component behaviour, conformance, and the integration tripwire
- `[component].visual.test.tsx`: visual regression captures when the component has a visual surface
- `index.tsx`: component implementation
- `recipe.css.ts`: public recipe contract (scaffolded by the generator)
- `styles.css.ts`: private implementation styling when needed

Lower-level composition APIs live under `src/primitives/*` and export from
`@luke-ui/react/primitives/*`. See [`docs/COMPONENTS.md`](../../docs/COMPONENTS.md).

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

## Documentation

JSDoc and TypeScript types drive the docs app. The normative documentation rules — what to document,
JSDoc, inherited React Aria props, examples, and writing style — live in
[`docs/DOCUMENTATION.md`](../../docs/DOCUMENTATION.md). Do not restate them here.
