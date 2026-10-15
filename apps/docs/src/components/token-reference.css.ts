import { vars } from '@luke-ui/react/theme';
import { visuallyHiddenStyle } from '@luke-ui/react/visually-hidden';
import { globalStyle, style } from '@vanilla-extract/css';
import { SITE_HEADER_BLOCK_SIZE } from './site-header-size.js';

// DS gap: Text has no font family prop, and `Code` always draws a chip. Token names and values want
// the code font without one. Box has no overflowWrap prop, and a long CSS variable name has no
// break opportunity, so it may break anywhere rather than push the column wider than the page.
export const code = style({
	'@layer': {
		components: {
			fontFamily: vars.font.family.code,
			overflowWrap: 'anywhere',
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
// rows, and Find targets clear the site header.
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

// DS gap: Box has no scroll margin prop. Find targets clear the site header.
export const tile = style({
	'@layer': {
		components: {
			scrollMarginBlockStart: `calc(${SITE_HEADER_BLOCK_SIZE} + ${vars.space.sp24})`,
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
			tableLayout: 'auto',
			'@container': {
				[TYPE_NARROW]: {
					display: 'block',
				},
			},
		},
	},
});

// DS gap: Box has no container-query display. The headers stay in the accessibility tree when the
// rows stack.
export const typeHead = style({
	'@layer': {
		components: {
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

// DS gap: Box has no container-query display or grid template. A narrow token row puts its full
// name and CSS variable above the value and copy control.
export const typeRow = style({
	'@layer': {
		components: {
			'@container': {
				[TYPE_NARROW]: {
					borderBlockEnd: `1px solid ${vars.color.border.decorative}`,
					display: 'grid',
					gridTemplateColumns: `minmax(0, 1fr) calc(${vars.space.sp48} + ${vars.space.sp8})`,
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

// DS gap: Button has no minBlockSize prop, so its target grows on narrow screens.
export const tokenCopyButton = style({
	'@layer': {
		components: {
			minBlockSize: vars.space.sp48,
			'@media': {
				'(min-width: 48rem)': {
					minBlockSize: vars.space.sp32,
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

// DS gap: Box has no container-query grid placement. The token identification uses the full row;
// the value stays in the first narrow column.
export const typeNameCell = style({
	'@layer': {
		components: {
			paddingBlock: vars.space.sp8,
			'@container': {
				[TYPE_NARROW]: {
					gridColumn: '1 / -1',
					paddingBlock: vars.space.sp12,
				},
			},
		},
	},
});

// DS gap: Box has no container-query grid placement or white-space prop. The resolved value stays
// compact on desktop and can wrap on narrow screens.
export const typeValueCell = style({
	'@layer': {
		components: {
			paddingBlock: vars.space.sp8,
			whiteSpace: 'nowrap',
			'@container': {
				[TYPE_NARROW]: {
					gridColumn: '1',
					paddingBlock: vars.space.sp12,
					whiteSpace: 'normal',
				},
			},
		},
	},
});

// DS gap: Box has no container-query grid placement. The icon control sits beside the value.
export const typeActionCell = style({
	'@layer': {
		components: {
			'@container': {
				[TYPE_NARROW]: {
					gridColumn: '2',
				},
			},
		},
	},
});

// DS gap: Box has no native button reset or hover background props. The icon control grows with the
// narrow table layout; its native focus ring remains visible.
export const typeCopyButton = style({
	'@layer': {
		components: {
			backgroundColor: 'transparent',
			border: 'none',
			borderRadius: vars.radius.control,
			color: 'inherit',
			inlineSize: vars.space.sp32,
			minBlockSize: vars.space.sp32,
			padding: 0,
			selectors: {
				'&:hover': {
					backgroundColor: vars.color.background.neutral.subtle.hover,
				},
				'&:active': {
					backgroundColor: vars.color.background.neutral.subtle.pressed,
				},
			},
			'@container': {
				[TYPE_NARROW]: {
					inlineSize: vars.space.sp48,
					minBlockSize: vars.space.sp48,
				},
			},
		},
	},
});

// DS gap: the copy column is an icon action, so its header stays available to assistive technology
// without taking visual space.
export const typeCopyHeader = style({
	'@layer': {
		components: {
			...visuallyHiddenStyle,
		},
	},
});

/** The inline size of a duration sample's track. */
export const MOTION_TRACK_SIZE = '6rem';
/** The size of the dot that travels a duration sample's track. */
export const MOTION_DOT_SIZE = vars.space.sp12;

// DS gap: Box has no transform or transition props, and Luke UI ships no motion sample. The dot
// rests at the start of its track. It travels the track when someone hovers, focuses, or taps its
// row, over the token's own duration (set inline) with the standard easing, and never loops.
export const motionDot = style({
	'@layer': {
		components: {
			transitionProperty: 'transform',
			transitionTimingFunction: vars.motion.easing.standard,
			'@media': {
				'(prefers-reduced-motion: reduce)': {
					transition: 'none',
				},
			},
		},
	},
});

globalStyle(`${row}:hover ${motionDot}, ${row}:focus-within ${motionDot}`, {
	'@layer': {
		components: {
			transform: `translateX(calc(${MOTION_TRACK_SIZE} - ${MOTION_DOT_SIZE}))`,
			'@media': {
				'(prefers-reduced-motion: reduce)': {
					transform: 'none',
				},
			},
		},
	},
});

// DS gap: Box has no transform prop, and logical properties have no transform. The track runs
// right to left in a right-to-left page.
globalStyle(`[dir="rtl"] ${row}:hover ${motionDot}, [dir="rtl"] ${row}:focus-within ${motionDot}`, {
	'@layer': {
		components: {
			transform: `translateX(calc(${MOTION_DOT_SIZE} - ${MOTION_TRACK_SIZE}))`,
			'@media': {
				'(prefers-reduced-motion: reduce)': {
					transform: 'none',
				},
			},
		},
	},
});

// DS gap: no primitive draws a chart, and SVG strokes take no Box props. The easing plot draws its
// curve in the primary text colour over decorative guides.
export const easingCurve = style({
	'@layer': {
		components: {
			fill: 'none',
			stroke: vars.color.text.primary,
			strokeLinecap: 'round',
			strokeWidth: 2,
		},
	},
});

export const easingGuide = style({
	'@layer': {
		components: {
			fill: 'none',
			stroke: vars.color.border.decorative,
			strokeWidth: 1,
		},
	},
});

export const easingHandle = style({
	'@layer': {
		components: {
			fill: 'none',
			stroke: vars.color.text.secondary,
			strokeDasharray: '2 3',
			strokeWidth: 1,
		},
	},
});

// DS gap: SVG has no Box props. The plot keeps its square shape at any inline size.
export const easingPlot = style({
	'@layer': {
		components: {
			display: 'block',
			overflow: 'visible',
		},
	},
});
