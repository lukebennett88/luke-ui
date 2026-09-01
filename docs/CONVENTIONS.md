# Conventions

## TypeScript

Use strict TypeScript. Import types with `import type`. Local imports include the explicit `.js`
extension.

## Formatting

`oxfmt` owns formatting. The repo uses tabs, 100-column wrapping, single quotes in TypeScript, and
double quotes in JSX.

## Linting

`oxlint` owns linting (via `vp lint`). To suppress a rule, explain why in a plain comment, then put
`// oxlint-disable-next-line <plugin>/<rule>` directly above the offending line — the directive
applies to the literal next line, so it cannot sit inside a multi-line comment.

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
- Stories: `*.stories.tsx`.

## Code style

- Prefer `.map()` for one-to-one transforms. Prefer `.filter()` for selection. Prefer `.flatMap()`
  when filtering and mapping are combined. In `.flatMap()`, use an early return for the filtering
  case unless a ternary is clearly easier to read.
- Prefer `for...of` when a transform needs more explicit control or mutation. Prefer `for...of`
  over `.reduce`. Use `.reduce` only when it makes the operation substantially clearer.
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
  `_PATTERN` suffix, including trivial or one-use regexes.

## Testing

See [TESTING.md](TESTING.md) for test type, placement, and writing rules.

Short version:

- Use the smallest test surface that proves the behaviour.
- Colocate tests with the source they cover.
- Test through public APIs and role-based queries.
- Start bug fixes with a failing test that reproduces the bug.

## Components

Components wrap `react-aria-components` and use `composeRenderProps` for styling.

### Element choice

Use `elementType` to change the semantic element without changing the accepted DOM props. Accept
only the elements a component is designed to render.

Use a dedicated component for element-specific behaviour or props. Use `Link` for links and `Button`
for buttons.

Use `render` when its callback must own the element and its DOM attributes. Pass the component's
documented resolved props to that element. Keep `render` and `elementType` mutually exclusive.

Do not add generic polymorphic props, `as`, or `asChild` without a demonstrated need. Apply this
rule to public component APIs, not internal prop handling.

See [COMPONENTS.md](COMPONENTS.md) for component and primitive structure, package paths, and
generator rules.

## Styling

See [STYLING.md](STYLING.md) for cascade layers, recipes, styling utilities, and logical CSS rules.

## Documentation

See [DOCUMENTATION.md](DOCUMENTATION.md) for what to document, writing style, examples, MDX page
structure, and docs freshness rules. It also governs JSDoc and code comments.
