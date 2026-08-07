import type { ThemeInput } from '../../theme/define-theme.js';
import { paperTheme } from '../../theme/foundations/paper.js';

export { themeClassName } from './theme-class-name.js';

/**
 * Paper's `defineTheme` input, the materially minimal bundled theme: a flat, hairline-bordered
 * look with a blue accent. Read it, or set it as `extends` on your own input to start from Paper and
 * override one part of it.
 */
export const theme: ThemeInput = paperTheme;
