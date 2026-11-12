import { literalScale } from '../../theme/literal-scale.js';

/**
 * Fixed `rem` maximum inline sizes for `container.*` presets. `Container` selects them by variant,
 * and the `maxInlineSize` utility accepts the same keys.
 */
export const containerMaxInlineSizeTokens = literalScale('container.', [
	448, 672, 896, 1152, 1280,
] as const);
