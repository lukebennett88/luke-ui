import type { ButtonPresentationProps } from '../action-presentation.js';
import { buttonRecipeInternal } from '../primitives/button/recipe.css.js';
import type { RecipeComposition } from '../styles/recipe.js';
import { withDefaultVariants } from '../styles/recipe.js';

/** Styles a Button from the same presentation props accepted by `Button`. */
export const buttonRecipe = withDefaultVariants<
	NonNullable<Parameters<typeof buttonRecipeInternal>[0]>,
	ButtonPresentationProps & RecipeComposition
>(buttonRecipeInternal, {
	appearance: 'button',
	isBlock: false,
	prominence: 'standard',
	size: 'medium',
	tone: 'neutral',
});

/** Presentation props accepted by `buttonRecipe`. */
export type ButtonRecipeVariants = ButtonPresentationProps;
