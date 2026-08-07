import { lukeUiClassNames } from '../styles/class-names.js';
import { cx } from '../utils/index.js';

/**
 * Convenience class name combining the theme-root and CSS-reset classes.
 *
 * A leaf module so `theme.tsx` and `use-theme-scope-props.ts` can both depend on it without a
 * cycle through the `theme` barrel that re-exports it.
 */
export const themeRootClassName = cx(lukeUiClassNames.themeRoot, lukeUiClassNames.resetRoot);
