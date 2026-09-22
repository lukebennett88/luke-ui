import { createResponsiveCssProperty } from '../styles/create-responsive-css-property.js';
import type { RecipeSelection } from '../styles/recipe-types.js';
import { recipe } from '../styles/recipe.js';

/** Responsive `repeat(auto-fit, minmax(min(value, 100%), 1fr))` for `AutoGrid`. */
export const autoGridMinColumnInlineSizeProperty = createResponsiveCssProperty(
	'auto-grid-min-column-inline-size',
	(minColumnInlineSizeVar) => ({
		gridTemplateColumns: `repeat(auto-fit, minmax(min(${minColumnInlineSizeVar}, 100%), 1fr))`,
	}),
);

/** Recipe for an intrinsic equal-column grid. */
export const autoGridRecipe = recipe({
	base: {
		display: 'grid',
	},
});

/** Variant type for the `AutoGrid` recipe. */
export type AutoGridRecipeVariants = RecipeSelection<typeof autoGridRecipe>;
