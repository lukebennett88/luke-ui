import type { RecipeSelection } from '../styles/recipe-types.js';
import { recipe } from '../styles/recipe.js';

/** Recipe for a preferred inline-to-block ratio. Does not size children. */
export const aspectRatioRecipe = recipe({
	defaultVariants: {
		ratio: '1 / 1',
	},
	variants: {
		ratio: {
			'1 / 1': { aspectRatio: '1 / 1' },
			'3 / 2': { aspectRatio: '3 / 2' },
			'4 / 3': { aspectRatio: '4 / 3' },
			'16 / 9': { aspectRatio: '16 / 9' },
			'21 / 9': { aspectRatio: '21 / 9' },
		},
	},
});

/** Variant type for the `AspectRatio` recipe. */
export type AspectRatioRecipeVariants = RecipeSelection<typeof aspectRatioRecipe>;
