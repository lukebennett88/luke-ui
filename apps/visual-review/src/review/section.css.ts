import { vars } from '@luke-ui/react/theme';
import { globalStyle, style } from '@vanilla-extract/css';
import { appVars } from '../styles/app-tokens.css.js';
import { compactQuery, regularQuery } from '../styles/queries.js';
import { plainButton, truncate } from './review.css.js';

const sectionContainer = 'review-section';
const narrowSection = `${sectionContainer} (inline-size < 1120px)`;

/** One example: a header that names it and holds its theme tabs, over the capture on its stage. */
export const section = style({
	background: appVars.stage,
	containerName: sectionContainer,
	containerType: 'inline-size',
	marginBlockEnd: vars.space['24'],
	overflow: 'clip',
	scrollMarginBlockStart: appVars.topBarHeight,
	'@container': {
		[compactQuery]: {
			marginBlockEnd: vars.space['16'],
		},
	},
});

/** A viewed example folds to one plain row. */
export const sectionCollapsed = style({
	background: 'none',
	marginBlockEnd: vars.space['4'],
	overflow: 'visible',
	'@container': {
		[compactQuery]: {
			marginBlockEnd: 0,
		},
	},
});

// An open example after a run of viewed rows gets room above it.
globalStyle(`${sectionCollapsed} + ${section}:not(${sectionCollapsed})`, {
	marginBlockStart: '20px',
	'@container': {
		[compactQuery]: {
			marginBlockStart: vars.space['12'],
		},
	},
});

export const head = style({
	alignItems: 'center',
	background: vars.color.background.surface.subdued,
	boxSizing: 'border-box',
	columnGap: vars.space['16'],
	display: 'grid',
	gridTemplateAreas: '"name tabs"',
	gridTemplateColumns: 'minmax(0, max-content) minmax(0, 1fr)',
	insetBlockStart: appVars.topBarHeight,
	minBlockSize: appVars.sectionHeadHeight,
	paddingInline: `${vars.space['8']} ${vars.space['12']}`,
	position: 'sticky',
	zIndex: 10,
	'@container': {
		[compactQuery]: {
			gridTemplateAreas: '"name" "tabs"',
			gridTemplateColumns: 'minmax(0, 1fr)',
			paddingInline: vars.space['4'],
			// The capture runs edge to edge on a phone, so the header scrolls with it.
			position: 'static',
		},
	},
});

export const headCollapsed = style({
	background: 'none',
	gridTemplateAreas: '"name meta"',
	gridTemplateColumns: 'minmax(0, 1fr) auto',
	minBlockSize: '40px',
	position: 'static',
	selectors: {
		'&:hover': {
			background: vars.interaction.tint.hover,
		},
	},
	'@container': {
		[compactQuery]: {
			gridTemplateAreas: '"name meta"',
			gridTemplateColumns: 'minmax(0, 1fr) auto',
			minBlockSize: '44px',
		},
	},
});

export const name = style({
	font: 'inherit',
	gridArea: 'name',
	margin: 0,
	minInlineSize: 0,
});

export const nameButton = style([
	plainButton,
	{
		alignItems: 'center',
		boxSizing: 'border-box',
		display: 'flex',
		gap: '6px',
		maxInlineSize: '100%',
		minBlockSize: '36px',
		paddingInline: '6px 8px',
		'@container': {
			[compactQuery]: {
				minBlockSize: '44px',
			},
		},
	},
]);

export const chevron = style({
	color: vars.color.foreground.secondary,
	flexShrink: 0,
	transition: 'rotate 150ms ease-out',
	selectors: {
		[`${nameButton}[aria-expanded="false"] &`]: {
			rotate: '-90deg',
		},
	},
	'@media': {
		'(prefers-reduced-motion: reduce)': {
			transition: 'none',
		},
	},
});

export const nameText = style([
	truncate,
	{
		fontWeight: vars.font.weight.heading,
		selectors: {
			[`${headCollapsed} &`]: {
				color: vars.color.foreground.secondary,
				fontWeight: vars.font.weight.body,
			},
		},
	},
]);

/** The component prefix. Narrow sections and phones drop it to keep one row. */
export const componentPrefix = style({
	color: vars.color.foreground.secondary,
	fontWeight: vars.font.weight.body,
	'@container': {
		[compactQuery]: {
			display: 'none',
		},
		[narrowSection]: {
			display: 'none',
		},
	},
});

export const collapsedMeta = style({
	alignItems: 'center',
	color: vars.color.foreground.secondary,
	display: 'inline-flex',
	gap: '6px',
	gridArea: 'meta',
	paddingInlineEnd: vars.space['8'],
	whiteSpace: 'nowrap',
});

export const tabsFade = style({
	gridArea: 'tabs',
	minInlineSize: 0,
	position: 'relative',
	scrollbarWidth: 'none',
});

export const tabList = style({
	display: 'flex',
	gap: '2px',
	inlineSize: 'max-content',
	paddingBlock: vars.space['4'],
	position: 'relative',
	'@container': {
		[compactQuery]: {
			marginInline: vars.space['4'],
			paddingBlock: `0 ${vars.space['4']}`,
		},
	},
});

export const tab = style({
	alignItems: 'center',
	color: vars.color.foreground.primary,
	display: 'inline-flex',
	flexShrink: 0,
	gap: '6px',
	minBlockSize: '30px',
	outline: 'none',
	paddingInline: '10px',
	whiteSpace: 'nowrap',
	selectors: {
		'&[data-hovered]': {
			background: vars.interaction.tint.hover,
		},
		'&[data-selected], &[data-pressed]': {
			background: vars.interaction.tint.pressed,
			color: vars.color.foreground.primary,
		},
		// Unviewed tabs read as the work left: full ink. Viewed tabs step back.
		'&[data-state="seen"]:not([data-selected], [data-hovered], [data-pressed])': {
			color: vars.color.foreground.secondary,
		},
		'&[data-focus-visible]': {
			outline: `2px solid ${vars.color.focus}`,
			outlineOffset: '-3px',
		},
	},
	'@container': {
		[compactQuery]: {
			minBlockSize: '44px',
		},
	},
});

export const panel = style({
	// Swapping a theme replaces the panel. Keep scroll anchoring from jumping the page.
	overflowAnchor: 'none',
});

/* ------------------------------------------------------------------- stage */

export const stage = style({
	color: vars.color.foreground.primary,
	paddingBlock: `${vars.space['4']} ${vars.space['24']}`,
	paddingInline: vars.space['24'],
	position: 'relative',
	'@container': {
		[compactQuery]: {
			padding: 0,
		},
	},
});

/** Above the capture on wider screens: the image's name, and its details on hover or focus. */
export const caption = style({
	alignItems: 'center',
	color: vars.color.foreground.secondary,
	display: 'flex',
	gap: vars.space['12'],
	justifyContent: 'space-between',
	marginBlockEnd: vars.space['4'],
	minBlockSize: '36px',
	'@container': {
		[compactQuery]: {
			display: 'none',
		},
	},
});

export const captionLabel = style({
	color: vars.color.foreground.primary,
	fontWeight: vars.font.weight.heading,
});

export const captionEnd = style({
	alignItems: 'center',
	display: 'inline-flex',
	gap: vars.space['12'],
});

/**
 * Shown while the pointer is over the stage. Hidden, not transparent, so it leaves the tab order and
 * the accessibility tree: View options holds the same details and controls.
 */
export const onDemand = style({
	opacity: 0,
	visibility: 'hidden',
	selectors: {
		[`${stage}:hover &`]: {
			opacity: 1,
			visibility: 'visible',
		},
	},
	'@media': {
		'(hover: none)': {
			opacity: 1,
			visibility: 'visible',
		},
	},
});

/** On phones, names any image that is not Actual, over its corner. */
export const chip = style({
	background: vars.color.background.surface.raised,
	borderRadius: vars.radius.detail,
	color: vars.color.foreground.primary,
	fontWeight: vars.font.weight.heading,
	insetBlockStart: vars.space['8'],
	insetInlineStart: vars.space['8'],
	paddingBlock: '2px',
	paddingInline: vars.space['8'],
	pointerEvents: 'none',
	position: 'absolute',
	zIndex: 2,
	'@container': {
		[regularQuery]: {
			display: 'none',
		},
	},
});

export const scroller = style({
	outlineOffset: '2px',
	overflowX: 'auto',
	overflowY: 'hidden',
	position: 'relative',
	scrollbarWidth: 'thin',
	'@container': {
		[compactQuery]: {
			cursor: 'zoom-in',
			touchAction: 'pan-y pinch-zoom',
		},
	},
});

export const scrollerZoomed = style({
	'@container': {
		[compactQuery]: {
			cursor: 'zoom-out',
			touchAction: 'pan-x pan-y pinch-zoom',
		},
	},
});

export const comparison = style({
	display: 'grid',
	gap: vars.space['24'],
	inlineSize: 'max-content',
	marginInline: 'auto',
	'@container': {
		[compactQuery]: {
			gap: 0,
		},
	},
});

export const comparisonColumns = style({
	gridAutoFlow: 'column',
});

export const figure = style({
	display: 'grid',
	gap: '6px',
	justifyItems: 'start',
	margin: 0,
});

export const figcaption = style({
	color: vars.color.foreground.secondary,
	lineHeight: '20px',
	'@container': {
		[compactQuery]: {
			display: 'none',
		},
	},
});

export const overlayStack = style({
	display: 'grid',
});

export const overlayLayer = style({
	gridArea: '1 / 1',
});

export const frame = style({
	position: 'relative',
});

export const image = style({
	display: 'block',
	maxInlineSize: 'none',
});

export const pixelated = style({
	imageRendering: 'pixelated',
});

export const region = style({
	borderRadius: '2px',
	boxShadow: `0 0 0 1px ${appVars.differenceHalo}`,
	outline: `2px solid ${appVars.difference}`,
	pointerEvents: 'none',
	position: 'absolute',
});

export const regionActive = style({
	boxShadow: `0 0 0 2px ${appVars.differenceHalo}`,
	outlineWidth: '3px',
	zIndex: 1,
});
