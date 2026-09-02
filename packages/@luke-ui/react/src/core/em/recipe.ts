import * as stylex from '@stylexjs/stylex';
import { createSingleRecipe } from '../styles/stylex-recipe.js';

const styles = stylex.create({
	root: {
		fontStyle: 'italic',
	},
});

export const [, resolveEmRecipeStyles] = createSingleRecipe({
	base: styles.root,
});
