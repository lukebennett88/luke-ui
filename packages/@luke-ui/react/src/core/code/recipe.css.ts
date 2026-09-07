import { vars } from '../../theme/contract.css.js';
import type { RecipeSelection } from '../styles/recipe.js';
import { recipe } from '../styles/recipe.js';

/**
 * Public chip appearance for inline code: box, code font family, and the optical size
 * correction the code font needs. Colour and weight inherit from the surrounding text through
 * `Code`'s `shouldInheritFont`, so they are not part of this recipe.
 *
 * `shouldWrap` keeps the content on one line by default (`false`) and allows it to wrap onto
 * multiple lines when set to `true`.
 */
export const codeRecipe = recipe({
	base: {
		backgroundColor: vars.color.surface.recessed,
		borderRadius: vars.radius.control,
		fontFamily: vars.font.family.code,
		// Monospace carries a larger x-height, so inline code reads larger than its surroundings
		// at the same nominal size. Keep the correction in `em` so it tracks the inherited size.
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
