# Conventions

## TypeScript

Use strict TypeScript. Import types with `import type`. Local imports include the explicit `.js`
extension.

## Formatting

`oxfmt` owns formatting. The repo uses tabs, 100-column wrapping, single quotes in TypeScript, and
double quotes in JSX.

## Naming

- Components: `PascalCase`, for example `Button.tsx`.
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

See [COMPONENTS.md](COMPONENTS.md) for component tiers, package paths, and generator rules.

## Styling

See [STYLING.md](STYLING.md) for cascade layers, recipes, styling utilities, and logical CSS rules.

## Documentation

See [DOCUMENTATION.md](DOCUMENTATION.md) for docs ownership, MDX page structure, examples, API
reference, and docs freshness rules.
