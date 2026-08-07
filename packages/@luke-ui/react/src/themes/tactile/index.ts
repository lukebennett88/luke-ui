import type { ThemeInput } from '../../theme/define-theme.js';
import { tactileTheme } from '../../theme/foundations/tactile.js';

export { themeClassName } from './theme-class-name.js';

/**
 * Tactile's `defineTheme` input, the Luke UI default: a teal accent, a neutral near-white light
 * canvas, and a compact tactile material. Read it, or set it as `extends` on your own input to start
 * from Tactile and override one part of it.
 */
export const theme: ThemeInput = tactileTheme;
