import * as stylex from '@stylexjs/stylex';
import { tokens } from '../../theme/tokens.stylex.js';
import { createSingleRecipe } from '../styles/stylex-recipe.js';

const styles = stylex.create({
	root: {
		fontWeight: tokens.fontWeightEmphasis,
	},
});

export const { resolveStyles: resolveStrongRecipeStyles } = createSingleRecipe({
	base: styles.root,
});
