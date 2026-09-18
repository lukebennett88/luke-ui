import type { RecipeSelection } from '../styles/recipe-types.js';
import type { SlottedConfigInput } from '../styles/recipe.js';
import { recipe } from '../styles/recipe.js';

/**
 * Raw slotted config for the `Track` layout component.
 */
const trackConfig = {
	compoundSlots: [
		{
			// Rails keep their inline size.
			slots: ['rail'],
			style: { flexShrink: 0 },
		},
	],
	defaultVariants: {
		isInline: false,
		railAlignment: 'start',
	},
	slots: {
		centre: {
			// Allow the centre to shrink below long words and URLs so the row can use
			// its remaining inline space.
			flexGrow: 1,
			minInlineSize: 0,
		},
		rail: {},
		root: {},
	},
	variants: {
		// Derived from `elementType`; a `span` root stays inline-level.
		isInline: {
			false: { root: { display: 'flex' } },
			true: { root: { display: 'inline-flex' } },
		},
		railAlignment: {
			center: { root: { alignItems: 'center' } },
			end: { root: { alignItems: 'flex-end' } },
			// `1lh` uses Track's inherited line-height, not the rendered line-height of centre
			// children. A fixed block size keeps a taller rail centred on the first line.
			firstLine: {
				rail: {
					alignItems: 'center',
					blockSize: '1lh',
					display: 'flex',
				},
				root: { alignItems: 'flex-start' },
			},
			start: { root: { alignItems: 'flex-start' } },
		},
	},
} as const satisfies SlottedConfigInput;

/** Slotted recipe for the `Track` layout component. */
export const trackRecipe = recipe(trackConfig);

/** Outer variant selection for the `Track` recipe. */
export type TrackRecipeVariants = RecipeSelection<typeof trackRecipe>;
