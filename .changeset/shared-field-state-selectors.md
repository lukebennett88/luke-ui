---
'@luke-ui/react': patch
---

Fix a read-only `ComboboxField` rendering with the disabled treatment instead of the read-only one.
React Aria disables the trigger button on a read-only combobox, and the recipe was inferring the
whole control's disabled state from that button.
