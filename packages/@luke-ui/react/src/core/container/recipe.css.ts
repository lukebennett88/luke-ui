import { createVar } from '@vanilla-extract/css';
import { literalScale } from '../../theme/literal-scale.js';
import { recipe } from '../styles/recipe.js';

/** Rem values for fixed `maxInlineSize` tokens on `Container`. */
export const containerMaxInlineSizeTokens = literalScale('container.', [
	448, 672, 896, 1152, 1280,
] as const);

/** Maximum inline size selected by a preset. */
export const containerMaxInlineSizeVar = createVar();

/** Recipe for a size container that constrains content inline size. */
export const containerRecipe = recipe({
	base: {
		boxSizing: 'border-box',
		containerType: 'inline-size',
		inlineSize: '100%',
		maxInlineSize: containerMaxInlineSizeVar,
	},
	variants: {
		maxInlineSize: {
			'container.448': {
				vars: { [containerMaxInlineSizeVar]: containerMaxInlineSizeTokens['container.448'] },
			},
			'container.672': {
				vars: { [containerMaxInlineSizeVar]: containerMaxInlineSizeTokens['container.672'] },
			},
			'container.896': {
				vars: { [containerMaxInlineSizeVar]: containerMaxInlineSizeTokens['container.896'] },
			},
			'container.1152': {
				vars: { [containerMaxInlineSizeVar]: containerMaxInlineSizeTokens['container.1152'] },
			},
			'container.1280': {
				vars: { [containerMaxInlineSizeVar]: containerMaxInlineSizeTokens['container.1280'] },
			},
		},
	},
});
