# Component tier taxonomy: atom / composed / primitive

Components are classified into three tiers — **atom**, **composed**, and **primitive** — which determine whether a component gets a public doc page.

- **Atoms** (`Text`, `Link`, `Icon`, `LoadingSpinner`, `Heading`, `Emoji`, `Numeral`) present as a single conceptual unit; app devs use them directly. They get docs.
- **Composed** (`Button`, `IconButton`, `TextField`, `ComboboxField`) combine atoms or primitives into a ready-to-drop-in pattern for app devs. They get docs.
- **Primitives** (`TextInput`, the `Combobox*` kit, `button/primitive`, the `Field` kit) exist for library authors building the next composed component. They do not get hosted docs (app-dev surface), but they are documented in package docs so library authors and coding agents can reach them. See ADR-0003.

We rejected a two-tier "composed vs primitive" model because it couldn't classify atoms cleanly — `Text` is labeled "primitive" in its own JSDoc but is nothing like `TextInput` in terms of who reaches for it. We also rejected classifying the composed `Field` as doc-worthy: although it composes other components, its audience is library authors (it is always wrapped by a `*-Field`), not app devs. Thin presets of a single composed component (e.g. the removed `CloseButton`, which only pinned `IconButton`'s `icon` and `aria-label`) don't earn a Composed-tier module of their own — they fail the deletion test, and the pattern belongs in the wrapped component's docs instead (see issue #41).

The rule in one line: **hosted docs target app developers; package docs cover every public export so library authors and agents can reach them.**

## Consequences

- Source JSDoc should use "atom", "composed", and "primitive" consistently — not the generic word "primitive" for everything that isn't a plain HTML element.
- `docs/CONVENTIONS.md` should be updated from its current "primitives/ (base) and composed/ (opinionated)" two-way description to the three-tier taxonomy.
