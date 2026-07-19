# Luke UI

React design system built with `react-aria-components` and Panda CSS.

## Setup

```sh
pnpm install
pnpm dev
```

Useful repo commands:

- `pnpm run check`: lint, format, and typecheck.
- `pnpm run build`: build all packages and apps.
- `pnpm run test`: run unit, Storybook, and visual regression tests.

## Stack

- Monorepo: pnpm and Turbo.
- React: `react-aria-components`.
- Styling: Panda-generated static CSS.
- Lint and format: `oxlint` and `oxfmt`.

## Package

`@luke-ui/react` contains the public React package.

- Theme contract and compiler: `packages/@luke-ui/react/src/theme/`.
- Styles: `packages/@luke-ui/react/src/styles/`.
- Build output: `packages/@luke-ui/react/dist/stylesheet.css`.

## Docs

- [Conventions](docs/CONVENTIONS.md): repo-wide coding conventions.
- [Components](docs/COMPONENTS.md): component tiers, package paths, and generator rules.
- [Documentation](docs/DOCUMENTATION.md): hosted docs ownership, MDX structure, examples, and API
  reference.
- [Styling](docs/STYLING.md): cascade layers, recipes, and styling utilities.
- [Testing](docs/TESTING.md): test type, placement, and writing rules.
- [Visual testing](docs/VISUAL_TESTING.md): visual regression workflow.

## Contributing

Run `pnpm run check` before committing.

Use `pnpm changeset` when a change needs a package version entry.
