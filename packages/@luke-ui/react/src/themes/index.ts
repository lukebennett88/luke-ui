import { themeClassName } from '../theme/build-theme.js';
import { elmoFoundation, machinedEdgeFoundation } from '../theme/foundations.js';

/**
 * Identity class for the Machined edge theme, the Luke UI default. Apply it to `<html>` or a
 * subtree root together with the `@luke-ui/react/themes/machined-edge.css` stylesheet. Omit
 * `data-color-mode` to follow the system preference, or set it to `light` or `dark` on a nested
 * scope.
 */
export const machinedEdgeThemeClassName = themeClassName(machinedEdgeFoundation.name);

/**
 * Identity class for the ELMO theme. Apply it to `<html>` or a subtree root together with the
 * `@luke-ui/react/themes/elmo.css` stylesheet. Omit `data-color-mode` to follow the system
 * preference, or set it to `light` or `dark` on a nested scope.
 */
export const elmoThemeClassName = themeClassName(elmoFoundation.name);
