---
name: luke-ui
description: >-
  Luke UI conventions for building with @luke-ui/react. Use when writing or
  reviewing Luke UI components, forms, layout, imports, or class names.
---

# Luke UI conventions

Follow these rules when the task involves Luke UI. Each rule states what to do and what not to do.

## Refs on field components

Field components that wrap a control in label, description, and error slots take no plain `ref`. Reach the underlying control with `inputRef`.

Today that means `TextField`, `Checkbox`, and `ComboboxField`. With React Hook Form, pass `inputRef={field.ref}` inside `Controller`.

Do not assume every composed Luke UI component uses `inputRef`. Buttons, layout, links, and similar components take a normal `ref`. Control primitives that render the input themselves, such as `ComboboxInput`, also take plain `ref`, not `inputRef`.

## React Hook Form

Wire Luke UI fields with `Controller`. Pass `field.value`, `field.onChange`, `field.onBlur`, and `inputRef={field.ref}` (or `ref={field.ref}` on a control primitive).

Do not use `register` with Luke UI fields. Fields need `inputRef` or controlled props, not `{...register()}`'s plain `ref` spread.

## Element choice

Use `elementType` only to change the rendered element without owning its DOM attributes.

Use `render` when the callback must own the element and its DOM attributes. Pass the component's documented resolved props to that element.

Do not use `render` and `elementType` together. They are mutually exclusive.

## Imports

Import each component from its own package path, such as `@luke-ui/react/button` or `@luke-ui/react/primitives/field`.

Do not import from a root `@luke-ui/react` entrypoint. There is none.

## Class names

Join class names with `cx` from `@luke-ui/react/utils`.

Do not hand-roll class-name joining when `cx` covers the case.
