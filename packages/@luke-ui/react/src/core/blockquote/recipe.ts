import * as stylex from '@stylexjs/stylex';
import { vars } from '../../theme/tokens.stylex.js';
import type { RecipeSelection } from '../styles/stylex-recipe.js';
import { createRecipe, createRecipeStyles } from '../styles/stylex-recipe.js';

/** Authored styles for the `Blockquote` component's left-border accent. */
export const styles = stylex.create({
	root: {
		borderInlineStartColor: vars.color.border.decorative,
		borderInlineStartStyle: 'solid',
		borderInlineStartWidth: '3px',
		paddingInlineStart: vars.space.sp16,
	},
});

/** Canonical resolver for the `Blockquote` component's left-border accent. */
const resolveBlockquoteRecipeStyles = createRecipeStyles({
	base: styles.root,
});

/** Recipe for the `Blockquote` component's left-border accent. */
export const blockquoteRecipe = createRecipe(resolveBlockquoteRecipeStyles);

export type BlockquoteRecipeVariants = RecipeSelection<typeof resolveBlockquoteRecipeStyles>;
