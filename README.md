# Luke UI

Luke UI is a React design system built on React Aria Components. It ships static CSS, two bundled
themes, and layout utilities that share a semantic token system.

- [Documentation](https://luke-ui.netlify.app/docs/installation)
- [Components](https://luke-ui.netlify.app/components)

## Features

- **Custom themes.** Ships with two themes. Use `defineTheme` to create your own from a small set of
  colour, typography, radius, and depth choices, or extend a bundled theme. Generated themes include
  light and dark modes and are contrast-validated.
- **Static CSS.** Styles ship as static CSS with no runtime styling layer or React provider.
- **Composed components and primitives.** Start with composed components. Use exported primitives
  when you need more control, or React Aria Components directly.
- **Flexible rendering.** Choose an element with `elementType`, or take over rendering with
  `render`.
- **Built-in loading states.** `pressAction` manages pending state on buttons. Skeletons and
  spinners preserve the footprint of the content they replace.
- **Flexible validation.** Use browser constraints, custom rules, controlled or server errors, or
  hand validation to a form library.
- **Structured typography.** Text is trimmed to its visible bounds. Heading levels can follow
  component structure automatically.
- **Custom icons.** Use the generated spritesheet, or `createIcon` for icons that share the same
  sizing and accessibility behaviour.

## Documentation

The hosted docs are at [luke-ui.netlify.app](https://luke-ui.netlify.app/).

- **Type-checked examples.** Rendered examples are checked against the current public API.
- **Live playground.** Edit examples live with autocomplete and type errors.
- **Generated API reference.** API reference is generated from the public TypeScript and JSDoc
  definitions, keeping it aligned with the package API.

## Development

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
