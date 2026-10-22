import { style } from '../styles/layered-style.css.js';
import type { RecipeSelection } from '../styles/recipe-types.js';
import { recipe } from '../styles/recipe.js';
import { transparentSurfaceStyle } from '../styles/surface.js';
import { codeAppearance } from './appearance.js';

export const codeElementClassName = style({}, 'code');

/**
 * Appearance for inline code: a chip with its own neutral foreground context. Weight comes from
 * surrounding text through `shouldInheritFont`. Inside a code block (`pre`), which already draws
 * the block, the chip drops away and the code takes the block's colours and metrics. `shouldWrap`
 * defaults to keeping the text on one line.
 */
export const codeRecipe = recipe({
	base: [
		codeElementClassName,
		{
			...codeAppearance,
			selectors: {
				'pre &': {
					...transparentSurfaceStyle(),
					border: 'none',
					borderRadius: 0,
					fontSize: 'inherit',
					padding: 0,
					whiteSpace: 'inherit',
				},
			},
		},
	],
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
