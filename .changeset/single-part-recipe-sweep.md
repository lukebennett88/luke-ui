---
'@luke-ui/react': patch
---

Migrate the remaining single-part recipes (`button`, `buttonContent`, `buttonLabel`,
`spinnerOverlay`, `icon`, `iconButton`'s internal `icon`, `link`, `spinner`, `spinnerState`, `svg`,
`indicator`, and `text`) from the old `recipeInLayer()` helper to the `recipe()` architecture
introduced in #223. This is an internal refactor only: the emitted stylesheet and class names are
unchanged, and no public API or behavior changes. The now-unused `recipeInLayer` helper is removed
from `styles/layered-style.css.ts`; `styleInLayer` and `globalStyleInLayer` are unaffected.
