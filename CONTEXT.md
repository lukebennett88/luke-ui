# Luke UI

Luke UI is a React design system built on `react-aria-components` and `vanilla-extract`.

Components use three vocabulary tiers. Those tiers define how code is laid out and how each
component is documented.

## Language

**Atom**: A component that presents one conceptual unit, such as one piece of text, one icon, or one
number. It may compose `Text` or other atoms internally, but consumers treat it as a single unit.
App developers use atoms directly. _Examples_: `Text`, `Link`, `Icon`, `LoadingSpinner`, `Heading`,
`Emoji`, `Numeral`. _Avoid_: calling these "primitives" in source comments. That name is reserved.

**Composed**: A component that combines atoms or primitives into an opinionated, ready-to-drop-in
unit for app developers. _Examples_: `Button`, `IconButton`, `TextField`, `ComboboxField`.

**Primitive**: A building block for library authors assembling the next composed component. App
developers are not the audience. A primitive may be a single file (e.g. `text-field/primitive`) or a
kit of parts (e.g. `combobox-field/primitive`, `field/primitive`). _Examples_: `TextInput` (via
`text-field/primitive`), `Combobox*` kit (via `combobox-field/primitive`), `button/primitive`,
`field/primitive`, and the composed-but-internal `Field`. _Avoid_: "base" and "raw". Use
**Primitive**.

**Component creation**: The act of adding the public surface a new Atom or Composed component needs
to exist consistently. That includes source, stories, hosted docs, recipes when needed, and
generated exports.

## Relationships

- A **Composed** component is built from one or more **Atoms** or **Primitives**.
- A **Primitive** is documented in the hosted docs app so library authors and agents can find it. It
  is omitted from the hosted docs primary navigation and index.
- The composed `Field` is a **Primitive** by audience, even though it composes other components. It
  exists for library authors building `TextField`, `ComboboxField`, and similar components.
- An **Atom** or **Composed** component gets a hosted docs page.

## Hosted docs shape

Each component docs page at `apps/docs/content/docs/components/<group>/<component>.mdx` follows the
section order from [ADR-0006](docs/adr/0006-docs-md-structure-standard.md) (now superseded by
ADR-0007; the section ordering still applies):

- Usage lead-in with no explicit `## Usage` heading.
- `## Best Practices` table.
- Feature sections ordered by importance to a typical consumer.
- `## Accessibility` when the component has a user-facing accessibility contract.
- Cross-reference sections last.

All prose is authored in the hosted docs app (`apps/docs/content/docs/`). The package no longer
ships generated docs on npm. Full rationale is in
[ADR-0007](docs/adr/0007-docs-moved-to-hosted-app.md).

## Docs rule

The **hosted docs app** (`apps/docs`) is the primary docs surface. It serves both app developers and
library authors. The package README links to it.

| Tier      | Hosted docs?      | Notes                                            |
| --------- | ----------------- | ------------------------------------------------ |
| Atom      | yes (primary nav) | App-developer-facing                             |
| Composed  | yes (primary nav) | App-developer-facing                             |
| Primitive | yes (specialist)  | Listed in a "Library authors / advanced" section |

**Specialist, not noise.** Primitive pages exist in the hosted docs so library authors and agents
can find them. They are listed in a separate, de-emphasised "Library authors / advanced" section,
never mixed into the primary index alongside atoms and composed components. The goal is reachability
without crowding the main path. Do not document anything that is not part of the public API.

Package docs are no longer shipped on npm.

## Decisions

- [ADR-0001](docs/adr/0001-component-tier-taxonomy.md): Three-tier taxonomy docs rule
- [ADR-0002](docs/adr/0002-primitive-package-path-convention.md): Primitive kits are exported at
  `[composed]/primitive`
- [ADR-0003](docs/adr/0003-package-docs-surface.md): Package docs are a separate AI-native surface
  (superseded by ADR-0007)
- [ADR-0004](docs/adr/0004-styling-utilities-public-api.md): Styling utilities public API
- [ADR-0006](docs/adr/0006-docs-md-structure-standard.md): Standard structure for `.docs.md` prose
  files (superseded by ADR-0007)
- [ADR-0007](docs/adr/0007-docs-moved-to-hosted-app.md): Docs moved to the hosted docs app
