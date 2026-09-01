import * as stylex from '@stylexjs/stylex';
import { tokens } from '../../theme/tokens.stylex.js';
import type { RecipeSelection } from '../styles/stylex-recipe.js';
import { createSingleRecipe } from '../styles/stylex-recipe.js';

const styles = stylex.create({
	root: {
		backgroundColor: tokens.colorSurfaceRecessed,
		borderRadius: tokens.radiusControl,
		color: tokens.colorTextPrimary,
		fontFamily: tokens.fontFamilyCode,
		fontSize: '0.8125em',
		lineHeight: 1,
		'padding-block': '0.15em',
		'padding-inline': '0.3em',
		whiteSpace: 'nowrap',
	},
});

/** Recipe for the `Code` component's inline code appearance. */
export const { recipe: codeRecipe, resolveStyles: resolveCodeRecipeStyles } = createSingleRecipe({
	base: styles.root,
});

export type CodeRecipeVariants = RecipeSelection<typeof codeRecipe>;
