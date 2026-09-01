import * as stylex from '@stylexjs/stylex';
import { tokens } from '../../theme/tokens.stylex.js';
import { recipe } from '../styles/stylex-recipe.js';

const styles = stylex.create({
	root: {
		fontWeight: tokens.fontWeightEmphasis,
	},
});

export const strongRecipe = recipe({
	base: styles.root,
});
