import { lukeUiClassNames } from '../styles/class-names.js';
import { themeClass } from '../theme.css.js';
import { cx } from '../utils/index.js';

/** The vanilla-extract CSS class that applies the design-token theme to its subtree. */
export { themeClass } from '../theme.css.js';
/** The CSS custom-property contract (vars) generated from the design tokens. Use to reference token values in vanilla-extract styles. */
export { vars } from '../theme.css.js';

/** Convenience class name combining the theme, theme-root, and CSS-reset root classes. Apply to your app's root element. */
export const themeRootClassName = cx(
	themeClass,
	lukeUiClassNames.themeRoot,
	lukeUiClassNames.resetRoot,
);
