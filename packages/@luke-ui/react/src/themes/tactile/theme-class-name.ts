/**
 * Kept apart from `./index.ts` so the class never depends on the foundation.
 * `themes.test.ts` asserts this literal still matches the foundation's `name`.
 */

import { getThemeClassName } from '../../theme/theme-class-name.js';

const TACTILE_THEME_NAME = 'tactile';

/**
 * The Tactile theme's identity class. Apply it to `<html>` or a subtree root together with the
 * `@luke-ui/react/themes/tactile/stylesheet.css` stylesheet when a document needs more than one
 * theme active at once. Omit it, and the stylesheet alone themes the whole document from `:root`.
 */
export const themeClassName = getThemeClassName(TACTILE_THEME_NAME);
