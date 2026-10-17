import { breakpoints, vars } from '@luke-ui/react/theme';
import { visuallyHiddenStyle } from '@luke-ui/react/visually-hidden';
import { globalStyle, keyframes, style } from '@vanilla-extract/css';
import { SITE_HEADER_BLOCK_SIZE } from './site-header-size.js';

/** Sticky token panel headers sit below the site header. */
const TOKEN_REFERENCE_PANEL_HEADER_INSET = SITE_HEADER_BLOCK_SIZE;

/** Viewport width below the token row's `bp768` grid. */
const BELOW_TABLET = `(max-width: ${breakpoints.bp768 - 1}px)`;

const PANEL_BORDER = `1px solid ${vars.color.border.decorative}`;

// DS gap: Box has no overflowWrap prop. A long token path may break anywhere rather
// than push the column wider than the page.
export const tokenIdentification = style({
	'@layer': {
		components: {
			overflowWrap: 'anywhere',
		},
	},
});

// DS gap: Box has no sticky positioning, z-index, or per-side border props. The header owns the
// panel's top chrome (borders + outer top radius) so its fill is not clipped inside a parent
// radius. Top radius stays constant while sticky.
export const columnHeaderShell = style({
	'@layer': {
		components: {
			backgroundColor: vars.color.surface.subdued,
			borderBlockStart: PANEL_BORDER,
			borderInlineEnd: PANEL_BORDER,
			borderInlineStart: PANEL_BORDER,
			borderStartEndRadius: vars.radius.surface,
			borderStartStartRadius: vars.radius.surface,
			insetBlockStart: TOKEN_REFERENCE_PANEL_HEADER_INSET,
			position: 'sticky',
			zIndex: 1,
			'@media': {
				[BELOW_TABLET]: {
					...visuallyHiddenStyle,
				},
			},
		},
	},
});

// DS gap: Box has no per-side border props. A rule separates the header from the first row.
export const columnHeader = style({
	'@layer': {
		components: {
			borderBlockEnd: PANEL_BORDER,
		},
	},
});

// DS gap: Box has no per-side border or corner props. Body chrome sits under the sticky header:
// side and bottom borders, bottom radii. Below tablet the sticky header is visually hidden, so the
// body also draws the top border and top radii.
export const panelBody = style({
	'@layer': {
		components: {
			borderBlockEnd: PANEL_BORDER,
			borderEndEndRadius: vars.radius.surface,
			borderEndStartRadius: vars.radius.surface,
			borderInlineEnd: PANEL_BORDER,
			borderInlineStart: PANEL_BORDER,
			'@media': {
				[BELOW_TABLET]: {
					borderBlockStart: PANEL_BORDER,
					borderStartEndRadius: vars.radius.surface,
					borderStartStartRadius: vars.radius.surface,
				},
			},
		},
	},
});

// DS gap: Box has no listStyle prop. Token lists are lists for assistive technology, without
// markers.
export const list = style({
	'@layer': {
		components: {
			listStyle: 'none',
		},
	},
});

// DS gap: Box has no per-side border props or sibling selectors. A rule separates each group of a
// panel from the one before it.
export const group = style({
	'@layer': {
		components: {
			selectors: {
				'& + &': {
					borderBlockStart: `1px solid ${vars.color.border.decorative}`,
				},
			},
		},
	},
});

// DS gap: Box has no per-side border, sibling selector, or scroll margin props. A rule separates
// rows, and hash targets clear the site header.
export const row = style({
	'@layer': {
		components: {
			scrollMarginBlockStart: `calc(${SITE_HEADER_BLOCK_SIZE} + ${vars.space.sp24})`,
			selectors: {
				'& + &': {
					borderBlockStart: `1px solid ${vars.color.border.decorative}`,
				},
			},
		},
	},
});

const TYPE_CONTAINER = 'token-type';
/** Below this inline size each token name sits above its value and copy control. */
const TYPE_NARROW = `${TYPE_CONTAINER} (inline-size < 40rem)`;

// DS gap: Box has no containerType or containerName prop, and its responsive props resolve against
// the root container, not the table's own width.
export const typeFrame = style({
	'@layer': {
		components: {
			containerName: TYPE_CONTAINER,
			containerType: 'inline-size',
		},
	},
});

// DS gap: Box has no tableLayout, borderCollapse, or borderSpacing prop, and no container-query
// display. Separate borders keep the frame's radius. The narrow layout stacks each row's token
// identification above its value, while the table headers remain in the accessibility tree.
export const typeTable = style({
	'@layer': {
		components: {
			borderCollapse: 'separate',
			borderSpacing: 0,
			tableLayout: 'fixed',
			'@container': {
				[TYPE_NARROW]: {
					display: 'block',
					tableLayout: 'auto',
				},
			},
		},
	},
});

// DS gap: Box has no container-query display or viewport media queries. The visible sticky header
// is `TokenColumnHeader`; this thead stays in the accessibility tree and shows below tablet when
// the panel is wide enough for columns.
export const typeHead = style({
	'@layer': {
		components: {
			'@media': {
				[`(min-width: ${breakpoints.bp768}px)`]: {
					...visuallyHiddenStyle,
				},
			},
			'@container': {
				[TYPE_NARROW]: {
					...visuallyHiddenStyle,
				},
			},
		},
	},
});

// DS gap: Box has no container-query display. Each body groups one specimen and its five tokens.
export const typeGroup = style({
	'@layer': {
		components: {
			'@container': {
				[TYPE_NARROW]: {
					display: 'block',
				},
			},
		},
	},
});

// DS gap: Box has no per-side border props. The specimen is a clean full-width row before its
// tokens; the top rule separates it from the preceding table group.
export const typeSpecimen = style({
	'@layer': {
		components: {
			borderBlockStart: `1px solid ${vars.color.border.decorative}`,
			paddingBlock: vars.space.sp12,
			textAlign: 'start',
			'@container': {
				[TYPE_NARROW]: {
					display: 'block',
					paddingBlock: vars.space.sp16,
				},
			},
		},
	},
});

// DS gap: Box has no container-query display prop. The specimen cell fills its stacked table row.
export const typeSpecimenRow = style({
	'@layer': {
		components: {
			'@container': {
				[TYPE_NARROW]: {
					display: 'block',
				},
			},
		},
	},
});

// DS gap: Box has no container-query display. A narrow token row stacks its token name above its
// value.
export const typeRow = style({
	'@layer': {
		components: {
			'@container': {
				[TYPE_NARROW]: {
					borderBlockEnd: `1px solid ${vars.color.border.decorative}`,
					display: 'block',
					selectors: {
						'&:last-child': {
							borderBlockEnd: 'none',
						},
					},
				},
			},
		},
	},
});

// DS gap: Box has no per-side border props or verticalAlign prop. Each token row has one separator.
export const typeCell = style({
	'@layer': {
		components: {
			borderBlockEnd: `1px solid ${vars.color.border.decorative}`,
			scrollMarginBlockStart: `calc(${SITE_HEADER_BLOCK_SIZE} + ${vars.space.sp24})`,
			textAlign: 'start',
			verticalAlign: 'middle',
			selectors: {
				'tbody > tr:last-child > &': {
					borderBlockEnd: 'none',
				},
			},
			'@container': {
				[TYPE_NARROW]: {
					borderBlockEnd: 'none',
					display: 'block',
				},
			},
		},
	},
});

// DS gap: Box has no container-query padding. Token identification padding on narrow screens.
export const typeNameCell = style({
	'@layer': {
		components: {
			paddingBlock: vars.space.sp8,
			'@container': {
				[TYPE_NARROW]: {
					paddingBlock: vars.space.sp12,
				},
			},
		},
	},
});

// DS gap: Box has no container-query padding or white-space prop. The resolved value stays compact
// on desktop and can wrap on narrow screens.
export const typeValueCell = style({
	'@layer': {
		components: {
			paddingBlock: vars.space.sp8,
			whiteSpace: 'nowrap',
			'@container': {
				[TYPE_NARROW]: {
					paddingBlock: vars.space.sp12,
					whiteSpace: 'normal',
				},
			},
		},
	},
});

/** The inline size of a motion sample's track. */
export const MOTION_TRACK_SIZE = '6rem';
/** The size of the dot that travels a motion sample's track. */
export const MOTION_DOT_SIZE = vars.space.sp12;

const motionDotTravelDistance = `calc(${MOTION_TRACK_SIZE} - ${MOTION_DOT_SIZE})`;

/** Motion-sample loop length used by both duration and easing keyframes. */
const MOTION_SAMPLE_CYCLE = '1s';

const motionDotAtStart = {
	transform: 'translateX(0)',
};

const motionDotAtEnd = {
	transform: `translateX(${motionDotTravelDistance})`,
};

/** Duration samples: travel the full track each half-cycle; timing is set inline per token. */
const motionDotTravelDuration = keyframes({
	from: motionDotAtStart,
	to: motionDotAtEnd,
});

/** Easing samples: ~30% travel each way so the curve is readable at a fixed cycle length. */
const motionDotTravelEasing = keyframes({
	'0%, 10%, 90%, 100%': motionDotAtStart,
	'40%, 60%': motionDotAtEnd,
});

// DS gap: Box has no transform prop, and logical properties have no transform. The track runs
// right to left in a right-to-left page.
const motionDotAtEndRtl = {
	transform: `translateX(calc(-1 * ${motionDotTravelDistance}))`,
};

const motionDotTravelDurationRtl = keyframes({
	from: motionDotAtStart,
	to: motionDotAtEndRtl,
});

const motionDotTravelEasingRtl = keyframes({
	'0%, 10%, 90%, 100%': motionDotAtStart,
	'40%, 60%': motionDotAtEndRtl,
});

// DS gap: Box has no animation props, and Luke UI ships no motion sample. Duration samples
// alternate along the track with a per-token linear() timing function inside MOTION_SAMPLE_CYCLE.
// Easing samples rest at each end, cross over ~30% of the cycle, and set animation-timing-function
// inline. Each table toggles motion with data-animate and pauses offscreen.
export const motionSamples = style({
	'@layer': {
		components: {
			display: 'block',
		},
	},
});

export const motionDotDuration = style({
	'@layer': {
		components: {
			animationDirection: 'alternate',
			animationDuration: MOTION_SAMPLE_CYCLE,
			animationIterationCount: 'infinite',
			animationName: motionDotTravelDuration,
			selectors: {
				':where([dir="rtl"]) &': {
					animationName: motionDotTravelDurationRtl,
				},
			},
		},
	},
});

export const motionDotEasing = style({
	'@layer': {
		components: {
			animationDuration: MOTION_SAMPLE_CYCLE,
			animationIterationCount: 'infinite',
			animationName: motionDotTravelEasing,
			selectors: {
				':where([dir="rtl"]) &': {
					animationName: motionDotTravelEasingRtl,
				},
			},
		},
	},
});

globalStyle(`${motionSamples}[data-animate='false'] ${motionDotDuration}`, {
	animation: 'none',
});

globalStyle(`${motionSamples}[data-animate='false'] ${motionDotEasing}`, {
	animation: 'none',
});

globalStyle(`${motionSamples}:not([data-in-view='true']) ${motionDotDuration}`, {
	animationPlayState: 'paused',
});

globalStyle(`${motionSamples}:not([data-in-view='true']) ${motionDotEasing}`, {
	animationPlayState: 'paused',
});
