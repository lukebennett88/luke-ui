# Luke UI

Luke UI is a React design system built on React Aria Components. It ships static CSS, two theme
packages (Tactile and Paper), and layout utilities that share a semantic token system.

## Features

- Custom themes compiled at build time, with light and dark modes and contrast validation
- Static CSS with no runtime styling layer. Theming does not require a React provider
- Composed components, exported primitives, and React Aria Components underneath
- Built-in async and loading states
- Browser, custom, server, and form-library validation
- Text trimming and automatic heading levels
- Opt-in root composition with `elementType`, `renderRoot`, and named render callbacks
- Generated SVG icon spritesheet with type-safe icon names, plus `createIcon` for custom icons

## Documentation

Rendered examples are typechecked against the public API. The live playground previews Luke UI code
with autocomplete and type errors. Prop tables come from public TypeScript and JSDoc.

## Development

```sh
pnpm install
pnpm dev:docs
```

Useful repo commands:

- `pnpm run check`: barrels, format, lint, types, docs, cycles, and unused code.
- `pnpm run build`: build all packages and apps.
- `pnpm run test`: run every test suite, including packed consumers and Docker visual comparison.
- `pnpm run dev:reference-app`: develop the consumer reference app.

See [Workflows](docs/WORKFLOWS.md) for focused commands, generation, fixing, cleaning, and task
orchestration. Authoritative visual tests require Docker and access to GitHub baseline artefacts.

## Stack

- Monorepo: pnpm and Turbo.
- React: `react-aria-components`.
- Styling: Vanilla Extract static CSS.
- Styling utilities: a fork of [Rainbow Sprinkles](https://github.com/wayfair/rainbow-sprinkles) by
  Wayfair, MIT licensed.
- Lint and format: `oxlint` and `oxfmt`.

## Repository guides

- [Conventions](docs/CONVENTIONS.md): repo-wide coding conventions.
- [Components](docs/COMPONENTS.md): component and primitive structure, package paths, and generator
  rules.
- [Dependencies](docs/DEPENDENCIES.md): the catalog, the release quarantine, and Renovate.
- [Documentation](docs/DOCUMENTATION.md): what to document, writing style, examples, and MDX
  structure.
- [Public API](docs/PUBLIC_API.md): public exports, props, and types.
- [Styling](docs/STYLING.md): cascade layers, recipes, and styling utilities.
- [Testing](docs/TESTING.md): test type, placement, and writing rules.
- [Visual testing](docs/VISUAL_TESTING.md): visual regression workflow.
- [Workflows](docs/WORKFLOWS.md): commands, prerequisites, task orchestration, and CI.

## Contributing

Start with the [agent guide and skill index](AGENTS.md). The
[implementation workflow](.agents/skills/work-on-issue/SKILL.md) owns verification and task
delivery. See [Changesets](docs/DEPENDENCIES.md#changesets) for release metadata.
