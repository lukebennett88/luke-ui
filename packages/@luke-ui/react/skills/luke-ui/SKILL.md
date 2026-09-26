---
name: luke-ui
description: >-
  Luke UI conventions for building with @luke-ui/react. Use when writing or reviewing Luke UI
  components, layout, imports, or class names.
---

# Luke UI conventions

Follow these rules when the task involves Luke UI. Each rule states what to do and what not to do.

## Refs on field components

`TextField`, `Checkbox`, and `ComboboxField` expose `inputRef` for reaching their underlying input.

Do not pass a plain `ref` to these field components. Components that expose their rendered element
directly use their documented `ref` prop instead. For example, `ComboboxInput` takes a plain `ref`.

## Element choice

Use `elementType` only to change the rendered element without owning its DOM attributes.

Use `render` when the callback must own the element and its DOM attributes. Pass the component's
documented resolved props to that element.

Do not use `render` and `elementType` together. They are mutually exclusive.

## Imports

Import each component from its own package path, such as `@luke-ui/react/button` or
`@luke-ui/react/primitives/field`.

Do not import from a root `@luke-ui/react` entrypoint. There is none.

## Class names

Join class names with `cx` from `@luke-ui/react/utils`.

Do not hand-roll class-name joining when `cx` covers the case.
