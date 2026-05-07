# Primitive kit exports live at `[composed]/primitive`

When a primitive kit underpins a composed component, it is exported at `[composed]/primitive` rather than at a bare top-level path.

Examples:

- `@luke-ui/react/text-field/primitive` — exports `TextInput`
- `@luke-ui/react/combobox-field/primitive` — exports `ComboboxInput`, `ComboboxControl`, `ComboboxListBox`, etc.
- `@luke-ui/react/field/primitive` — exports the composed `Field`, the primitive field div, `FieldLabel`, `FieldError`, `FieldDescription`

This extends the convention already established by `@luke-ui/react/button/primitive` and `@luke-ui/react/field/primitive`.

We rejected a top-level `./combobox` (or `./text-input`) flat path because it gives no signal about audience — the import line looks identical to an atom or composed component. We rejected a source-folder reshuffle (`primitives/`, `composed/`, `atoms/` at the package root) because it churns internal import paths without changing the public API shape. We rejected making primitives fully internal (removed from `package.json` exports entirely) because the package is published publicly and future external consumers may need to assemble their own composed wrappers.

The `[composed]/primitive` path is the right trade-off: the audience is visible in the import (`combobox-field/primitive` reads as "the primitive underpinning of ComboboxField"), the public API surface remains accessible, and no source folders move.

## Consequences

- There is intentionally no top-level `./field` export. Consumers who want the raw field anatomy import from `./field/primitive`.
- Primitive paths are not documented (see ADR-0001). Their presence in `package.json` is a lower-level escape hatch for library authors.
- When a new primitive kit is added, its package path must follow this convention.
