# Turbo Generators

Custom generators for `turbo generate`.

## Generators

- `component`: Scaffolds `@luke-ui/react` components (primitives, stories, package docs) and docs app wrappers, updates docs navigation/content links, then runs `build:tsdown` to refresh tsdown-managed exports.

## Usage

```bash
pnpm generate:component
```

## Structure

- `config.ts`: Registration and actions.
- `templates/`: Handlebars templates.
