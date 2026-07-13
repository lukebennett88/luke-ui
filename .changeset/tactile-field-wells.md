---
'@luke-ui/react': patch
---

Move `Field`, `TextInput`, and `TextField` onto the new semantic theme contract. The input control
now renders as a recessed well with an accent-coloured hover and focus edge, and read-only fields
flatten into the canvas surface instead of relying on colour alone. No props or exported types
changed.
