# Component tier taxonomy: Atom, Composed, Primitive

> **Note:** The docs location detail is superseded by [ADR-0007](0007-docs-moved-to-hosted-app.md).
> Primitives are mentioned in prose on their parent component's hosted docs page (see, for example,
> the "Primitive kit" section of the Combobox Field docs), but do not yet have their own generated
> API reference.

Luke UI classifies components into three tiers: **Atom**, **Composed**, and **Primitive**. The tier
decides whether the component appears in hosted docs and how it is described in source and hosted
docs.

## Decision

- **Atoms** present one conceptual unit. App developers use them directly. Examples: `Text`, `Link`,
  `Icon`, `LoadingSpinner`, `Heading`, `Emoji`, and `Numeral`. Atoms get hosted docs.
- **Composed** components combine atoms or primitives into a ready-to-drop-in pattern for app
  developers. Examples: `Button`, `IconButton`, `TextField`, and `ComboboxField`. Composed
  components get hosted docs.
- **Primitives** are building blocks for library authors who are assembling the next composed
  component. Examples: `TextInput`, the `Combobox*` kit, `button/primitive`, and the `Field` kit.
  Primitives do not get hosted docs, but they are documented in package docs so library authors and
  coding agents can find them.

In one line: hosted docs target app developers. Package docs cover every public export path.

## Rejected options

We rejected a two-tier "composed vs primitive" model because it could not classify atoms cleanly.
`Text` was labelled "primitive" in its own JSDoc, but it is nothing like `TextInput` in terms of
audience or use.

We also rejected treating the composed `Field` as app-developer-facing docs content. It composes
other components, but its audience is library authors. App developers reach it through `TextField`,
`ComboboxField`, and similar wrappers.

Thin presets of one composed component do not earn a new Composed-tier module. The removed
`CloseButton` only pinned `IconButton`'s `icon` and `aria-label`. It failed the deletion test, so
the pattern belongs in the wrapped component's docs instead. See issue #41.

## Consequences

- Source JSDoc should use "atom", "composed", and "primitive" consistently.
- Do not use "primitive" as a generic label for anything that is not a plain HTML element.
- `docs/CONVENTIONS.md` should describe the three-tier taxonomy, not a two-way "primitive and
  composed" split.
- Hosted docs stay focused on app-developer-facing atoms and composed components.
- Package docs remain the reachability surface for public primitive exports.
