# Component creation uses a plan module

Component creation is modeled as a module whose interface returns a plan for the files and checks needed to add an Atom or Composed component. Turbo/Plop remains an adapter that applies the plan, rather than the place where component creation rules live. This keeps the interface test surface on Luke UI's component creation rules, while the adapter stays thin and replaceable.

## Considered Options

- **Keep all logic in the Turbo generator**: rejected because it makes Plop the test surface and spreads Atom, Composed, docs, story, recipe, and export-placement rules through one shallow script.
- **Create files directly without a plan**: rejected because it makes dry-run tests and fixture assertions harder, and it hides the exact public surfaces a component creation input should produce.
