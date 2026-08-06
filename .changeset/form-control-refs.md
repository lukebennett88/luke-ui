---
'@luke-ui/react': minor
---

Give form components a ref to their underlying DOM control. `InputGroupInput` and `ComboboxInput`
take a `ref` that resolves to their `<input>`, and `TextField`, `ComboboxField`, and `Checkbox` take
an `inputRef` that reaches the control a composed field renders. Both accept a callback ref, so a
form library such as React Hook Form can register a field and focus it after a failed submission.
