import { createVar } from '@vanilla-extract/css';
import { literalScale } from '../../theme/literal-scale.js';
import { recipe } from '../styles/recipe.js';

/** Rem values for fixed `maxInlineSize` tokens on `Container`. */
export const containerMaxInlineSizeTokens = literalScale('px', [
	448, 672, 896, 1152, 1280,
] as const);

/**
 * Supplies `maxInlineSize` for token variants. Arbitrary values are set via `assignInlineVars`
 * from `Container`.
 */
export const containerMaxInlineSizeVar = createVar();

/** Recipe for a size container that constrains content inline size. */
export const containerRecipe = recipe({
	base: {
		boxSizing: 'border-box',
		containerType: 'inline-size',
		inlineSize: '100%',
		maxInlineSize: containerMaxInlineSizeVar,
	},
	variants: {
		maxInlineSize: {
			px448: { vars: { [containerMaxInlineSizeVar]: containerMaxInlineSizeTokens.px448 } },
			px672: { vars: { [containerMaxInlineSizeVar]: containerMaxInlineSizeTokens.px672 } },
			px896: { vars: { [containerMaxInlineSizeVar]: containerMaxInlineSizeTokens.px896 } },
			px1152: { vars: { [containerMaxInlineSizeVar]: containerMaxInlineSizeTokens.px1152 } },
			px1280: { vars: { [containerMaxInlineSizeVar]: containerMaxInlineSizeTokens.px1280 } },
		},
	},
});
