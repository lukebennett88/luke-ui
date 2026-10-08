# Public API

How to decide what `@luke-ui/react` makes public, and how public composition props are named. Luke
UI is pre-1.0, so prefer a clean breaking change to a compatibility alias. The per-export decisions
from [#711](https://github.com/lukebennett88/luke-ui/issues/711), with their evidence, are in
[research/711-public-api-audit.md](../research/711-public-api-audit.md).

## What is public

Every subpath in the package `exports` map is public, and so is every symbol it exports, documented
or not. There is no root `@luke-ui/react` entrypoint.

Each module in `src/exports/` names its exports. Do not use `export *`, because it publishes
whatever the source module happens to export.

Generated class names, Vanilla Extract types, and any DOM structure or state attribute that a guide
does not document are private.

| Subpath                                                        | Holds                                                                                                              |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `@luke-ui/react/<component>`                                   | A high-level component, its props type, and the companion exports it needs                                         |
| `@luke-ui/react/primitives/<name>`                             | Parts for composing a variant of a component                                                                       |
| `@luke-ui/react/theme`                                         | `breakpoints`, `defineTheme`, `ThemeInput`, `rootClassName`, `ThemeContrastError`, `ThemeGenerationError`, `vars`  |
| `@luke-ui/react/themes/*`                                      | Bundled `theme` and `themeClassName`, until [#715](https://github.com/lukebennett88/luke-ui/issues/715) moves them |
| `@luke-ui/react/utils`                                         | Helpers for composing Luke UI output with other props                                                              |
| `@luke-ui/react/provider`                                      | The application `Provider`                                                                                         |
| `stylesheet.css`, `spritesheet.svg`, `themes/*/stylesheet.css` | Static assets                                                                                                      |

There is no `@luke-ui/react/styles` subpath. Layout utilities stay package-internal. Consumers use
`Box` and the other layout components.

## What earns an export

A high-level component and its props type are the default public surface. Any other export needs a
consumer use that the high-level component does not already cover. Internal reuse, implementation
structure, and symmetry with another component are not reasons to export something.

High-level components do not need matching APIs. Decide each prop on what consumers of that
component need, not on what a sibling component or React Aria exposes.

| Export    | Public when                                                                                                                                                                                                                   |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Primitive | An app can compose a variant of a component from it. Every primitive entrypoint has a docs page.                                                                                                                              |
| Recipe    | An app would style an element it owns without the component, and the recipe works on that element alone. A recipe that needs the component's private anatomy, internal hooks, or undocumented state attributes stays private. |
| Utility   | Consumers need it to combine Luke UI output with their own props.                                                                                                                                                             |

Export a public recipe from the entrypoint of the component or primitive that owns it. Export the
matching `*RecipeVariants` type only when the recipe has selectable variants. Do not export an empty
variants type for naming symmetry. [STYLING.md](STYLING.md#recipes) covers recipe authoring.

## Composition props

[CONVENTIONS.md](CONVENTIONS.md#element-choice) owns element choice: `elementType`, `renderRoot`,
`render<Part>`, and React Aria's `render`.

### IDs and refs

Unprefixed `id`, `className`, `style`, and `ref` target the component's own root element. A prop for
a descendant names it, such as `inputId`, `inputRef`, `triggerId`, or `triggerRef`. This is the
ownership convention from the
[#714 decision record](https://github.com/lukebennett88/luke-ui/issues/714#issuecomment-5925988115).

### Field names

Name a composed component `<Control>Field` when it owns the complete form-field experience: the
control, its visible label, description, error message, validation and necessity presentation, and
the field semantics that tie them together. The suffix follows that ownership, not the layout, so
the inline `CheckboxField` and `SwitchField` share it with the stacked `TextInputField`,
`ComboboxField`, and `SelectField`. A future radio group is `RadioGroupField`. An individual radio
is an option within that field, not a field itself. Primitives keep their part names, such as
`CheckboxRoot` and `SwitchControl`.

### Accessible names

`TextInputField`, `ComboboxField`, and `SelectField` take a visible `label`, or `aria-label` or
`aria-labelledby` instead, because a label-less field such as a search input is a normal use.
`CheckboxField` and `SwitchField` always take a visible `label` and accept neither `aria-label` nor
`aria-labelledby`. When another component owns the label, the consumer composes the control's
primitives. `CheckboxRoot` and `SwitchRoot` give a `FieldLabel` inside them a `for` that points at
the input, using `inputId` or a generated id, so the layout passes no ids.
[#714](https://github.com/lukebennett88/luke-ui/issues/714) owns both decisions.

### Primitives and composed components

Primitives stay close to React Aria. Keep the wrapped component's render props, state-aware
`className` and `style`, events, refs, and `slot`, unless a prop conflicts with Luke UI's ownership
rules. Composed components own the normal anatomy. Do not add escape hatches to them for custom
anatomy that their primitives already support.

### `slot`

React Aria's `slot` lets a React Aria parent configure a child through context. Keep `slot` on a
high-level component only when a React Aria parent defines a named slot that component can fill.
`Button` and `IconButton` keep it for slots such as `slot="close"` in a React Aria `Dialog`. A
selection checkbox in a `GridList` or `Table` takes its name from the collection, so it uses
`CheckboxRoot` with `slot="selection"`, not `CheckboxField`. `Text` and the Text-derived `Numeral`,
`Heading`, and `Blockquote` keep it for named text slots, including `slot={null}` to opt out of
surrounding slotted text context. The inline wrappers `Strong`, `Em`, `Code`, `Kbd`, `Quote`, and
`Emoji` take no `slot` and never fill a text slot, so they render inside a field's label,
description, or error. Composed components do not clear slotted text context for their content.
Other high-level components omit it. Primitives keep the `slot` of the React Aria component they
wrap.

### Controlled state

Use React Aria's names for controlled and uncontrolled pairs, such as `value`, `defaultValue`, and
`onChange`, or `isOpen`, `defaultOpen`, and `onOpenChange`. Do not add a parallel API. A change
event can exist without its controlled pair when React Aria offers only the event, as `onOpenChange`
does on `ComboboxField`.

### Defaults

A default value is part of the public contract, so changing one is a breaking change. Document it
with `@default`, as [DOCUMENTATION.md](DOCUMENTATION.md#comments-and-jsdoc) describes.

### State attributes

A state attribute is public only when a guide documents it, as the Select primitive guide documents
`data-open` on `SelectIndicator`. Other attributes that React Aria or Luke UI set can change without
a migration path.

## Owned elsewhere

| Topic                                      | Owner                                                       |
| ------------------------------------------ | ----------------------------------------------------------- |
| Form field names, parts, and semantics     | [#714](https://github.com/lukebennett88/luke-ui/issues/714) |
| Icons and `Provider`                       | [#712](https://github.com/lukebennett88/luke-ui/issues/712) |
| Theme authoring and bundled-theme subpaths | [#715](https://github.com/lukebennett88/luke-ui/issues/715) |
| Token taxonomy                             | [#716](https://github.com/lukebennett88/luke-ui/issues/716) |
| Global stylesheet and cascade layers       | [#717](https://github.com/lukebennett88/luke-ui/issues/717) |
