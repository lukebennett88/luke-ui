import type { RecipeSelection } from '../styles/recipe-types.js';
import type { SlottedConfigInput } from '../styles/recipe.js';
import { recipe } from '../styles/recipe.js';

/**
 * Raw slotted config for the `Track` layout component.
 *
 * Slots: `root` (the flex container), `rail` (either fixed-width rail wrapper), and `centre` (the
 * flexible middle).
 */
const trackConfig = {
	compoundSlots: [
		{
			// Rails never shrink below their content on the inline axis, whichever
			// rail alignment is selected.
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
			// The centre is the only slot allowed to grow, and it must be able to
			// shrink below its content's natural inline size — otherwise unbroken
			// content (a long word or URL) forces the whole row to overflow.
			flexGrow: 1,
			minInlineSize: 0,
		},
		rail: {},
		root: {},
	},
	variants: {
		// Not a public prop: `track.tsx` derives this from `elementType`. A `span`
		// root must stay an inline-level box so it can sit inside a sentence;
		// `div` and `li` roots stay block-level.
		isInline: {
			false: { root: { display: 'flex' } },
			true: { root: { display: 'inline-flex' } },
		},
		railAlignment: {
			center: { root: { alignItems: 'center' } },
			end: { root: { alignItems: 'flex-end' } },
			// `firstLine` keeps the root's own cross-axis alignment at block start, then
			// centres each rail against a fixed block-size of `1lh`. `1lh` resolves against
			// the line-height Track itself inherits, not the actual rendered line-height of
			// centre children, so a differently sized child in the centre (a `Heading`, a
			// larger `Text`) does not move where the rail sits. That is intentional: fixing
			// it would need measuring the centre's children, which this component does not do.
			// The box is a fixed size rather than a minimum so a rail taller than one line
			// (an icon or a `Button`) overflows it symmetrically about the first line's centre,
			// instead of growing the box and dragging the rail's centre below it.
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
