import * as stylex from '@stylexjs/stylex';
import { vars } from '../../theme/tokens.stylex.js';
import type { RecipeSelection } from '../styles/stylex-recipe.js';
import { createSingleRecipe } from '../styles/stylex-recipe.js';

const styles = stylex.create({
	root: {
		'border-inline-start': `3px solid ${vars.colorBorderDecorative}`,
		'padding-inline-start': vars.spaceSp16,
	},
});

/** Recipe for the `Blockquote` component's left-border accent. */
export const { recipe: blockquoteRecipe, resolveStyles: resolveBlockquoteRecipeStyles } =
	createSingleRecipe({
		base: styles.root,
	});

export type BlockquoteRecipeVariants = RecipeSelection<typeof blockquoteRecipe>;
