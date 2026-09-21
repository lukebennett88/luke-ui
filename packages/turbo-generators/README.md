# Turbo Generators

Custom generators for `turbo generate`.

## Generators

- `component`: Scaffolds a component, recipe, browser test, and hosted docs.
- `primitive`: Scaffolds a primitive, recipe, browser test, and public export.

The component generator asks for name, docs group, and whether to add visual coverage. The primitive
generator asks for name, whether to add hosted docs, and whether to add visual coverage.

Generated component and primitive folders use a named implementation file. Public modules live in
`src/exports/`.

Generated browser tests cover DOM forwarding and axe, with optional visual coverage and one
behavioural TODO. See [`docs/TESTING.md`](../../docs/TESTING.md).

## Usage

```bash
pnpm generate:component
pnpm generate:primitive
```

## Structure

- `config.ts`: Turbo/Plop adapter that collects answers and invokes the creation flow.
- `src/component-creation-plan.ts`: Component generator rules, answer parsing, and planned files.
- `src/primitive-creation-plan.ts`: Primitive generator rules, answer parsing, and planned files.
- `src/apply-creation-plan.ts`: Applies parsed creation plans to the repository.
- `src/apply-component-creation-plan.ts`: Applies a parsed component scaffold to the repository.
- `src/apply-primitive-creation-plan.ts`: Applies a parsed primitive scaffold to the repository.
