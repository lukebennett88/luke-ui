import { vars } from '@luke-ui/react/theme';
import { globalStyle, keyframes, style } from '@vanilla-extract/css';
import { appVars } from '../styles/app-tokens.css.js';
import { STAGE_PADDING } from '../styles/sizes.js';
import {
	focusRing,
	noTransitionWhenReduced,
	PHONE,
	SECTION_RADIUS,
	touchTargetHeight,
} from '../styles/style-rules.js';

/** One example: a header that names it and holds its theme tabs, over the capture on its stage. */
export const section = style({
	background: appVars.stage,
	borderRadius: SECTION_RADIUS,
	marginBlockEnd: vars.space['24'],
	overflow: 'clip',
	// Scrolling to a section stops below the top bar with room to spare.
	scrollMarginBlockStart: `calc(${appVars.topBarHeight} + ${vars.space['16']})`,
	'@container': {
		[PHONE]: {
			borderRadius: 0,
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
		[PHONE]: {
			marginBlockEnd: 0,
		},
	},
});

// An open example after a run of viewed rows gets room above it.
globalStyle(`${sectionCollapsed} + ${section}:not(${sectionCollapsed})`, {
	marginBlockStart: '20px',
	'@container': {
		[PHONE]: {
			marginBlockStart: vars.space['12'],
		},
	},
});

export const head = style({
	alignItems: 'center',
	background: vars.color.background.surface.subdued,
	borderStartEndRadius: SECTION_RADIUS,
	borderStartStartRadius: SECTION_RADIUS,
	boxSizing: 'border-box',
	columnGap: vars.space['16'],
	display: 'grid',
	gridTemplateAreas: '"name tabs actions" "inspection inspection inspection"',
	gridTemplateColumns: 'minmax(0, max-content) minmax(0, 1fr) auto',
	insetBlockStart: appVars.topBarHeight,
	padding: vars.space['8'],
	position: 'sticky',
	// Closing rounds the header's bottom corners as the capture goes.
	transitionDuration: '150ms',
	transitionProperty: 'border-end-end-radius, border-end-start-radius',
	transitionTimingFunction: 'ease-out',
	zIndex: 10,
	...noTransitionWhenReduced,
	'@container': {
		[PHONE]: {
			gridTemplateAreas: '"name actions" "tabs tabs" "inspection inspection"',
			borderStartEndRadius: 0,
			borderStartStartRadius: 0,
			gridTemplateColumns: 'minmax(0, 1fr) auto',
		},
	},
});

/** A viewed example folds to a row with the open header's fill, rounded on every corner. */
export const headCollapsed = style({
	borderEndEndRadius: SECTION_RADIUS,
	borderEndStartRadius: SECTION_RADIUS,
	gridTemplateAreas: '"name actions"',
	gridTemplateColumns: 'minmax(0, 1fr) auto',
	position: 'static',
	'@container': {
		[PHONE]: {
			borderEndEndRadius: 0,
			borderEndStartRadius: 0,
			gridTemplateAreas: '"name actions"',
			gridTemplateColumns: 'minmax(0, 1fr) auto',
		},
	},
});

/** What acts on the theme on screen, at the header's end. */
export const headActions = style({
	gridArea: 'actions',
});

export const inspection = style({
	borderBlockStart: `${vars.borderWidth.thin} solid ${vars.color.border.decorative}`,
	gridArea: 'inspection',
	marginBlockStart: vars.space['4'],
	paddingBlockStart: vars.space['4'],
	paddingInline: vars.space['4'],
});

export const name = style({
	font: 'inherit',
	gridArea: 'name',
	margin: 0,
	minInlineSize: 0,
});

/** Layout on top of a low small Button recipe. */
export const nameButton = style({
	boxSizing: 'border-box',
	justifyContent: 'flex-start',
	maxInlineSize: '100%',
	textAlign: 'start',
	'@container': { [PHONE]: touchTargetHeight },
});

export const chevron = style({
	color: vars.color.foreground.secondary,
	transition: 'rotate 150ms ease-out',
	selectors: {
		[`${nameButton}[aria-expanded="false"] &`]: {
			rotate: '-90deg',
		},
	},
	...noTransitionWhenReduced,
});

export const tabsFade = style({
	gridArea: 'tabs',
	minInlineSize: 0,
	position: 'relative',
	scrollbarWidth: 'none',
});

export const tabList = style({
	display: 'flex',
	gap: vars.space['8'],
	inlineSize: 'max-content',
	position: 'relative',
	'@container': {
		[PHONE]: {
			// Every theme and its viewed mark stays on screen: tabs wrap instead of scrolling away.
			flexWrap: 'wrap',
			inlineSize: 'auto',
			marginInline: vars.space['4'],
			paddingBlock: `0 ${vars.space['4']}`,
		},
	},
});

/** Layout on top of a small Button recipe: standard when selected, low otherwise. */
export const tab = style({
	flexShrink: 0,
	selectors: {
		// Unviewed tabs read as the work left: full ink. Viewed tabs step back.
		'&[data-state="seen"]:not([data-selected], [data-hovered], [data-pressed])': {
			color: vars.color.foreground.secondary,
		},
	},
	'@container': {
		[PHONE]: touchTargetHeight,
	},
});

const panelIn = keyframes({
	from: { opacity: 0, translate: '0 -8px' },
});

/** The capture eases in as its example opens. */
export const disclosurePanel = style({
	animation: `${panelIn} 200ms ease-out`,
	'@media': { '(prefers-reduced-motion: reduce)': { animation: 'none' } },
});

export const panel = style({
	// Swapping a theme replaces the panel. Keep scroll anchoring from jumping the page.
	overflowAnchor: 'none',
});

/* ------------------------------------------------------------------- stage */

export const stage = style({
	color: vars.color.foreground.primary,
	// The band above the capture holds the label of an image that is not Actual.
	paddingBlock: `${vars.space[STAGE_PADDING.blockStart]} ${vars.space[STAGE_PADDING.blockEnd]}`,
	paddingInline: vars.space[STAGE_PADDING.inline],
	position: 'relative',
	'@container': {
		[PHONE]: {
			paddingBlockEnd: 0,
			paddingInline: 0,
		},
	},
});

/** Names any image that is not Actual, over the stage's corner. */
export const chip = style({
	background: vars.color.background.surface.raised,
	borderRadius: vars.radius.detail,
	color: vars.color.foreground.primary,
	fontWeight: vars.font.weight.heading,
	insetBlockStart: vars.space['4'],
	insetInlineStart: vars.space['24'],
	paddingBlock: '2px',
	paddingInline: vars.space['8'],
	pointerEvents: 'none',
	position: 'absolute',
	zIndex: 2,
	'@container': {
		// The capture runs edge to edge on a phone, so the label sits over its corner.
		[PHONE]: {
			insetBlockStart: vars.space['8'],
			insetInlineStart: vars.space['8'],
		},
	},
});

export const scroller = style({
	outlineOffset: '2px',
	overflowX: 'auto',
	overflowY: 'hidden',
	position: 'relative',
	scrollbarWidth: 'thin',
	touchAction: 'pan-x pan-y pinch-zoom',
});

/** A capture bigger than the stage pans by dragging. */
export const scrollerGrab = style({ cursor: 'grab' });

export const scrollerGrabbing = style({ cursor: 'grabbing', userSelect: 'none' });

export const comparison = style({
	inlineSize: 'max-content',
	marginInline: 'auto',
});

/** Compare: Expected under Actual in one cell, with the divider over both. */
export const compareStack = style({
	display: 'grid',
	position: 'relative',
});

export const compareLayer = style({
	gridArea: '1 / 1',
});

/** Behind Actual in Compare: the stage's own tone, so space neither image fills reads as empty. */
export const compareBlank = style({
	background: appVars.stage,
	inset: 0,
	position: 'absolute',
});

export const imageOverBlank = style({
	position: 'relative',
});

/** Compare's labels, in the band above the capture, at its two corners. */
export const compareLabels = style({
	boxSizing: 'border-box',
	display: 'flex',
	insetBlockStart: vars.space['4'],
	insetInlineStart: '50%',
	justifyContent: 'space-between',
	pointerEvents: 'none',
	position: 'absolute',
	translate: '-50% 0',
	zIndex: 2,
	'@container': {
		[PHONE]: {
			paddingInline: vars.space['8'],
		},
	},
});

export const compareChip = style({
	position: 'static',
});

/** The divider uses the full frame for its range. Only its thumb receives pointer input. */
export const divider = style({
	cursor: 'ew-resize',
	insetBlockStart: vars.space[STAGE_PADDING.blockStart],
	left: '50%',
	pointerEvents: 'none',
	position: 'absolute',
	translate: '-50% 0',
	zIndex: 2,
});

export const dividerTrack = style({
	blockSize: '100%',
	inlineSize: '100%',
	position: 'relative',
});

/** The divider itself: a hairline with a slim grip, styled like the docs examples' resize handle. */
export const dividerThumb = style({
	background: vars.color.border.decorative,
	blockSize: '100%',
	inlineSize: '1px',
	// React Aria places the thumb at the value and centres it on that point, both ways.
	insetBlockStart: '50%',
	outline: 'none',
});

/** Half the grip's height. Stage centres it with the same value. */
export const HANDLE_HALF_PX = 30;
const HANDLE_HALF = `${HANDLE_HALF_PX}px`;

/** The grip is 12px wide to see, with a wider invisible edge so it stays easy to grab. */
export const dividerHandle = style({
	alignItems: 'center',
	background: vars.color.background.surface.base,
	border: `${vars.borderWidth.thin} solid ${vars.color.border.decorative}`,
	borderRadius: vars.radius.full,
	boxShadow: vars.shadow.resting,
	boxSizing: 'border-box',
	blockSize: `calc(2 * ${HANDLE_HALF})`,
	color: vars.color.foreground.secondary,
	display: 'flex',
	inlineSize: '0.75rem',
	// Stage sets where it starts, the middle of the capture on screen. A tall capture then holds it
	// at the middle of the screen as it scrolls.
	insetBlockStart: `calc(50dvh - ${HANDLE_HALF})`,
	justifyContent: 'center',
	pointerEvents: 'auto',
	position: 'sticky',
	touchAction: 'none',
	transitionDuration: vars.motion.feedback.duration,
	transitionProperty: 'border-color, box-shadow',
	transitionTimingFunction: vars.motion.feedback.easing,
	translate: 'calc(-50% + 0.5px) 0',
	'::before': {
		content: '""',
		inset: `0 -${vars.space['8']}`,
		position: 'absolute',
	},
	...noTransitionWhenReduced,
	selectors: {
		[`${dividerThumb}[data-hovered] &`]: {
			borderColor: `color-mix(in oklab, ${vars.color.foreground.secondary} 80%, transparent)`,
		},
		[`${dividerThumb}[data-dragging] &`]: {
			borderColor: vars.color.foreground.secondary,
		},
		[`${dividerThumb}[data-focus-visible] &`]: focusRing('2px'),
	},
});

export const dividerGrip = style({
	blockSize: '100%',
	inlineSize: '100%',
	pointerEvents: 'none',
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

/**
 * A difference's marker: a white line inside a magenta stroke, inside a dark line, so it stands out
 * on light and dark captures alike.
 */
export const region = style({
	borderRadius: '2px',
	boxShadow: `inset 0 0 0 1px oklch(1 0 0 / 0.85), 0 0 0 1px ${appVars.difference}, 0 0 0 2px oklch(0.15 0 0 / 0.55)`,
	pointerEvents: 'none',
	position: 'absolute',
	transition: 'opacity 120ms ease-out',
	...noTransitionWhenReduced,
});

/** While a difference is stepped to, the others step back. */
export const regionMuted = style({
	opacity: 0.4,
});

export const regionActive = style({
	boxShadow: `inset 0 0 0 1px oklch(1 0 0 / 0.85), 0 0 0 3px ${appVars.difference}, 0 0 0 4px oklch(0.15 0 0 / 0.55)`,
	zIndex: 1,
});

/** The active difference's number, matching the stepper's "2 of 6". */
export const regionBadge = style({
	alignItems: 'center',
	background: appVars.difference,
	borderRadius: '3px',
	boxShadow: '0 0 0 1px oklch(0.15 0 0 / 0.55)',
	boxSizing: 'border-box',
	color: 'oklch(1 0 0)',
	display: 'flex',
	font: `${vars.font.weight.emphasis} 12px/1 ${vars.font.family.body}`,
	fontVariantNumeric: 'tabular-nums',
	insetBlockEnd: 'calc(100% + 5px)',
	insetInlineStart: '-3px',
	justifyContent: 'center',
	minBlockSize: '18px',
	minInlineSize: '18px',
	paddingInline: '4px',
	position: 'absolute',
});

/** Near the top of the capture, the badge sits beside the marker, so the frame never clips it. */
export const regionBadgeAfter = style({
	insetBlockEnd: 'auto',
	insetBlockStart: '-3px',
	insetInlineStart: 'calc(100% + 6px)',
});

/** With no room above or beside, the badge sits inside the marker's corner. */
export const regionBadgeInside = style({
	insetBlockEnd: 'auto',
	insetBlockStart: '2px',
	insetInlineStart: '2px',
});
