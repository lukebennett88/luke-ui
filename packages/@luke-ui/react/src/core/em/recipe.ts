import * as stylex from '@stylexjs/stylex';
import { recipe } from '../styles/stylex-recipe.js';

const styles = stylex.create({
	root: {
		fontStyle: 'italic',
	},
});

export const emRecipe = recipe({
	base: styles.root,
});
