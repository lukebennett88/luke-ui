# Conventions

## TypeScript

Use strict TypeScript. Import types with `import type`. Local imports include the explicit `.js`
extension.

Only modules in `src/exports/` re-export symbols defined in another module. Internal code imports
symbols directly from their defining modules.

Derive helper parameters and result types from existing props or domain types with `Pick`, indexed
access, or `ComponentProps` when they describe the same contract. Keep an independent type when the
helper has a different contract. Do not widen a public prop by copying its shape by hand.

## Formatting

`oxfmt` owns formatting. The repo uses tabs, 100-column wrapping, single quotes in TypeScript, and
double quotes in JSX.

## Linting

`oxlint` owns linting (via `vp lint`). Configure rules in the `lint` block of the root
`vite.config.ts`. Matching overrides for the same rule replace rather than merge with each other. To
suppress a rule, explain why in a plain comment, then put
`// oxlint-disable-next-line <plugin>/<rule>` directly above the offending line — the directive
applies to the literal next line, so it cannot sit inside a multi-line comment.

## React Compiler

The package is built with the React Compiler, so do not add `useMemo`, `useCallback` or `memo` for
performance. Pass plain objects as context values, because the compiler memoises them.

## State modelling

Keep state that must transition together in one state value. For an async load, model status, data,
and error as a discriminated union so impossible combinations cannot be represented. Keep
independent state separate and derive values instead of storing duplicates. A single `useState` is
sufficient when replacing the whole value keeps transitions clear. Use a reducer when named
transitions make more complex update logic easier to follow.

## Effects

Do not use `useEffect` to reset state when a prop changes, or to mirror React state into a ref for
event handlers. Prefer remounting with `key`, deriving values during render, or reading values from
the render that created the handler. Reserve effects for synchronising with systems outside React.

## Server Components

The docs app does not use React Server Components. Do not add `'use client'` directives there.

## Reuse

Prefer utilities the repo already ships over hand-rolling: `cx` from `@luke-ui/react/utils` for
class names, `zod` schemas for validating untrusted data (URL state, `postMessage` payloads, results
from JSON.parse), and `react-error-boundary` in the docs app for error boundaries.

Author sample or template code as real `.tsx` files imported with `?raw` so it stays typechecked,
not as inline string constants.

## Naming

- Components: `PascalCase`, for example `IconButton`.
- Props: `PascalCaseProps`, for example `ButtonProps`.
- Files: `kebab-case`, for example `icon-button.tsx`.
- CSS: `*.css.ts`.

## Code style

- Prefer `.map()` for one-to-one transforms. Prefer `.filter()` for selection. Prefer `.flatMap()`
  when filtering and mapping are combined. In `.flatMap()`, use an early return for the filtering
  case unless a ternary is clearly easier to read.
- Prefer `for...of` when a transform needs more explicit control or mutation. Prefer `for...of` over
  `.reduce`. Use `.reduce` only when it makes the operation substantially clearer.
- Prefer `Map` or `Set` for repeated lookup or deduplication. Do not repeatedly scan arrays inside
  loops.
- Prefer `function` declarations for named helpers. Use an arrow when a short implicit return is
  clearer, or when assigning a named function type. Prefer an explicit `return` when an arrow body
  wraps across multiple lines.
- Prefer early returns when a branch finishes the current function.
- Prefer a ternary for a simple two-way branching assignment. Do not nest ternaries. Multiple
  independent simple ternaries are fine.
- For three or more branches on the same value, use `switch` when it makes the branches easier to
  scan. Flat early returns are also fine. For a pure key-to-value mapping, use a `Record` or lookup
  object. Consider whether a value modelled as a boolean should actually be a union, in which case a
  lookup object is often the better design.
- Prefer `for...of` over `.forEach` for side-effect iteration, especially when `break`, `continue`,
  or early exit helps.
- Put the exported entry point first. Put supporting constants and helpers below it. If a helper
  uses a non-hoisted constant, place that constant before the helper.
- Keep branching or search mutation scoped with an inline IIFE when that improves locality. If only
  one value escapes, return that value directly. If multiple values escape, return an object.
- Extract multi-step object construction into its own function only when the construction would
  otherwise mix with unrelated logic.
- Define every static regex as a named module-scope `SCREAMING_SNAKE_CASE` constant with a
  `_PATTERN` suffix, including trivial or one-use regexes. Regexes with `g` or `y` are stateful when
  used with `.test()` or `.exec()`, because they mutate `lastIndex`.

## Testing

See [TESTING.md](TESTING.md) for test type, placement, and writing rules.

## Components

Components wrap `react-aria-components` and use `composeRenderProps` for styling.

Use function components. Keep JSX inline, or extract a module-scope component rendered as `<Name />`
when it needs its own structure. Do not define a component inside another component or call a nested
`render*()` helper to produce JSX. Keep callbacks required by React Aria and Luke UI render-prop
APIs, including `composeRenderProps`, `renderRoot`, and `render<Name>`.

### Exported prop types

For components in `@luke-ui/react`, define an internal `_ComponentProps` interface and export
`ComponentProps` wrapped in `Prettify` from `src/core/types/prettify.ts`. Prefer `interface extends`
over intersections for prop types so IDEs display them clearly.

Extend the source type directly when inheriting its whole surface:

```ts
interface _CodeProps extends React.ComponentProps<'code'> {}

export type CodeProps = Prettify<_CodeProps>;
```

When removing inherited props, declare a named `DistributiveOmit` alias before extending it.
Interfaces cannot extend conditional types directly:

```ts
type _ComponentOmit = DistributiveOmit<SourceType, OmittedKeys>;

interface _ComponentProps extends _ComponentOmit, StyleProps {
	/** Documented prop. */
	myProp?: string;
}

export type ComponentProps = Prettify<_ComponentProps>;
```

Use `DistributiveOmit` from `src/core/types/distributive-omit.ts` only when removing props. Its
strict key constraint checks omitted keys. Do not use `DistributiveOmit<SourceType, never>`.

### Element choice

`elementType`, `renderRoot`, and `render<Part>` are **opt-in capabilities**, not universal component
props. Consistent naming means that when a component exposes one of these seams, it uses the Luke UI
name and `(domProps, state)` contract. It does not mean every component exposes them.

Prefer recipes, dedicated components (`Link` for links, `Button` for buttons), and state-aware
`className`/`style` over root replacement. Interactive controls keep fixed semantics unless a
concrete composition need is demonstrated.

When polymorphism is justified:

- Use `elementType` to choose a supported semantic or structural element without changing the
  accepted DOM props. Accept only the elements that component is designed to render.
- Use `renderRoot` when a caller must own the root element and its DOM attributes. Keep
  `elementType` and `renderRoot` mutually exclusive.
- Use `render<Name>` only for a deliberately replaceable named part. Do not conflate children-as-
  function or state-aware `className`/`style` with root replacement.

Do not rename React Aria's `render` to `renderRoot` just because a wrapper exists. Keep RAC `render`
only where that seam is itself the demonstrated composition API (for example merging host attributes
onto `Link`). Otherwise omit it. Prefer Luke UI `renderRoot` for Luke-owned layout and typography
roots such as `Box` and `Text`.

Luke UI `renderRoot` and `render<Name>` callbacks receive `(domProps, state)`. The first argument
contains resolved presentation props. Pass an empty object as the second argument when the component
has no public render state.

Do not add generic polymorphic props, `as`, or `asChild` without a demonstrated need. Apply this
rule to public component APIs, not internal prop handling.

See [COMPONENTS.md](COMPONENTS.md) for component and primitive structure, package paths, and
generator rules.

## Styling

See [STYLING.md](STYLING.md) for cascade layers, recipes, styling utilities, and logical CSS rules.

## Documentation

See [DOCUMENTATION.md](DOCUMENTATION.md) for what to document, writing style, examples, MDX page
structure, and docs freshness rules. It also governs JSDoc and code comments.
