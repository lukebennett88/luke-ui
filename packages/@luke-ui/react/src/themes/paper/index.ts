import type { ThemeInput } from '../../theme/define-theme.js';
import { paperTheme } from '../../theme/foundations/paper.js';
import { themeClassName as themeClassNameFor } from '../../theme/theme-class-name.js';

/**
 * The Paper theme's identity class. Apply it to `<html>` or a subtree root together with the
 * `@luke-ui/react/themes/paper.css` stylesheet when a document needs more than one theme active
 * at once. Omit it, and the stylesheet alone themes the whole document from `:root`.
 */
export const themeClassName = themeClassNameFor(paperTheme.name);

/**
 * Paper's `defineTheme` input, the materially minimal bundled theme: a flat, hairline-bordered
 * look with a blue accent. Read it, copy it, or spread it into your own `defineTheme` call to
 * start from Paper.
 */
export const theme: ThemeInput = paperTheme;
