---
'@luke-ui/react': patch
---

Fix a read-only `ComboboxField` rendering with the disabled treatment — dimmed and `not-allowed` — instead of the read-only one. React Aria disables the trigger button on a read-only combobox, and the recipe was inferring the whole control's disabled state from that button. It now reads the disabled and invalid attributes React Aria already puts on the control group, so read-only comboboxes get the flat read-only material and the combobox shares its state selectors with `InputGroup`, shrinking the published stylesheet.
