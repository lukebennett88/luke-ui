import { vars } from '../../theme/tokens.stylex.js';
import type { RecipeSelection } from '../styles/recipe-authoring.js';
import { recipe } from '../styles/recipe-authoring.js';

/** Recipe for the `Code` component's inline code appearance. */
export const codeRecipe = recipe({
	base: {
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

/** Variant type for the `Code` recipe. */
export type CodeRecipeVariants = RecipeSelection<typeof codeRecipe>;
