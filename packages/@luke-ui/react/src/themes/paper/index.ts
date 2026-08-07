import type { ThemeInput } from '../../theme/define-theme.js';
import { paperTheme } from '../../theme/foundations/paper.js';

export { themeClassName } from './theme-class-name.js';

/**
 * Paper's `defineTheme` input, the materially minimal bundled theme: a flat, hairline-bordered
 * look with a blue accent. Read it, copy it, or spread it into your own `defineTheme` call to
 * start from Paper.
 */
export const theme: ThemeInput = paperTheme;
