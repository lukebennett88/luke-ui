import { themeClassName } from '../theme/build-theme.js';
import { paperFoundation, tactileFoundation } from '../theme/foundations.js';

/**
 * Identity class for the Tactile theme, the Luke UI default. Apply it to `<html>` or a
 * subtree root together with the `@luke-ui/react/themes/tactile.css` stylesheet. Omit
 * `data-color-mode` to follow the system preference, or set it to `light` or `dark` on a nested
 * scope.
 */
export const tactileThemeClassName = themeClassName(tactileFoundation.name);

/**
 * Identity class for the Paper theme. Apply it to `<html>` or a subtree root together with the
 * `@luke-ui/react/themes/paper.css` stylesheet. Omit `data-color-mode` to follow the system
 * preference, or set it to `light` or `dark` on a nested scope.
 */
export const paperThemeClassName = themeClassName(paperFoundation.name);
