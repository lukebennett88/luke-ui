---
name: luke-ui
description: >-
  Luke UI conventions for building with @luke-ui/react. Use when writing or reviewing Luke UI
  components, layout, imports, or class names.
---

# Luke UI conventions

Follow these rules when the task involves Luke UI. Each rule states what to do and what not to do.

## Refs

When a component supports it, a plain `ref` targets the element the component renders as its own
root. A ref to a descendant names its target, such as `inputRef` for the input.

Pass `inputRef` to reach the input inside a field component such as `TextInputField`,
`ComboboxField`, `CheckboxField`, or `SwitchField`, and `triggerRef` to reach the trigger inside
`SelectField`. Do not use their `ref` for the input or trigger, because it reaches the field's root
element. A part that renders the input itself, such as `ComboboxInput`, takes the input ref on
`ref`.

## Labels

`CheckboxField` and `SwitchField` always take a visible `label`. Do not pass `aria-label` or
`aria-labelledby` to them. When the layout draws the label, compose
`@luke-ui/react/primitives/checkbox` or `@luke-ui/react/primitives/switch` and pass
`aria-labelledby` to the root.

Set `slot={null}` on `Text` inside a primitive label such as `CheckboxLabel` or `SwitchLabel`. Do
not leave its `slot` unset there, because the root's slotted text context makes it throw.

## Element choice

Use `elementType` only to change the rendered element without owning its DOM attributes.

Use `renderRoot` when the callback must own the element and its DOM attributes. Pass the component's
documented resolved props to that element. Named replaceable parts use `render<Name>`.

Do not use `renderRoot` and `elementType` together. They are mutually exclusive.

React Aria components may still expose RAC's own `render` prop. Leave that vocabulary alone.

## Imports

Import each component from its own package path, such as `@luke-ui/react/button` or
`@luke-ui/react/primitives/field`.

Do not import from a root `@luke-ui/react` entrypoint. There is none.

## Class names

Join class names with `cx` from `@luke-ui/react/utils`.

Do not hand-roll class-name joining when `cx` covers the case.
