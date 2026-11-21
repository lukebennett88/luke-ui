import { vars } from '@luke-ui/react/theme';
import { globalStyle, keyframes, style } from '@vanilla-extract/css';
import { appVars } from '../styles/app-tokens.css.js';
import { belowWideQuery, compactQuery, regularQuery, wideQuery } from '../styles/queries.js';
import { topBar } from '../styles/top-bar.css.js';

/** The review reads at label size: 14px, the smallest size the app uses for anything a reviewer reads. */
export const app = style({
	fontFamily: vars.font.label.fontFamily,
	fontSize: vars.font.label.fontSize,
	lineHeight: vars.font.label.lineHeight,
	minBlockSize: '100dvh',
});

export const numeric = style({
	fontVariantNumeric: 'tabular-nums',
});

export const truncate = style({
	minInlineSize: 0,
	overflow: 'hidden',
	textOverflow: 'ellipsis',
	whiteSpace: 'nowrap',
});

export const secondary = style({
	color: vars.color.foreground.secondary,
});

/** A React Aria button with no chrome of its own, such as a section name or a Contents row. */
export const plainButton = style({
	appearance: 'none',
	background: 'none',
	border: 0,
	color: 'inherit',
	font: 'inherit',
	margin: 0,
	outline: 'none',
	padding: 0,
	textAlign: 'start',
	selectors: {
		'&[data-focus-visible]': {
			outline: `2px solid ${vars.color.focus}`,
			outlineOffset: '-2px',
		},
		'&[data-hovered]': {
			background: vars.interaction.tint.hover,
		},
		'&[data-pressed]': {
			background: vars.interaction.tint.pressed,
		},
	},
});

/* ----------------------------------------------------------------- top bar */

export const reviewTopBar = style([
	topBar,
	{
		display: 'grid',
		gridTemplateColumns: 'auto minmax(0, 1fr) auto',
		'@container': {
			[compactQuery]: {
				gap: vars.space['8'],
				gridTemplateColumns: 'minmax(0, 1fr) auto',
				paddingInline: `${vars.space['4']} ${vars.space['16']}`,
			},
		},
	},
]);

export const topStart = style({
	alignItems: 'center',
	display: 'flex',
	gap: vars.space['12'],
	minInlineSize: 0,
});

export const topEnd = style([topStart, { justifyContent: 'flex-end' }]);

/** The report's title. Below the wide layout it stays in the accessibility tree only. */
export const reportTitle = style([
	truncate,
	{
		color: vars.color.foreground.secondary,
		fontSize: 'inherit',
		fontWeight: vars.font.weight.body,
		lineHeight: 'inherit',
		margin: 0,
		maxInlineSize: '32ch',
		'@container': {
			[belowWideQuery]: {
				blockSize: '1px',
				clipPath: 'inset(50%)',
				inlineSize: '1px',
				position: 'absolute',
			},
		},
	},
]);

/**
 * The capture in view, and what acts on it. The name takes the space left over and truncates; the
 * controls keep their place at the end, so they don't move as names change length while scrolling.
 */
export const guide = style({
	alignItems: 'center',
	columnGap: vars.space['16'],
	display: 'grid',
	gridTemplateColumns: 'minmax(0, 1fr) auto',
	minInlineSize: 0,
});

export const guideControls = style({
	alignItems: 'center',
	display: 'flex',
	gap: vars.space['8'],
});

export const guideWords = style([
	truncate,
	{
		color: vars.color.foreground.secondary,
		margin: 0,
	},
]);

export const guideName = style({
	color: vars.color.foreground.primary,
	fontWeight: vars.font.weight.heading,
});

/** On phones the guide words open Contents. */
export const guideButton = style([
	plainButton,
	{
		alignItems: 'center',
		color: vars.color.foreground.secondary,
		display: 'flex',
		gap: vars.space['8'],
		minBlockSize: '44px',
		minInlineSize: 0,
		paddingInline: '10px',
	},
]);

export const viewedCheckbox = style({
	flexShrink: 0,
	paddingInline: vars.space['4'],
});

export const progress = style([
	numeric,
	{
		alignItems: 'baseline',
		color: vars.color.foreground.secondary,
		display: 'inline-flex',
		gap: vars.space['4'],
		whiteSpace: 'nowrap',
	},
]);

export const status = style({
	alignItems: 'center',
	display: 'inline-flex',
	gap: vars.space['4'],
	whiteSpace: 'nowrap',
});

export const differences = style({
	alignItems: 'center',
	color: vars.color.foreground.secondary,
	display: 'flex',
});

export const differencesPosition = style([
	numeric,
	{
		minInlineSize: '6ch',
		textAlign: 'center',
		whiteSpace: 'nowrap',
	},
]);

export const viewButtonLabel = style({
	display: 'inline-flex',
	gap: '6px',
});

/** Touch targets on phones. */
export const touchTarget = style({
	'@container': {
		[compactQuery]: {
			minBlockSize: '44px',
			minInlineSize: '44px',
		},
	},
});

/* ------------------------------------------------------------------ layout */

export const layout = style({
	display: 'grid',
	gridTemplateColumns: 'minmax(0, 1fr)',
});

export const layoutWithContents = style({
	'@container': {
		[wideQuery]: {
			gridTemplateColumns: '300px minmax(0, 1fr)',
		},
	},
});

export const main = style({
	boxSizing: 'border-box',
	minInlineSize: 0,
	// Room below the last section, so any section can scroll up to the top bar.
	paddingBlock: `${vars.space['16']} calc(50dvh + ${appVars.bottomBarHeight})`,
	paddingInline: vars.space['24'],
	'@container': {
		[compactQuery]: {
			paddingBlock: `0 calc(40dvh + ${appVars.bottomBarHeight})`,
			paddingInline: 0,
		},
	},
});

export const empty = style({
	color: vars.color.foreground.secondary,
	display: 'grid',
	gap: vars.space['12'],
	justifyItems: 'center',
	paddingBlock: vars.space['64'],
	paddingInline: vars.space['24'],
});

/* -------------------------------------------------------------- bottom bar */

/**
 * The phone's controls for the capture in view, in two rows: what to compare above, and what to do
 * about it below.
 */
export const bottomBar = style({
	background: vars.color.background.surface.subdued,
	blockSize: `calc(${appVars.bottomBarHeight} + env(safe-area-inset-bottom))`,
	boxShadow: `0 -${vars.borderWidth.thin} 0 ${vars.color.border.decorative}`,
	boxSizing: 'border-box',
	display: 'grid',
	gridTemplateRows: '44px 1fr',
	insetBlockEnd: 0,
	insetInline: 0,
	paddingBlock: `${vars.space['4']} env(safe-area-inset-bottom)`,
	paddingInline: `${vars.space['8']} ${vars.space['12']}`,
	position: 'fixed',
	zIndex: 36,
	'@container': {
		[regularQuery]: {
			display: 'none',
		},
	},
});

export const bottomCompare = style({
	alignItems: 'center',
	display: 'flex',
	gap: vars.space['8'],
	justifyContent: 'space-between',
	minInlineSize: 0,
});

export const bottomPanes = style({
	flex: '1 1 auto',
	maxInlineSize: '16rem',
});

export const bottomNote = style({
	color: vars.color.foreground.secondary,
	paddingInline: vars.space['4'],
});

export const bottomActions = style({
	alignItems: 'center',
	display: 'flex',
	gap: vars.space['4'],
	justifyContent: 'space-between',
});

export const bottomViewed = style({
	marginInlineEnd: 'auto',
});

globalStyle(`${bottomViewed} label, label${bottomViewed}`, {
	alignItems: 'center',
	minBlockSize: '44px',
});

/* ------------------------------------------------------------------- toast */

const rise = keyframes({
	from: { opacity: 0, translate: '0 24px' },
});

/** The undo offer after marking viewed: transient, bottom centre. */
export const toast = style({
	alignItems: 'center',
	animation: `${rise} 220ms cubic-bezier(0.16, 1, 0.3, 1)`,
	background: vars.color.background.surface.raised,
	borderRadius: vars.radius.surface,
	boxShadow: vars.shadow.floating,
	boxSizing: 'border-box',
	display: 'flex',
	gap: vars.space['12'],
	insetBlockEnd: `calc(${vars.space['16']} + ${appVars.bottomBarHeight} + env(safe-area-inset-bottom))`,
	insetInlineStart: '50%',
	maxInlineSize: `calc(100vw - ${vars.space['32']})`,
	paddingBlock: '6px',
	paddingInline: `${vars.space['16']} 6px`,
	position: 'fixed',
	translate: '-50% 0',
	zIndex: 40,
	'@media': {
		'(prefers-reduced-motion: reduce)': {
			animation: 'none',
		},
	},
});

/* --------------------------------------------------------- message pages */

export const messageTopBar = style([
	topBar,
	{
		display: 'flex',
		justifyContent: 'space-between',
		paddingInline: `${vars.space['16']} ${vars.space['12']}`,
	},
]);

export const message = style({
	boxSizing: 'border-box',
	marginInline: 'auto',
	maxInlineSize: '40rem',
	paddingBlock: vars.space['64'],
	paddingInline: vars.space['16'],
});
