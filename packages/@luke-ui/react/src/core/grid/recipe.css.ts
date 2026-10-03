import { createResponsiveCssProperty } from '../styles/create-responsive-css-property.js';
import type { RecipeSelection } from '../styles/recipe-types.js';
import { recipe } from '../styles/recipe.js';

/** Responsive `grid-template-columns` for `Grid`. The variable holds the whole track list. */
export const gridColumnsProperty = createResponsiveCssProperty('grid-columns', (columnsVar) => ({
	gridTemplateColumns: columnsVar,
}));

/** Responsive `grid-template-rows` for `Grid`. The variable holds the whole track list. */
export const gridRowsProperty = createResponsiveCssProperty('grid-rows', (rowsVar) => ({
	gridTemplateRows: rowsVar,
}));

/** Responsive `grid-template-areas` for `Grid`. The variable holds the formatted area rows. */
export const gridAreasProperty = createResponsiveCssProperty('grid-areas', (areasVar) => ({
	gridTemplateAreas: areasVar,
}));

/** Recipe for a CSS grid container. */
export const gridRecipe = recipe({
	base: {
		display: 'grid',
	},
});

/** Variant type for the `Grid` recipe. */
export type GridRecipeVariants = RecipeSelection<typeof gridRecipe>;
