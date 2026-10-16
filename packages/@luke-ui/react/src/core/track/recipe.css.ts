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
		// Rendered only for `firstLine`, so no other alignment styles it.
		railContent: {},
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
			// Baseline alignment puts each rail wrapper's baseline on the centre's first baseline, whatever
			// trim, line height, or font size the centre uses. The wrapper's one line box holds
			// `railContent`, which `vertical-align: middle` centres on the x-height. The bottom margin of
			// cap height minus x-height lifts that centre onto half the cap height. A rail taller than the
			// line grows the row. `cap` and `ex` resolve in Track's inherited font, so a different type
			// style belongs on an element around Track. Without `cap` support the margin is dropped and
			// the rail centres on the x-height.
			firstLine: {
				railContent: {
					alignItems: 'center',
					display: 'inline-flex',
					marginBlockEnd: 'calc(1cap - 1ex)',
					verticalAlign: 'middle',
				},
				root: { alignItems: 'baseline' },
			},
			start: { root: { alignItems: 'flex-start' } },
		},
	},
} as const satisfies SlottedConfigInput;

/** Slotted recipe for the `Track` layout component. */
export const trackRecipe = recipe(trackConfig);

/** Outer variant selection for the `Track` recipe. */
export type TrackRecipeVariants = RecipeSelection<typeof trackRecipe>;
