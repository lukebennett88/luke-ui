import { vars } from '../../theme/contract.css.js';
import type { RecipeSelection } from '../styles/recipe-types.js';
import { recipe } from '../styles/recipe.js';

/**
 * Appearance for inline code. Colour and weight come from surrounding text through
 * `shouldInheritFont`. `shouldWrap` defaults to keeping the text on one line.
 */
export const codeRecipe = recipe({
	base: {
		backgroundColor: vars.color.surface.recessed,
		borderRadius: vars.radius.control,
		fontFamily: vars.font.family.code,
		// Monospace reads large at the same nominal size. Use `em` so the correction tracks the
		// inherited size.
		fontSize: '0.875em',
		paddingBlock: '0.15em',
		paddingInline: '0.3em',
	},
	defaultVariants: {
		shouldWrap: false,
	},
	variants: {
		shouldWrap: {
			false: { whiteSpace: 'nowrap' },
			true: {},
		},
	},
});

export type CodeRecipeVariants = RecipeSelection<typeof codeRecipe>;
