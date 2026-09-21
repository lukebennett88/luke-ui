# Luke UI

Luke UI is a React design system built on React Aria Components. It ships static CSS, two bundled
themes, and layout utilities that share a semantic token system.

## Features

- Custom themes with light/dark modes and contrast validation
- Static CSS with no runtime styling layer; theming does not require a React provider
- Composed components, exported primitives, and React Aria Components underneath
- Built-in async and loading states
- Browser, custom, server, and form-library validation
- Text trimming and automatic heading levels
- Flexible rendering with `elementType` and `render`
- Generated SVG icon spritesheet with type-safe icon names, plus `createIcon` for custom icons

## Documentation

- **Type-checked examples.** Rendered examples are checked against the current public API.
- **Live playground.** Write and preview Luke UI code with autocomplete and type errors.
- **Generated prop tables.** Prop tables are generated from the public TypeScript and JSDoc
  definitions, keeping them aligned with the package API.

## Development

```sh
pnpm install
pnpm dev
```

Useful repo commands:

- `pnpm run check`: lint, format, and typecheck.
- `pnpm run build`: build all packages and apps.
- `pnpm run test`: run tests.

## Stack

- Monorepo: pnpm and Turbo.
- React: `react-aria-components`.
- Styling: Vanilla Extract static CSS.
- Lint and format: `oxlint` and `oxfmt`.

## Repository guides

- [Conventions](docs/CONVENTIONS.md): repo-wide coding conventions.
- [Components](docs/COMPONENTS.md): component and primitive structure, package paths, and generator
  rules.
- [Dependencies](docs/DEPENDENCIES.md): the catalog, the release quarantine, and Renovate.
- [Documentation](docs/DOCUMENTATION.md): what to document, writing style, examples, and MDX
  structure.
- [Styling](docs/STYLING.md): cascade layers, recipes, and styling utilities.
- [Testing](docs/TESTING.md): test type, placement, and writing rules.
- [Visual testing](docs/VISUAL_TESTING.md): visual regression workflow.

## Contributing

Run `pnpm run check` before committing.

`@luke-ui/react` is not published before `1.0.0`, so changes do not need a changeset. See
[docs/DEPENDENCIES.md](docs/DEPENDENCIES.md) for the full rule.
