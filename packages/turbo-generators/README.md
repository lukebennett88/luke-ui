# Turbo Generators

Custom generators for `turbo generate`.

## Generators

- `component`: Scaffolds `@luke-ui/react` components, colocated recipes, Storybook stories, hosted
  docs wrappers, hosted docs controls, and structural docs navigation.

The component generator asks for name and docs group. Primitive scaffolding is tracked separately.

Generated component folders use a named implementation file and an export-only `index.ts` barrel.

## Usage

```bash
pnpm generate:component
```

## Structure

- `config.ts`: Turbo/Plop adapter.
- `src/component-creation-plan.ts`: Component creation rules and expected outcomes.
- `src/apply-component-creation-plan.ts`: File and JSON edit adapter.
