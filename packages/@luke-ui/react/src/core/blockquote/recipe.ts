import * as stylex from '@stylexjs/stylex';
import { tokens } from '../../theme/tokens.stylex.js';
import type { RecipeSelection } from '../styles/stylex-recipe.js';
import { recipe } from '../styles/stylex-recipe.js';

const styles = stylex.create({
	root: {
		borderInlineStart: `3px solid ${tokens.colorBorderDecorative}`,
		paddingInlineStart: tokens.spaceSp16,
	},
});

/** Recipe for the `Blockquote` component's left-border accent. */
export const blockquoteRecipe = recipe({
	base: styles.root,
});

export type BlockquoteRecipeVariants = RecipeSelection<typeof blockquoteRecipe>;
