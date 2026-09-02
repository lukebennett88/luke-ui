import * as stylex from '@stylexjs/stylex';
import { vars } from '../../theme/tokens.stylex.js';
import { createSingleRecipe } from '../styles/stylex-recipe.js';

const styles = stylex.create({
	root: {
		fontWeight: vars.fontWeightEmphasis,
	},
});

export const { resolveStyles: resolveStrongRecipeStyles } = createSingleRecipe({
	base: styles.root,
});
