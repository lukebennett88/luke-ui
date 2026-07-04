# Turbo Generators

Custom generators for `turbo generate`.

## Generators

- `component`: Scaffolds Atom or Composed `@luke-ui/react` components, package docs prose, Storybook
  stories, hosted docs wrappers, hosted docs controls, and structural docs navigation.

The component generator asks for name, tier, docs group, and styling. Primitive creation is
intentionally excluded until it can be modelled through its parent Composed component.

## Usage

```bash
pnpm generate:component
```

## Structure

- `config.ts`: Turbo/Plop adapter.
- `src/component-creation-plan.ts`: Component creation rules and expected outcomes.
- `src/apply-component-creation-plan.ts`: File and JSON edit adapter.
