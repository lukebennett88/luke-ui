import { style } from '../styles/layered-style.css.js';
import type { RecipeSelection } from '../styles/recipe-types.js';
import { recipe } from '../styles/recipe.js';
import { codeAppearance } from './appearance.js';

export const codeElementClassName = style({}, 'code');

/**
 * Appearance for inline code. Colour and weight come from surrounding text through
 * `shouldInheritFont`. `shouldWrap` defaults to keeping the text on one line.
 */
export const codeRecipe = recipe({
	base: [codeElementClassName, codeAppearance],
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
