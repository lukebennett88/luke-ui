import type { RecipeSelection } from '../styles/recipe-types.js';
import type { SlottedConfigInput } from '../styles/recipe.js';
import { recipe } from '../styles/recipe.js';

/**
 * Raw slotted config for `Lockup`.
 *
 * Each rail is a flex box that keeps its inline size and centres its items. The body takes the
 * remaining space and can shrink below its content, so long text wraps or truncates instead of
 * widening the row.
 */
const lockupConfig = {
	defaultVariants: {
		isInline: false,
		railAlignment: 'firstLine',
	},
	slots: {
		body: {
			flexGrow: 1,
			minInlineSize: 0,
		},
		rail: {
			alignItems: 'center',
			display: 'flex',
			flexShrink: 0,
		},
		root: {},
	},
	variants: {
		// A phrasing-mode root stays inline-level.
		isInline: {
			false: { root: { display: 'flex' } },
			true: { root: { display: 'inline-flex' } },
		},
		railAlignment: {
			center: { root: { alignItems: 'center' } },
			// The root aligns each rail's baseline with the first baseline of the body. A rail takes
			// its baseline from its first flex item, the empty `::before`, which is `1cap` tall and
			// centred with the rail's items, so they centre on the cap height of the first line. A
			// rail taller than that line makes the row taller.
			firstLine: {
				rail: {
					selectors: {
						'&::before': {
							blockSize: '1cap',
							content: "''",
						},
					},
				},
				root: { alignItems: 'baseline' },
			},
		},
	},
} as const satisfies SlottedConfigInput;

/** Slotted recipe for `Lockup`, `LockupRail`, and `LockupBody`. */
export const lockupRecipe = recipe(lockupConfig);

/** Outer variant selection for the `Lockup` recipe. */
export type LockupRecipeVariants = RecipeSelection<typeof lockupRecipe>;
