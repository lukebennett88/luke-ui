import type { ThemeInput } from '../../theme/define-theme.js';
import { tactileTheme } from '../../theme/foundations/tactile.js';

/**
 * Tactile's `defineTheme` input, the Luke UI default: a teal accent, a neutral near-white light
 * canvas, and a compact tactile material. Set it as `extends` on your own input to start from
 * Tactile.
 */
export const theme: ThemeInput = tactileTheme;
