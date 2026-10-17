# Turbo Generators

Custom generators for `turbo generate`.

## Generators

- `component`: Scaffolds a component, recipe, browser test, and hosted docs.
- `primitive`: Scaffolds a primitive, recipe, browser test, and public export.

See [Component creation](../../docs/COMPONENTS.md#component-creation) for commands, arguments, and
scaffold rules, and [TESTING.md](../../docs/TESTING.md) for the generated tests' contracts.

## Structure

- `config.ts`: Turbo/Plop adapter that collects answers and invokes the creation flow.
- `src/component-creation-plan.ts`: Component generator rules, answer parsing, and planned files.
- `src/primitive-creation-plan.ts`: Primitive generator rules, answer parsing, and planned files.
- `src/apply-creation-plan.ts`: Applies parsed creation plans to the repository.
- `src/apply-component-creation-plan.ts`: Applies a parsed component scaffold to the repository.
- `src/apply-primitive-creation-plan.ts`: Applies a parsed primitive scaffold to the repository.
