# Conventions

## TypeScript

Import types with `import type`. Local imports include the explicit `.js` extension.

Only modules in `src/exports/` re-export symbols defined in another module. Internal code imports
symbols directly from their defining modules.

Derive helper parameter and result types from existing props or domain types with `Pick`, indexed
access, or `ComponentProps` when they describe the same contract. Do not widen a public prop by
copying its shape by hand.

## Formatting and linting

`oxfmt` owns formatting and `oxlint` owns linting, both through `vp`. The syntax pass reports unused
disable directives as errors. Type-aware passes do not run the syntax rules, so they do not repeat
that check. Use a scoped configuration override for an intentional exception to a type-aware rule.
Matching overrides for the same rule replace each other rather than merge.

To suppress a rule, explain why in a plain comment, then put
`// oxlint-disable-next-line <plugin>/<rule>` directly above the offending line. The directive
applies to the literal next line, so it cannot sit inside a multi-line comment.

## React

`@luke-ui/react` is built with the React Compiler. Do not add `useMemo`, `useCallback`, or `memo`
for performance there. Pass plain objects as context values, because the compiler memoises them. The
docs and reference apps are not compiled and may use those hooks when they earn their keep.

Keep state that must transition together in one value. Model an async load's status, data, and error
as a discriminated union so impossible combinations cannot be represented. Keep independent state
separate, and derive values instead of storing duplicates. Use a reducer when named transitions make
complex update logic easier to follow.

Reserve effects for synchronising with systems outside React. To reset state when a prop changes,
remount with `key` or derive the value during render. Event handlers read values from the render
that created them, not from a ref that mirrors state.

The docs app does not use React Server Components. Do not add `'use client'` directives there.

## Reuse

Use utilities the repo already ships: `cx` from `@luke-ui/react/utils` for class names, `zod`
schemas for validating untrusted data (URL state, `postMessage` payloads, results from JSON.parse),
and `react-error-boundary` in the docs app for error boundaries.

Author sample or template code as real `.tsx` files imported with `?raw` so it stays typechecked,
not as inline string constants.

## Naming

Name components in `PascalCase` (`IconButton`), props types `<Component>Props` (`ButtonProps`),
files in `kebab-case` (`icon-button.tsx`), and style modules `*.css.ts`.

## Code style

- Prefer `.map()` for one-to-one transforms and `.filter()` for selection. Prefer `.flatMap()` when
  filtering and mapping are combined, with an early return for the filtering case unless a ternary
  is clearly easier to read.
- Prefer `for...of` over `.forEach` and `.reduce`, especially when a loop needs mutation, `break`,
  `continue`, or an early exit. Use `.reduce` only when it makes the operation substantially
  clearer.
- Use a `Map` or `Set` for repeated lookup or deduplication instead of scanning arrays inside loops.
- Prefer `function` declarations for named helpers. Use an arrow when a short implicit return is
  clearer, or when assigning a named function type. Use an explicit `return` when an arrow body
  wraps across multiple lines.
- Prefer early returns when a branch finishes the current function.
- Prefer a ternary for a simple two-way branching assignment. Do not nest ternaries. Multiple
  independent simple ternaries are fine.
- For three or more branches on the same value, use `switch` or flat early returns, whichever scans
  more easily. For a pure key-to-value mapping, use a `Record` or lookup object. Consider whether a
  boolean should be a union, in which case a lookup object is often the better design.
- Put the exported entry point first, with supporting constants and helpers below it. Place a
  non-hoisted constant before the helper that uses it.
- Scope branching or search mutation in an inline IIFE when that improves locality. Return one
  escaping value directly, or several as an object.
- Extract multi-step object construction into its own function only when it would otherwise mix with
  unrelated logic.
- Define every static regex as a named module-scope `SCREAMING_SNAKE_CASE` constant with a
  `_PATTERN` suffix, including trivial or one-use regexes. Regexes with `g` or `y` are stateful when
  used with `.test()` or `.exec()`, because they mutate `lastIndex`.

## Components

Components wrap `react-aria-components` and use `composeRenderProps` for styling.

Use function components. Keep JSX inline, or extract a module-scope component rendered as `<Name />`
when it needs its own structure. Do not define a component inside another component or call a nested
`render*()` helper to produce JSX. Callbacks required by React Aria and Luke UI render-prop APIs,
including `composeRenderProps`, `renderRoot`, and `render<Name>`, are fine.

### Exported prop types

For components in `@luke-ui/react`, define an internal `_ComponentProps` interface and export
`ComponentProps` wrapped in `Prettify` from `src/core/types/prettify.ts`. Prefer `interface extends`
over intersections so IDEs display prop types clearly.

Extend the source type directly when inheriting its whole surface:

```ts
interface _CodeProps extends React.ComponentProps<'code'> {}

export type CodeProps = Prettify<_CodeProps>;
```

When removing inherited props, declare a named `DistributiveOmit` alias before extending it, because
interfaces cannot extend conditional types directly:

```ts
type _ComponentOmit = DistributiveOmit<SourceType, OmittedKeys>;

interface _ComponentProps extends _ComponentOmit, StyleProps {
	/** Documented prop. */
	myProp?: string;
}

export type ComponentProps = Prettify<_ComponentProps>;
```

Use `DistributiveOmit` from `src/core/types/distributive-omit.ts` only when removing props. Its
strict key constraint checks the omitted keys. Do not use `DistributiveOmit<SourceType, never>`.

### Element choice

`elementType`, `renderRoot`, and `render<Part>` are **opt-in capabilities**, not universal component
props. A component that exposes one uses the Luke UI name.

Prefer recipes, dedicated components (`Link` for links, `Button` for buttons), and state-aware
`className`/`style` over root replacement. Interactive controls keep fixed semantics unless a
concrete composition need is demonstrated. When polymorphism is justified:

- Use `elementType` to choose a supported semantic or structural element without changing the
  accepted DOM props. Accept only the elements that component is designed to render.
- Use `renderRoot` when a caller must own the root element and its DOM attributes, including
  Luke-owned layout and typography roots such as `Box` and `Text`. Keep `elementType` and
  `renderRoot` mutually exclusive.
- Use `render<Name>` only for a deliberately replaceable named part. Children-as-function and
  state-aware `className`/`style` are not root replacement.

`renderRoot` and `render<Name>` callbacks receive `(domProps, state)`. The first argument contains
resolved presentation props. Pass an empty object as the second argument when the component has no
public render state.

Keep React Aria's `render` only when a documented integration needs its host-prop merging while
preserving its component semantics, as `Link` does for MDX anchors. Do not keep RAC `render` as a
second root-replacement API.

Do not add generic polymorphic props, `as`, or `asChild` to public component APIs without a
demonstrated need. Internal prop handling is exempt.
