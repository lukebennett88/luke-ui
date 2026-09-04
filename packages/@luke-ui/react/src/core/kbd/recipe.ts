import * as stylex from '@stylexjs/stylex';
import { fontMetrics } from '../../theme/font-metric-scale.stylex.js';
import { vars } from '../../theme/tokens.stylex.js';
import type { RecipeSelection } from '../styles/stylex-recipe.js';
import { createRecipe, createRecipeStyles } from '../styles/stylex-recipe.js';

const styles = stylex.create({
	root: {
		alignItems: 'center',
		backgroundColor: vars.color.surface.recessed,
		borderColor: vars.color.border.decorative,
		borderRadius: vars.radius.control,
		borderStyle: 'solid',
		borderWidth: '1px',
		color: vars.color.text.primary,
		display: 'inline-flex',
		fontFamily: vars.font.family.code,
		fontSize: fontMetrics.step12.fontSize,
		fontWeight: vars.font.weight.body,
		inlineSize: 'fit-content',
		lineHeight: 1,
		paddingBlock: '0.1em',
		paddingInline: '0.35em',
		whiteSpace: 'nowrap',
	},
});

/** Canonical resolver for the `Kbd` component's inline keyboard-key appearance. */
export const resolveKbdRecipeStyles = createRecipeStyles({
	base: styles.root,
});

/** Recipe for the `Kbd` component's inline keyboard-key appearance. */
export const kbdRecipe = createRecipe(resolveKbdRecipeStyles);

export type KbdRecipeVariants = RecipeSelection<typeof resolveKbdRecipeStyles>;
