import type { RecipeSelection } from '../styles/recipe-types.js';
import { recipe } from '../styles/recipe.js';

/** Pixel values for fixed `maxInlineSize` tokens on `Container`. */
export const containerMaxInlineSizeTokens = {
	ct448: '448px',
	ct672: '672px',
	ct896: '896px',
	ct1152: '1152px',
	ct1280: '1280px',
} as const;

/** Recipe for a size container that constrains content inline size. */
export const containerRecipe = recipe({
	base: {
		boxSizing: 'border-box',
		containerType: 'inline-size',
		inlineSize: '100%',
	},
	variants: {
		maxInlineSize: {
			ct448: { maxInlineSize: containerMaxInlineSizeTokens.ct448 },
			ct672: { maxInlineSize: containerMaxInlineSizeTokens.ct672 },
			ct896: { maxInlineSize: containerMaxInlineSizeTokens.ct896 },
			ct1152: { maxInlineSize: containerMaxInlineSizeTokens.ct1152 },
			ct1280: { maxInlineSize: containerMaxInlineSizeTokens.ct1280 },
		},
	},
});

/** Variant type for the `Container` recipe. */
export type ContainerRecipeVariants = RecipeSelection<typeof containerRecipe>;
