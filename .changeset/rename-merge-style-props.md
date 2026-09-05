---
'@luke-ui/react': minor
---

Rename the exported `mergeProps` utility to `mergeStyleProps`. The name now says what the function
actually does: it concatenates `className`, shallow-merges `style`, and overwrites every other key
with the later object's value — it never chains `on*` event handlers. Use React Aria's `mergeProps`
from `@react-aria/utils` instead when handler chaining is needed.
