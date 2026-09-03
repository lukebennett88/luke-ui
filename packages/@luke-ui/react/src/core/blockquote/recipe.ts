import * as stylex from '@stylexjs/stylex';
import { vars } from '../../theme/tokens.stylex.js';
import type { RecipeSelection } from '../styles/stylex-recipe.js';
import { createSingleRecipe } from '../styles/stylex-recipe.js';

const styles = stylex.create({
	root: {
		borderInlineStartColor: vars.color.border.decorative,
		borderInlineStartStyle: 'solid',
		borderInlineStartWidth: '3px',
		paddingInlineStart: vars.space.sp16,
	},
});

/** Recipe for the `Blockquote` component's left-border accent. */
export const [blockquoteRecipe, resolveBlockquoteRecipeStyles] = createSingleRecipe({
	base: styles.root,
});

export type BlockquoteRecipeVariants = RecipeSelection<typeof blockquoteRecipe>;
