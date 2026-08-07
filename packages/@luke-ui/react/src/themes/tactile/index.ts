import type { ThemeInput } from '../../theme/define-theme.js';
import { tactileTheme } from '../../theme/foundations/tactile.js';

export { themeClassName } from './theme-class-name.js';

/**
 * Tactile's `defineTheme` input, the Luke UI default: a teal accent, a neutral near-white light
 * canvas, and a compact tactile material. Read it, copy it, or spread it into your own
 * `defineTheme` call to start from Tactile.
 */
export const theme: ThemeInput = tactileTheme;
