# Primitive kit exports live at `[composed]/primitive`

When a primitive kit supports a composed component, export it at `[composed]/primitive` instead of a
bare top-level path.

## Decision

Use paths like:

- `@luke-ui/react/text-field/primitive` for `TextInput`
- `@luke-ui/react/combobox-field/primitive` for `ComboboxInput`, `ComboboxControl`,
  `ComboboxListBox`, and related parts
- `@luke-ui/react/field/primitive` for `Field`, the primitive field div, `FieldLabel`, `FieldError`,
  and `FieldDescription`

This follows the convention already used by `@luke-ui/react/button/primitive` and
`@luke-ui/react/field/primitive`.

The path makes the audience visible. `combobox-field/primitive` reads as "the primitive kit that
underpins `ComboboxField`". The API remains public without moving source folders.

## Rejected options

We rejected top-level paths such as `./combobox` or `./text-input` because they do not signal
audience. The import line looks the same as an atom or composed component.

We rejected a source-folder reshuffle such as `primitives/`, `composed/`, and `atoms/` at the
package root. That would churn internal imports without changing the public API shape.

We rejected making primitives fully internal by removing them from `package.json#exports`. The
package is public, and external consumers may need to assemble their own composed wrappers.

## Consequences

- There is intentionally no top-level `./field` export.
- Consumers who need field anatomy import from `./field/primitive`.
- Primitive paths are lower-level escape hatches for library authors.
- New primitive kits must follow the `[composed]/primitive` convention.
