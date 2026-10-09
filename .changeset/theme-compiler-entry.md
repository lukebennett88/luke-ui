---
'@luke-ui/react': minor
---

Split theme authoring from the runtime theme entry. Import `defineTheme`, `ThemeInput`,
`ExtendingThemeInput`, `ThemeFont`, `FontMetrics`, `ThemeValidationError`, `ThemeContrastError`, and
`ThemeGenerationError` from `@luke-ui/react/theme/compiler`, at build time in Node 24 or later.
`@luke-ui/react/theme` keeps `vars`, `breakpoints`, and `rootClassName`, and now exports
`getThemeClassName`.

- Replace `typography.fontFamily` with `typography.fonts`: a required `body` font and an optional
  `display` font, each a `{ family, metrics }` pair with Capsize metrics. Add the
  `vars.font.family.display` token.
- `defineTheme` throws `ThemeValidationError` listing every invalid font, metric, or weight in each
  input of an `extends` chain.
- Generated theme CSS applies to the identity class on `<html>` only, with no `:root` fallback.
  Explicit `data-color-mode` scopes nest below `<html>`, and the shared stylesheet repaints them and
  now owns root `container-type`.
- The Select popover, Combobox popover, and Combobox tray copy the trigger's scoped colour mode.
- Remove `@luke-ui/react/themes/*`. Install `@luke-ui/theme-tactile` or `@luke-ui/theme-paper`.
