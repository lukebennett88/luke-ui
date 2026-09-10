import { buttonRecipe } from '../primitives/button/recipe.css.js';
import type { ButtonRecipeVariants } from '../primitives/button/recipe.css.js';
import { withDefaultVariants } from '../styles/recipe.js';

/** Shared Button recipe with Link's text defaults. */
export const linkRecipe = withDefaultVariants(buttonRecipe, {
	appearance: 'text',
	tone: 'neutral',
	prominence: 'standard',
});

/**
 * Link's supported variant surface. Link shares `buttonRecipe` with Button, but never renders a
 * `critical` tone in either appearance, so that value is narrowed out here rather than hand-written.
 */
export type LinkRecipeVariants = Omit<ButtonRecipeVariants, 'tone'> & {
	tone?: Exclude<NonNullable<ButtonRecipeVariants>['tone'], 'critical'>;
};
