/** Kept apart from `./index.ts` so the class never depends on the foundation. */

import { getThemeClassName } from '../../theme-class-name.js';

const TACTILE_THEME_NAME = 'tactile';

/**
 * The Tactile theme's identity class, needed only when a document loads more than one theme
 * stylesheet. Apply it to the theme root, such as `<html>` or a subtree root.
 */
export const themeClassName = getThemeClassName(TACTILE_THEME_NAME);
