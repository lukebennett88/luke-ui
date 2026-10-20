# Scaffolding

Standalone commands for creating component and primitive scaffolds in the Luke UI repository.

## Generators

- `component`: Scaffolds a component, recipe, browser test, and hosted docs.
- `primitive`: Scaffolds a primitive, recipe, browser test, and public export.

Omit `--args` and the values to answer interactive prompts. Add `--dry-run` after the arguments to
list planned files without writing them. See
[Component creation](../../docs/COMPONENTS.md#component-creation) for arguments and scaffold rules,
and [TESTING.md](../../docs/TESTING.md) for generated test contracts.

## Structure

- `scripts/generate.ts`: standalone interactive and non-interactive CLI.
- `src/component-creation-plan.ts`: Component generator rules, answer parsing, and planned files.
- `src/primitive-creation-plan.ts`: Primitive generator rules, answer parsing, and planned files.
- `src/apply-creation-plan.ts`: Applies parsed creation plans to the repository.
- `src/apply-component-creation-plan.ts`: Applies a parsed component scaffold to the repository.
- `src/apply-primitive-creation-plan.ts`: Applies a parsed primitive scaffold to the repository.
