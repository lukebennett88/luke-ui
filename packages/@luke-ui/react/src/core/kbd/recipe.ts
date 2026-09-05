import { fontMetrics } from '../../theme/font-metric-scale.stylex.js';
import { vars } from '../../theme/tokens.stylex.js';
import type { RecipeSelection } from '../styles/recipe-authoring.js';
import { recipe } from '../styles/recipe-authoring.js';

/** Recipe for the `Kbd` component's inline keyboard-key appearance. */
export const kbdRecipe = recipe({
	base: {
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

/** Variant type for the `Kbd` recipe. */
export type KbdRecipeVariants = RecipeSelection<typeof kbdRecipe>;
