# Form architecture and control naming (#714)

Decision record for settling the pre-1.0 form surface. Parent: epic
[#709](https://github.com/lukebennett88/luke-ui/issues/709) / issue
[#714](https://github.com/lukebennett88/luke-ui/issues/714).

Evidence so far: forms docs, `TextField` / `ComboboxField` / `Checkbox`, field and input-group
primitives, and the settings fixture (#713).

## Decisions

### Stacked labelled fields keep the `*Field` suffix

| Today                            | 1.0 intent                                   | Notes                                                                                               |
| -------------------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `TextField`                      | **retain**                                   | Stacked label + control + description + error. Not renamed to `TextInputField` solely for symmetry. |
| `ComboboxField`                  | **retain**                                   | Same stacked pattern.                                                                               |
| Future stacked Select / TextArea | **`SelectField` / `TextAreaField`** if added | Match the stacked pattern only when a supported flow needs them.                                    |

Do **not** rename `TextField` to `TextInputField` for taxonomy purity. Fixture bio currently reuses
`TextField` for multi-line copy. A dedicated `TextAreaField` is a Wave 2/3 addition when multiline
is a proven contract (#713 friction), not a rename of the single-line field.

### Inline controls keep short natural names

| Today                                  | 1.0 intent               | Notes                                                            |
| -------------------------------------- | ------------------------ | ---------------------------------------------------------------- |
| `Checkbox`                             | **retain**               | Label via children. Do not invent `CheckboxField`.               |
| Future `Switch`, `Radio`, `RadioGroup` | **those names** if added | Inline labelling. Add only when fixture or docs flows need them. |

### Primitives stay composition escapes

| Export                                                  | 1.0 intent          | Notes                                                                                                                                                               |
| ------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Field`, `FieldLabel`, `FieldDescription`, `FieldError` | **retain**          | Real value for custom stacked composition. Not required for ordinary `TextField` / `ComboboxField` use.                                                             |
| `InputGroup`, `InputGroupInput`, prefix/suffix          | **retain**          | Affordance grouping. Do not publish a standalone `TextInput` that merely aliases `InputGroupInput` unless a flow needs an ungrouped bare control with equal polish. |
| Combobox / button / checkbox primitives                 | **retain per #711** | Documented composition only.                                                                                                                                        |

### Semantics shared across fields

- Visible `label` / `description` / error association stay on high-level fields (see Forms docs).
- `isRequired`, necessity indicator, controlled vs uncontrolled, native `<form>` submit/reset stay
  as documented.
- App-owned validation (fixture danger zone) remains valid. Luke UI owns association and invalid
  presentation, not every product rule.
- Refs and form submission follow the control’s public props. Do not invent parallel Luke-only form
  state APIs.

## Explicit non-goals

- Renaming `Checkbox` for symmetry with `*Field`.
- Publishing a primitive counterpart for every high-level field.
- Adding Select / TextArea / Switch / Radio before a supported flow needs them.

## Next actions

1. Add multiline `TextAreaField` only after a fixture or docs flow proves the contract.
2. Revisit bare `TextInput` if InputGroup-free single-line input becomes a demonstrated need.
3. Keep #707 visual/API notes as input when field chrome changes under #716.
