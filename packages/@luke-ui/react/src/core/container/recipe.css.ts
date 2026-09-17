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

/**
 * Custom property that supplies `maxInlineSize` for both token and arbitrary values.
 * Callers override with `style.maxInlineSize` or a utility class the same way for either form.
 */
export const containerMaxInlineSizeVar = '--luke-container-max-inline-size';

/** Recipe for a size container that constrains content inline size. */
export const containerRecipe = recipe({
	base: {
		boxSizing: 'border-box',
		containerType: 'inline-size',
		inlineSize: '100%',
		maxInlineSize: `var(${containerMaxInlineSizeVar})`,
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
