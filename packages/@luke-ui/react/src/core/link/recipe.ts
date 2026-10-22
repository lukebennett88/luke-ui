import type { LinkPresentationProps } from '../action-presentation.js';
import { buttonRecipeInternal } from '../primitives/button/recipe.css.js';
import type { RecipeComposition } from '../styles/recipe-types.js';

/**
 * Recipe for Link's supported appearance and prominence variants. A text Link takes the shared
 * recipe's `link` appearance, so it gets a link's weight and underlines rather than a text Button's.
 */
export function linkRecipe(variants: LinkPresentationProps & RecipeComposition = {}): string {
	return buttonRecipeInternal({
		...variants,
		appearance: variants.appearance === 'button' ? 'button' : 'link',
	});
}

/** Link's supported appearance and prominence variants. */
export type LinkRecipeVariants = LinkPresentationProps;
