# Turbo Generators

Custom generators for `turbo generate`.

## Generators

- `component`: Scaffolds `@luke-ui/react` components, colocated recipes, Storybook stories, hosted
  docs wrappers, hosted docs controls, and structural docs navigation.

The component generator asks for name, docs group, visual coverage, conformance contracts, and an
integration tripwire. `--args <name> <docs-group>` skips the remaining prompts and uses the plan
defaults. Primitive scaffolding is tracked separately.

Generated component folders use a named implementation file and an export-only `index.ts` barrel.

## Usage

```bash
pnpm generate:component
```

## Structure

- `config.ts`: Turbo/Plop adapter that collects answers and invokes the creation flow.
- `src/component-creation-plan.ts`: Generator rules, answer parsing, and planned files.
- `src/apply-component-creation-plan.ts`: Applies a parsed scaffold to the repository.
