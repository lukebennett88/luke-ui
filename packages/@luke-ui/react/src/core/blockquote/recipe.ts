import * as stylex from '@stylexjs/stylex';
import { vars } from '../../theme/tokens.stylex.js';
import type { RecipeSelection } from '../styles/recipe-authoring.js';
import { recipe } from '../styles/recipe-authoring.js';

/**
 * Authored styles for the `Blockquote` component's left-border accent.
 *
 * Declared separately from the recipe below because `Blockquote` composes `Text` rather than
 * styling its own element: it layers this compiled style over Text's own styles through `xstyle`,
 * so the two resolve in one `stylex.props(...)` call.
 */
export const styles = stylex.create({
	root: {
		borderInlineStartColor: vars.color.border.decorative,
		borderInlineStartStyle: 'solid',
		borderInlineStartWidth: '3px',
		paddingInlineStart: vars.space.sp16,
	},
});

/** Recipe for the `Blockquote` component's left-border accent. */
export const blockquoteRecipe = recipe({
	base: styles.root,
});

export type BlockquoteRecipeVariants = RecipeSelection<typeof blockquoteRecipe>;
