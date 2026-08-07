import type { ThemeInput } from '../../theme/define-theme.js';
import { tactileTheme } from '../../theme/foundations/tactile.js';
import { themeClassName as themeClassNameFor } from '../../theme/theme-class-name.js';

/**
 * The Tactile theme's identity class. Apply it to `<html>` or a subtree root together with the
 * `@luke-ui/react/themes/tactile.css` stylesheet when a document needs more than one theme active
 * at once. Omit it, and the stylesheet alone themes the whole document from `:root`.
 */
export const themeClassName = themeClassNameFor(tactileTheme.name);

/**
 * Tactile's `defineTheme` input, the Luke UI default: a teal accent, a neutral near-white light
 * canvas, and a compact tactile material. Read it, copy it, or spread it into your own
 * `defineTheme` call to start from Tactile.
 */
export const theme: ThemeInput = tactileTheme;
