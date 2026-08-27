import type { ThemeInput } from '../../define-theme.js';
import { paperTheme } from '../../foundations/paper.js';

/**
 * Paper's `defineTheme` input, the materially minimal bundled theme: a flat, hairline-bordered
 * look with a blue accent. Set it as `extends` on your own input to start from Paper.
 */
export const theme: ThemeInput = paperTheme;
