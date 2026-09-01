import * as stylex from '@stylexjs/stylex';
import { tokens } from '../../theme/tokens.stylex.js';
import type { RecipeSelection } from '../styles/stylex-recipe.js';
import { recipe } from '../styles/stylex-recipe.js';

const styles = stylex.create({
	root: {
		alignItems: 'center',
		backgroundColor: tokens.colorSurfaceRecessed,
		borderColor: tokens.colorBorderDecorative,
		borderRadius: tokens.radiusControl,
		borderStyle: 'solid',
		borderWidth: '1px',
		color: tokens.colorTextPrimary,
		display: 'inline-flex',
		fontFamily: tokens.fontFamilyCode,
		fontSize: '12px',
		fontWeight: tokens.fontWeightBody,
		inlineSize: 'fit-content',
		lineHeight: 1,
		paddingBlock: '0.1em',
		paddingInline: '0.35em',
		whiteSpace: 'nowrap',
	},
});

/** Recipe for the `Kbd` component's inline keyboard-key appearance. */
export const kbdRecipe = recipe({
	base: styles.root,
});

export type KbdRecipeVariants = RecipeSelection<typeof kbdRecipe>;
