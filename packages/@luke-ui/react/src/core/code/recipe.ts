import * as stylex from '@stylexjs/stylex';
import { vars } from '../../theme/tokens.stylex.js';
import type { RecipeSelection } from '../styles/stylex-recipe.js';
import { createRecipe, createRecipeStyles } from '../styles/stylex-recipe.js';

const styles = stylex.create({
	root: {
		backgroundColor: vars.color.surface.recessed,
		borderRadius: vars.radius.control,
		color: vars.color.text.primary,
		fontFamily: vars.font.family.code,
		fontSize: '0.8125em',
		lineHeight: 1,
		paddingBlock: '0.15em',
		paddingInline: '0.3em',
		whiteSpace: 'nowrap',
	},
});

/** Canonical resolver for the `Code` component's inline code appearance. */
export const resolveCodeRecipeStyles = createRecipeStyles({
	base: styles.root,
});

/** Recipe for the `Code` component's inline code appearance. */
export const codeRecipe = createRecipe(resolveCodeRecipeStyles);

export type CodeRecipeVariants = RecipeSelection<typeof resolveCodeRecipeStyles>;
