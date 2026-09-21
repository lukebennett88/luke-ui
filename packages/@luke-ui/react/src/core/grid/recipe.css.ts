import type { RecipeSelection } from '../styles/recipe-types.js';
import { createResponsiveCssProperty } from '../styles/create-responsive-css-property.js';
import { recipe } from '../styles/recipe.js';

/** Responsive `grid-template-columns: repeat(N, minmax(0, 1fr))` for `Grid`. */
export const gridColumnsProperty = createResponsiveCssProperty('grid-columns', (columnsVar) => ({
	gridTemplateColumns: `repeat(${columnsVar}, minmax(0, 1fr))`,
}));

/** Recipe for an equal-column explicit grid. */
export const gridRecipe = recipe({
	base: {
		display: 'grid',
	},
});

/** Variant type for the `Grid` recipe. */
export type GridRecipeVariants = RecipeSelection<typeof gridRecipe>;
