# Theme

## Import

```ts
import { themeClass, themeRootClassName, vars } from '@luke-ui/react/theme';
```

## Exports

### `themeClass`

The vanilla-extract CSS class that applies the design-token theme to its subtree.

### `themeRootClassName`

Convenience class name combining the theme, theme-root, and CSS-reset root classes. Apply to your app's root element.

### `vars`

The CSS custom-property contract (vars) generated from the design tokens. Use to reference token values in vanilla-extract styles.
