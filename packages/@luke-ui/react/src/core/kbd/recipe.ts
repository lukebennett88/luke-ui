import * as stylex from '@stylexjs/stylex';
import { vars } from '../../theme/tokens.stylex.js';
import type { RecipeSelection } from '../styles/stylex-recipe.js';
import { createSingleRecipe } from '../styles/stylex-recipe.js';

const styles = stylex.create({
	root: {
		alignItems: 'center',
		backgroundColor: vars.colorSurfaceRecessed,
		borderColor: vars.colorBorderDecorative,
		borderRadius: vars.radiusControl,
		borderStyle: 'solid',
		borderWidth: '1px',
		color: vars.colorTextPrimary,
		display: 'inline-flex',
		fontFamily: vars.fontFamilyCode,
		fontSize: '12px',
		fontWeight: vars.fontWeightBody,
		inlineSize: 'fit-content',
		lineHeight: 1,
		paddingBlock: '0.1em',
		paddingInline: '0.35em',
		whiteSpace: 'nowrap',
	},
});

/** Recipe for the `Kbd` component's inline keyboard-key appearance. */
export const [kbdRecipe, resolveKbdRecipeStyles] = createSingleRecipe({
	base: styles.root,
});

export type KbdRecipeVariants = RecipeSelection<typeof kbdRecipe>;
