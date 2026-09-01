# Turbo Generators

Custom generators for `turbo generate`.

## Generators

- `component`: Scaffolds `@luke-ui/react` components, colocated recipes, Storybook stories, hosted
  docs wrappers, hosted docs controls, and structural docs navigation.
- `primitive`: Scaffolds `@luke-ui/react/primitives/*` entrypoints, colocated recipes, the style
  module registry, and conformance manifest entries.

The component generator asks for name, docs group, visual coverage, conformance contracts, and an
integration tripwire. The primitive generator asks for name, hosted docs, and conformance contracts.

Generated component and primitive folders use a named implementation file. Public modules live in
`src/exports/`.

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
