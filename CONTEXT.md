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
to exist consistently. That includes source, stories, package docs, hosted docs, recipes when
needed, and generated exports.

## Relationships

- A **Composed** component is built from one or more **Atoms** or **Primitives**.
- A **Primitive** is documented in package docs so library authors and agents can find it. It is
  omitted from the hosted docs primary navigation and index.
- The composed `Field` is a **Primitive** by audience, even though it composes other components. It
  exists for library authors building `TextField`, `ComboboxField`, and similar components.
- An **Atom** or **Composed** component gets a hosted docs page and a primary package-doc entry.

## Package docs shape

Each `src/<component>/<component>.docs.md` follows the section order from
[ADR-0006](docs/adr/0006-docs-md-structure-standard.md):

- Usage lead-in with no explicit `## Usage` heading.
- `## Best Practices` table.
- Feature sections ordered by importance to a typical consumer.
- `## Accessibility` when the component has a user-facing accessibility contract.
- Cross-reference sections last.

All prose is authored in the package (`src/<component>/<component>.docs.md`). `apps/docs` MDX files
only wire the page together with frontmatter, an interactive demo, and an `<include>` for the
generated package doc. Full rationale is in [ADR-0006](docs/adr/0006-docs-md-structure-standard.md).

## Docs rule

Two doc surfaces serve two audiences:

- **Hosted docs** (`apps/docs`): for app developers. They document components an app developer can
  drop into a UI.
- **Package docs** (shipped on npm under `packages/@luke-ui/react/docs/`): for anyone reading the
  package off npm, including library authors and coding agents. They document every public export
  path because each one is reachable through `package.json#exports`.

| Tier      | Hosted docs?      | Package docs?          |
| --------- | ----------------- | ---------------------- |
| Atom      | yes (primary nav) | yes (primary index)    |
| Composed  | yes (primary nav) | yes (primary index)    |
| Primitive | no                | yes (specialist index) |

**Specialist, not noise.** Primitive pages exist in package docs so library authors and agents can
find them. They are listed in a separate, de-emphasised "Library authors / advanced" section in
`README.md` and `llms.txt`, never mixed into the primary index alongside atoms and composed
components. The goal is reachability without crowding the main path. Do not document anything that
is not part of the public API.

## Decisions

- [ADR-0001](docs/adr/0001-component-tier-taxonomy.md): Three-tier taxonomy docs rule
- [ADR-0002](docs/adr/0002-primitive-package-path-convention.md): Primitive kits are exported at
  `[composed]/primitive`
- [ADR-0003](docs/adr/0003-package-docs-surface.md): Package docs are a separate AI-native surface
- [ADR-0004](docs/adr/0004-styling-utilities-public-api.md): Styling utilities public API
- [ADR-0006](docs/adr/0006-docs-md-structure-standard.md): Standard structure for `.docs.md` prose
  files
