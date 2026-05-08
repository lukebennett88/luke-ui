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
A building block whose audience is library authors assembling the next composed component, not app devs. May be a single file (e.g. `text-field/primitive`) or a kit of parts (e.g. `combobox-field/primitive`, `field/primitive`).
_Examples_: `TextInput` (via `text-field/primitive`), the `Combobox*` kit (via `combobox-field/primitive`), `button/primitive`, `field/primitive`, the composed-but-internal `Field`.
_Avoid_: "base", "raw" — use **Primitive**.

## Relationships

- A **Composed** component is built from one or more **Atoms** and/or **Primitives**.
- A **Primitive** is never documented publicly; its contract lives in source.
- An **Atom** and a **Composed** component each get a public doc page.
- The composed `Field` is a **Primitive** by audience even though it composes other components — it exists to be wrapped by `*Field` components, not used directly by app devs.

## Docs rule

Two doc surfaces, two audiences:

- **Hosted docs** (`apps/docs`) — for app developers. Document what an app developer drops into their UI.
- **Package docs** (shipped on npm under `packages/@luke-ui/react/docs/`) — for anyone reading the package off npm, including library authors and coding agents. Document every public export path because each one is reachable through `package.json#exports`.

| Tier      | Hosted docs?      | Package docs?          |
| --------- | ----------------- | ---------------------- |
| Atom      | yes (primary nav) | yes (primary index)    |
| Composed  | yes (primary nav) | yes (primary index)    |
| Primitive | no                | yes (specialist index) |

**Specialist, not noise.** Primitive pages exist in the package docs so library authors and agents can find them, but they are listed in a separate, de-emphasised "Library authors / advanced" section of `README.md` and `llms.txt` — never mixed into the primary index alongside atoms and composed components. The goal is reachability without crowding the main path.

Don't document what isn't part of the public API.

## Decisions

- [ADR-0001](docs/adr/0001-component-tier-taxonomy.md) — Three-tier taxonomy and docs rule
- [ADR-0002](docs/adr/0002-primitive-package-path-convention.md) — Primitive kits exported at `[composed]/primitive`
- [ADR-0003](docs/adr/0003-package-docs-surface.md) — Package docs are a separate AI-native surface
