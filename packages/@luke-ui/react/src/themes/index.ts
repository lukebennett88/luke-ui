import { themeClassName } from '../theme/build-theme.js';
import { elmoFoundation, machinedEdgeFoundation } from '../theme/foundations.js';

/**
 * Identity class for the Machined edge theme, the Luke UI default. Apply it to `<html>` or a
 * subtree root together with the `@luke-ui/react/themes/machined-edge.css` stylesheet.
 */
export const machinedEdgeThemeClassName = themeClassName(machinedEdgeFoundation.name);

/**
 * Identity class for the ELMO theme. Apply it to `<html>` or a subtree root together with the
 * `@luke-ui/react/themes/elmo.css` stylesheet.
 */
export const elmoThemeClassName = themeClassName(elmoFoundation.name);
