import type { LinkPresentationProps } from '../action-presentation.js';
import { buttonRecipeInternal } from '../primitives/button/recipe.css.js';
import { withDefaultVariants } from '../styles/recipe.js';
import type { RecipeComposition } from '../styles/recipe-types.js';

/** Recipe for Link's supported appearance and prominence variants. */
export const linkRecipe = withDefaultVariants<
	NonNullable<Parameters<typeof buttonRecipeInternal>[0]>,
	LinkPresentationProps & RecipeComposition
>(buttonRecipeInternal, {
	appearance: 'text',
	isBlock: false,
	size: 'medium',
	tone: 'neutral',
	prominence: 'standard',
});

/** Link's supported appearance and prominence variants. */
export type LinkRecipeVariants = LinkPresentationProps;
