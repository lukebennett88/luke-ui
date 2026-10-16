import type { SlottedConfigInput } from '../styles/recipe.js';
import { recipe } from '../styles/recipe.js';

/**
 * Raw slotted config for the `Track` layout component.
 */
const trackConfig = {
	defaultVariants: {
		isInline: false,
	},
	slots: {
		centre: {
			// Allow the centre to shrink below long words and URLs so the row can use
			// its remaining inline space.
			flexGrow: 1,
			minInlineSize: 0,
		},
		// The root aligns each rail's baseline with the first baseline of the centre. A rail takes
		// its baseline from its first flex item, the empty `::before`, which is `1cap` tall and
		// centred with the content, so the content centres on the cap height of the first line.
		// A rail taller than that line makes the row taller.
		rail: {
			alignItems: 'center',
			display: 'flex',
			flexShrink: 0,
			selectors: {
				'&::before': {
					blockSize: '1cap',
					content: "''",
				},
			},
		},
		root: {
			alignItems: 'baseline',
		},
	},
	variants: {
		// Derived from `elementType`; a `span` root stays inline-level.
		isInline: {
			false: { root: { display: 'flex' } },
			true: { root: { display: 'inline-flex' } },
		},
	},
} as const satisfies SlottedConfigInput;

/** Slotted recipe for the `Track` layout component. */
export const trackRecipe = recipe(trackConfig);
