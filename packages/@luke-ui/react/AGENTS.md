# @luke-ui/react agent guide

- Do not hand-edit `.generated/entries.ts` or `package.json#exports`. `vp pack` generates entries
  and updates exports during build. The `stylesheet` build entry is excluded from the public export
  map via `exports.exclude` in `vite.config.ts`. Vanilla Extract serializes recipes to
  `#recipe-engine`; pack, Vitest, Storybook, and the docs app alias that specifier to
  `src/core/styles/recipe-engine.ts`. Pack then bundles a relative runtime chunk. The specifier is
  not a public package subpath.
- When adding a component, use `pnpm generate:component` from the repo root. Do not create component
  files by hand. The generator updates the style-module registry, conformance manifest, and docs
  wiring.
- Read [`docs/TESTING.md`](../../docs/TESTING.md) before adding or changing component tests. It is
  the only normative testing guide. Component tests use the shared browser renderer; stories are
  documentation and render/a11y fixtures, not assertion files.
- React Compiler is enabled. Do not use `useCallback` or `useMemo` unless there is a specific reason
  the compiler cannot handle.

## Source structure

- `src/core/` holds implementation, styles, test helpers, and their co-located tests, stories, and
  fixtures.
- `src/exports/` holds the thin public modules that pack publishes for each package subpath.
- `src/theme/` holds the theme compiler, foundations, and bundled themes in `bundles/`.
- `src/shared/` holds low-level primitives with no domain of their own, such as the class-name
  constants and the typed object helpers. It exists so a zone never has to duplicate a value or
  reach across a forbidden edge to use one. It stays deliberately small. Do not put component code,
  theme compiler logic, recipes, or other domain-specific implementation there.

`exports` may import from `core`, `theme`, and `shared`. `core` may import from `theme` and
`shared`. `theme` may import from `shared`. `shared` imports from no other zone.

## Component structure

`src/exports/` is the only barrel layer in the package. A component directory holds implementation,
styles, tests, and stories, and its matching `src/exports/` module re-exports directly from those
files. A component directory contains:

- `[component].stories.tsx`: Storybook documentation and render/a11y fixtures
- `[component].browser.test.tsx`: component behaviour, conformance, and the integration tripwire
- `[component].visual.test.tsx`: visual regression captures when the component has a visual surface
- `<component>.tsx`: component implementation
- `recipe.css.ts`: public recipe contract (scaffolded by the generator)
- `styles.css.ts`: private implementation styling when needed

Lower-level composition APIs live under `src/core/primitives/*` and export from
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

### Source-parsing tools

Some components inherit every prop through `DistributiveOmit` and add none of their own. An empty
interface body hides those props from a tool that reads source files without running the TypeScript
compiler:

```ts
type _BlockquoteOmit = DistributiveOmit<TextProps, 'color' | 'elementType'>;

interface _BlockquoteProps extends _BlockquoteOmit {}

export type BlockquoteProps = Prettify<_BlockquoteProps>;
```

When a component adds no props of its own, declare the inherited props the tool should surface in a
documented props interface and extend it from the omit alias. Use indexed access from the source
type so the declaration stays aligned with the resolved type:

```ts
interface BlockquoteStyleProps {
	children?: TextProps['children'];
	className?: TextProps['className'];
	typography?: TextProps['typography'];
}

interface _BlockquoteProps extends _BlockquoteOmit, BlockquoteStyleProps {}
```

Shared lists live in `documented-rac-props.ts` and `documented-intrinsic-props.ts`. See
`DocumentedPressProps` and `CheckboxProps` for the same pattern. Keep `DistributiveOmit` and
`Prettify` — they preserve the editor tooltip these rules exist to provide.

## Documentation

JSDoc and TypeScript types drive the docs app. The normative documentation rules — what to document,
JSDoc, inherited React Aria props, examples, and writing style — live in
[`docs/DOCUMENTATION.md`](../../docs/DOCUMENTATION.md). Do not restate them here.
