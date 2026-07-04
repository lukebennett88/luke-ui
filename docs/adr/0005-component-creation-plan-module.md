# Component creation uses a plan module

Component creation is modelled as a module that returns a plan for the files and checks needed to
add an Atom or Composed component.

Turbo and Plop stay as the adapter that applies the plan. They are not where the component creation
rules live.

## Decision

Keep Luke UI's component creation rules in a testable plan module. The adapter can stay thin and
replaceable.

## Rejected options

- **Keep all logic in the Turbo generator**: rejected because it makes Plop the test surface and
  spreads Atom, Composed, docs, story, recipe, and export rules through one shallow script.
- **Create files directly without a plan**: rejected because it makes dry-run tests and fixture
  assertions harder. It also hides the exact public surfaces a component creation input should
  produce.
