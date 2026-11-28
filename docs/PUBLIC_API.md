# Public API

Luke UI is pre-1.0, so prefer a clean breaking change to a compatibility alias.
[research/711-public-api-audit.md](../research/711-public-api-audit.md) records the per-export
decisions from [#711](https://github.com/lukebennett88/luke-ui/issues/711) and their evidence.

## What is public

Every subpath in the package `exports` map is public, and so is every symbol it exports, documented
or not. There is no root `@luke-ui/react` entrypoint. Name each export in `src/exports/` explicitly,
because `export *` publishes whatever the source module happens to export.

The theme token custom properties and `--luke-icon-size` are public CSS. Generated class names,
Vanilla Extract types, other custom properties (including every `--luke-internal-*` name), and the
`data-icon` attribute an `Icon` renders are private. So is any DOM structure or state attribute that
a guide does not document. For example, the Select primitive guide makes `data-open` on
`SelectIndicator` public.

The stylesheet's built-in icons need `img-src data:` in a Content Security Policy.

`@luke-ui/react/<component>` holds a high-level component, its props type, and the companion exports
it needs. `@luke-ui/react/primitives/<name>` holds parts for composing a variant of a component.
`@luke-ui/react/theme` is runtime only, and `@luke-ui/react/theme/compiler` is build time only.
Runtime code must never import the compiler.
[research/715-theme-authoring-contract.md](../research/715-theme-authoring-contract.md) records the
split and the separate `@luke-ui/theme-paper` and `@luke-ui/theme-tactile` packages.

There is no `@luke-ui/react/styles` subpath. Layout utilities stay package-internal behind `Box` and
the other layout components.

## What earns an export

A high-level component and its props type are the default public surface. Any other export needs a
consumer use that the high-level component does not already cover. Internal reuse, implementation
structure, and symmetry with another component do not earn an export. Decide each prop on what that
component's consumers need, not on what a sibling component or React Aria exposes.

- A primitive is public when an app can compose a variant of a component from it. Every primitive
  entrypoint has a docs page.
- A recipe is public when an app would style an element it owns without the component, and the
  recipe works on that element alone. A recipe that needs the component's private anatomy, internal
  hooks, or undocumented state attributes stays private.
- A utility is public when consumers need it to combine Luke UI output with their own props.

Export a public recipe from the entrypoint of the component or primitive that owns it. Export its
`*RecipeVariants` type only when the recipe has selectable variants.
[STYLING.md](STYLING.md#recipes) covers recipe authoring.

## Composition props

[CONVENTIONS.md](CONVENTIONS.md#element-choice) owns element choice and root replacement.

### IDs and refs

Unprefixed `id`, `className`, `style`, and `ref` target the component's own root element. A prop for
a descendant names it, such as `inputId`, `inputRef`, `triggerId`, or `triggerRef`.

### Field names

Name a composed component `<Control>Field` when it owns the complete field: the control, its visible
label, description, error message, validation and necessity presentation, and the semantics that tie
them together. Ownership decides the suffix, not layout, so the inline `CheckboxField` and
`SwitchField` share it with the stacked `TextInputField`, `ComboboxField`, and `SelectField`.

`RadioGroup` owns the field for a set of radio options, and each `RadioField` names one option.
`CheckboxGroup` owns the shared label, validation, and error presentation for a set of
`CheckboxField` options. Primitives keep their part names, such as `CheckboxRoot` and
`SwitchControl`.

### Accessible names

Support `aria-label` and `aria-labelledby` instead of a visible `label` when an invisible label is a
normal use, such as a search input. Require a visible `label` when that text forms the control's
click target, as it does for a checkbox, switch, or radio option. When another component owns the
label, the consumer composes the control's primitives. See
[Forms](../apps/docs/content/docs/docs/forms.mdx#visible-labels) for usage.

`CheckboxRoot` and `SwitchRoot` give a `FieldLabel` inside them a `for` that points at the input,
using `inputId` or a generated id, so the layout passes no ids.

### Primitives and composed components

Primitives stay close to React Aria. Keep the wrapped component's state-aware `className` and
`style`, events, refs, and `slot`, unless a prop conflicts with Luke UI's ownership rules. Composed
components own the normal anatomy. Do not add escape hatches to them for custom anatomy that their
primitives already support.

### `slot`

React Aria's `slot` lets a React Aria parent configure a child through context. A high-level
component keeps `slot` only when a React Aria parent defines a named slot that it can fill:

- `Button` and `IconButton`, for slots such as `slot="close"` in a React Aria `Dialog`.
- `Text` and the Text-derived `Numeral`, `Heading`, and `Blockquote`, for named text slots.
  `slot={null}` opts out of surrounding slotted text context.

Other high-level components omit it. The inline wrappers `Strong`, `Em`, `Code`, `Kbd`, `Quote`, and
`Emoji` take no `slot` and never fill a text slot, so they render inside a field's label,
description, or error. Composed components do not clear slotted text context for their content. A
selection checkbox in a `GridList` or `Table` takes its name from the collection, so it uses
`CheckboxRoot` with `slot="selection"`, not `CheckboxField`.

### Controlled state

Use React Aria's names for controlled and uncontrolled pairs, such as `value`, `defaultValue`, and
`onChange`, or `isOpen`, `defaultOpen`, and `onOpenChange`. Add no parallel API. A change event can
exist without its controlled pair when React Aria offers only the event, as `onOpenChange` does on
`ComboboxField`.

### Defaults

A default value is part of the public contract, so changing one is a breaking change. Document it
with `@default`, as [DOCUMENTATION.md](DOCUMENTATION.md#comments-and-jsdoc) describes.

### Control sizing

Control `size` accepts `small` or `medium` and selects a complete component-owned recipe.
`Form.controlSize` sets a default for compatible fields and actions. An explicit component size
wins, then the nearest inherited default, then `medium`. Both props are fixed scalars. `Icon` and
`LoadingSpinner` keep their own `size` scale: `xsmall`, `small`, `medium`, and `large`.
[Styling](STYLING.md#control-recipe-sizes) covers what each size renders.

### Layout values

Layout props take closed vocabularies. [Styling](STYLING.md#sizing-inset-flex-and-order-values)
lists every value.

- Spacing props accept the curated steps from `space.4` to `space.96`, plus string `"0"` and margin
  `auto`. `vars.space` has no zero entry.
- `Container.maxInlineSize` is required and accepts only the five `container.*` presets. Shared
  layout props do not widen it.
- Button and button-shaped Link accept `inlineSize="auto" | "full"`. Text appearances, IconButton,
  and IconLink do not.
- There is no `flex` shorthand prop.

Put arbitrary lengths, percentages, and CSS functions on `style`, or in authored CSS through
`className` when they are responsive. These sizing and layout rules supersede
[#761](https://github.com/lukebennett88/luke-ui/issues/761),
[#836](https://github.com/lukebennett88/luke-ui/issues/836), and
[#952](https://github.com/lukebennett88/luke-ui/issues/952).

## Owned elsewhere

These issues own related decisions: form field names, parts, and semantics
([#714](https://github.com/lukebennett88/luke-ui/issues/714)), icons
([#817](https://github.com/lukebennett88/luke-ui/issues/817)), theme authoring and theme packages
([#715](https://github.com/lukebennett88/luke-ui/issues/715)), token taxonomy
([#716](https://github.com/lukebennett88/luke-ui/issues/716)), and the global stylesheet and cascade
layers ([#717](https://github.com/lukebennett88/luke-ui/issues/717)).
