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
