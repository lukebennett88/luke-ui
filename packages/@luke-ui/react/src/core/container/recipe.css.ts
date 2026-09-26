import { createVar } from '@vanilla-extract/css';
import { rem } from '../../theme/rem.js';
import type { RecipeSelection } from '../styles/recipe-types.js';
import { recipe } from '../styles/recipe.js';

/** Rem values for fixed `maxInlineSize` tokens on `Container` (16px-root design units). */
export const containerMaxInlineSizeTokens = {
	ct448: rem(448),
	ct672: rem(672),
	ct896: rem(896),
	ct1152: rem(1152),
	ct1280: rem(1280),
} as const;

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
			ct448: { vars: { [containerMaxInlineSizeVar]: containerMaxInlineSizeTokens.ct448 } },
			ct672: { vars: { [containerMaxInlineSizeVar]: containerMaxInlineSizeTokens.ct672 } },
			ct896: { vars: { [containerMaxInlineSizeVar]: containerMaxInlineSizeTokens.ct896 } },
			ct1152: { vars: { [containerMaxInlineSizeVar]: containerMaxInlineSizeTokens.ct1152 } },
			ct1280: { vars: { [containerMaxInlineSizeVar]: containerMaxInlineSizeTokens.ct1280 } },
		},
	},
});

/** Variant type for the `Container` recipe. */
export type ContainerRecipeVariants = RecipeSelection<typeof containerRecipe>;
