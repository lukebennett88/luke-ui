---
'@luke-ui/react': minor
---

Rework the multi-part recipe layer to a HeroUI/Tailwind-Variants-style `recipe()` architecture.
`field` and `textInput` from `@luke-ui/react/recipes` are now slotted recipes: select variants at
the outer call, then read each slot, for example
`field({ necessityIndicator, tone }).label(className)` and `textInput({ size }).group()`. Slot
functions take only an optional extra class.

This is a pre-1.0 breaking change to `@luke-ui/react/recipes`. The old flat multi-part exports are
removed with no aliases: `fieldLabel`, `fieldMessage`, `textInputGroup`, `textInputControl`,
`textInputAdornmentStart`, and `textInputAdornmentEnd`. The `field` recipe changes shape from a
single-part container recipe to the slotted `root`/`label`/`message` form. The `*Variants` types are
kept (`FieldVariants`, `TextInputVariants`). The emitted stylesheet and class names are unchanged.
