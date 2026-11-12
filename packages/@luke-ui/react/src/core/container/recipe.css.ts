import { createVar } from '@vanilla-extract/css';
import { containerMaxInlineSizeTokens } from '../styles/container-tokens.js';
import { recipe } from '../styles/recipe.js';

/** Maximum inline size selected by a preset. */
const containerMaxInlineSizeVar = createVar();

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
