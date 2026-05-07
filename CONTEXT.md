# Luke UI

A React design system built on `react-aria-components` and `vanilla-extract`. Components fall into three vocabulary tiers that drive both how code is laid out and what gets documented.

## Language

**Atom**:
A component that presents as a single conceptual unit — one piece of text, one icon, one number. May compose `Text` or other atoms internally, but the consumer treats it as indivisible. App devs use it directly.
_Examples_: `Text`, `Link`, `Icon`, `LoadingSpinner`, `Heading`, `Emoji`, `Numeral`.
_Avoid_: calling these "primitives" in source comments — that name is reserved.

**Composed**:
A component that combines two or more atoms or primitives into an opinionated, ready-to-drop-in unit aimed at app devs.
_Examples_: `Button`, `IconButton`, `CloseButton`, `TextField`, `ComboboxField`.

**Primitive**:
A building block whose audience is library authors assembling the next composed component, not app devs. May be a single file (`text-input`) or a kit of parts (`combobox/*`, `field/primitive` + `field/label` + `field/description` + `field/error`).
_Examples_: `TextInput`, `ComboboxInput` and friends, `button/primitive`, `field/primitive`, the composed-but-internal `Field`.
_Avoid_: "base", "raw" — use **Primitive**.

## Relationships

- A **Composed** component is built from one or more **Atoms** and/or **Primitives**.
- A **Primitive** is never documented publicly; its contract lives in source.
- An **Atom** and a **Composed** component each get a public doc page.
- The composed `Field` is a **Primitive** by audience even though it composes other components — it exists to be wrapped by `*Field` components, not used directly by app devs.

## Docs rule

> Document what an app developer drops into their UI. Don't document what only exists to build the next component.

| Tier      | Docs page? |
| --------- | ---------- |
| Atom      | yes        |
| Composed  | yes        |
| Primitive | no         |

## Decisions

- [ADR-0001](docs/adr/0001-component-tier-taxonomy.md) — Three-tier taxonomy and docs rule
- [ADR-0002](docs/adr/0002-primitive-package-path-convention.md) — Primitive kits exported at `[composed]/primitive`

## Flagged ambiguities

- Source JSDoc currently calls `Text`, `TextInput`, and `button/primitive.tsx` all "primitive". Resolved: `Text` is an **Atom**; `TextInput` and `button/primitive.tsx` are **Primitives**. JSDoc to be aligned during refactor.
- `docs/CONVENTIONS.md` mentions only "primitives/ (base) and composed/ (opinionated)". Resolved: the taxonomy is three-way (atom / composed / primitive); CONVENTIONS.md to be updated.
