# Component tier taxonomy: atom / composed / primitive

Components are classified into three tiers — **atom**, **composed**, and **primitive** — which determine whether a component gets a public doc page.

- **Atoms** (`Text`, `Link`, `Icon`, `LoadingSpinner`, `Heading`, `Emoji`, `Numeral`) present as a single conceptual unit; app devs use them directly. They get docs.
- **Composed** (`Button`, `IconButton`, `CloseButton`, `TextField`, `ComboboxField`) combine atoms or primitives into a ready-to-drop-in pattern for app devs. They get docs.
- **Primitives** (`TextInput`, the `Combobox*` kit, `button/primitive`, the `Field` kit) exist for library authors building the next composed component. They do not get docs; their contract lives in source.

We rejected a two-tier "composed vs primitive" model because it couldn't classify atoms cleanly — `Text` is labeled "primitive" in its own JSDoc but is nothing like `TextInput` in terms of who reaches for it. We also rejected classifying the composed `Field` as doc-worthy: although it composes other components, its audience is library authors (it is always wrapped by a `*-Field`), not app devs.

The rule in one line: **document what an app developer drops into their UI; don't document what only exists to build the next component.**

## Consequences

- Source JSDoc should use "atom", "composed", and "primitive" consistently — not the generic word "primitive" for everything that isn't a plain HTML element.
- `docs/CONVENTIONS.md` should be updated from its current "primitives/ (base) and composed/ (opinionated)" two-way description to the three-tier taxonomy.
