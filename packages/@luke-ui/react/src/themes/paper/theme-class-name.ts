/** Kept apart from `./index.ts` so the class never depends on the foundation. */

import { getThemeClassName } from '../../theme/theme-class-name.js';

const PAPER_THEME_NAME = 'paper';

/**
 * The Paper theme's identity class, needed only when a document loads more than one theme
 * stylesheet. Apply it to the theme root, such as `<html>` or a subtree root.
 */
export const themeClassName = getThemeClassName(PAPER_THEME_NAME);
