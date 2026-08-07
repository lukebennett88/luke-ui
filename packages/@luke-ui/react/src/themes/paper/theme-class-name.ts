/**
 * Kept apart from `./index.ts` so the class never depends on the foundation.
 * `themes.test.ts` asserts this literal still matches the foundation's `name`.
 */

import { getThemeClassName } from '../../theme/theme-class-name.js';

const PAPER_THEME_NAME = 'paper';

/**
 * The Paper theme's identity class. Apply it to `<html>` or a subtree root together with the
 * `@luke-ui/react/themes/paper/stylesheet.css` stylesheet when a document needs more than one
 * theme active at once. Omit it, and the stylesheet alone themes the whole document from `:root`.
 */
export const themeClassName = getThemeClassName(PAPER_THEME_NAME);
