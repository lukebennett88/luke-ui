import { vars } from '../../../theme/contract.css.js';
import type { SlottedConfigInput } from '../../styles/recipe.js';
import { recipe } from '../../styles/recipe.js';

const fieldGroupConfig = {
	slots: {
		root: {
			display: 'flex',
			flexDirection: 'column',
			gap: vars.space['12'],
			minInlineSize: 0,
		},
		options: {
			display: 'flex',
			gap: vars.space['12'],
			minInlineSize: 0,
		},
	},
	variants: {
		orientation: {
			vertical: {
				options: { flexDirection: 'column' },
			},
			horizontal: {
				options: { flexDirection: 'row', flexWrap: 'wrap' },
			},
		},
	},
} as const satisfies SlottedConfigInput;

export const fieldGroupRecipe = recipe(fieldGroupConfig);
