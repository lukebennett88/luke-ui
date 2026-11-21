import { breakpoints, vars } from '@luke-ui/react/theme';
import { createVar, globalStyle, keyframes, style } from '@vanilla-extract/css';
import { appVars } from '../styles/app-tokens.css.js';

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
	overflow: 'hidden',
	textOverflow: 'ellipsis',
	whiteSpace: 'nowrap',
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

export const reportTitle = style([truncate, { maxInlineSize: '32ch' }]);

export const viewedCheckbox = style({
	flexShrink: 0,
});

export const progress = style({
	whiteSpace: 'nowrap',
});

export const status = style({
	alignItems: 'center',
	display: 'inline-flex',
	gap: vars.space['4'],
	whiteSpace: 'nowrap',
});

export const differences = style({
	alignItems: 'center',
	display: 'flex',
});

/** Wide enough for `9 of 12`, so the arrows stay put as the position changes. */
export const differencesPosition = style({
	minInlineSize: '6ch',
	textAlign: 'center',
	whiteSpace: 'nowrap',
});

/** Touch targets on phones. */
export const touchTarget = style({
	'@container': {
		[`(inline-size < ${breakpoints.bp768}px)`]: {
			minBlockSize: '44px',
			minInlineSize: '44px',
		},
	},
});

/* ------------------------------------------------------------------ layout */

const sidebarMotion = '300ms ease-in-out';
const sidebarWidth = '300px';
const sidebarOffset = createVar();
const reducedMotion = '(prefers-reduced-motion: reduce)';

export const layout = style({
	display: 'grid',
	gridTemplateColumns: 'minmax(0, 1fr)',
	marginInlineStart: vars.space['16'],
	minBlockSize: `calc(100dvh - ${appVars.topBarHeight})`,
	'@container': {
		[`(inline-size >= ${breakpoints.bp1280}px)`]: {
			gridTemplateColumns: `${vars.space['24']} minmax(0, 1fr)`,
			marginInlineStart: 0,
			transition: `grid-template-columns ${sidebarMotion}`,
			selectors: {
				'&[data-contents-open]': { gridTemplateColumns: `${sidebarWidth} minmax(0, 1fr)` },
			},
			'@media': {
				[reducedMotion]: { transition: 'none' },
			},
		},
	},
});

export const sidebar = style({
	alignSelf: 'start',
	gridColumn: 1,
	gridRow: 1,
	inlineSize: sidebarWidth,
	insetBlockStart: appVars.topBarHeight,
	position: 'sticky',
	transition: `translate ${sidebarMotion}, opacity ${sidebarMotion}, visibility 0s`,
	translate: '0 0',
	vars: { [sidebarOffset]: '-100%' },
	selectors: {
		'&:dir(rtl)': { vars: { [sidebarOffset]: '100%' } },
		'&[inert]': {
			opacity: 0,
			transition: `translate ${sidebarMotion}, opacity ${sidebarMotion}, visibility 0s 300ms`,
			translate: `${sidebarOffset} 0`,
			visibility: 'hidden',
		},
	},
	'@media': {
		[reducedMotion]: {
			transition: 'opacity 100ms ease-in-out, visibility 0s',
			selectors: {
				'&[inert]': {
					transition: 'opacity 100ms ease-in-out, visibility 0s 100ms',
					translate: 'none',
				},
			},
		},
	},
});

export const main = style({
	borderStartEndRadius: vars.radius.surface,
	borderStartStartRadius: vars.radius.surface,
	boxSizing: 'border-box',
	gridColumn: 1,
	gridRow: 1,
	minInlineSize: 0,
	overflow: 'clip',
	// Room below the last section, so any section can scroll up to the top bar.
	paddingBlock: `${vars.space['16']} calc(50dvh + ${appVars.bottomBarHeight})`,
	paddingInline: vars.space['24'],
	'@container': {
		[`(inline-size < ${breakpoints.bp768}px)`]: {
			paddingBlock: `0 calc(40dvh + ${appVars.bottomBarHeight})`,
			paddingInline: 0,
		},
		[`(inline-size >= ${breakpoints.bp1280}px)`]: {
			borderEndStartRadius: vars.radius.surface,
			borderStartEndRadius: 0,
			gridColumn: 2,
		},
	},
});

export const empty = style({
	color: vars.color.foreground.secondary,
});

/* -------------------------------------------------------------- bottom bar */

/**
 * The phone's controls for the capture in view, in two rows: what to compare above, and what to do
 * about it below.
 */
export const bottomBar = style({
	blockSize: `calc(${appVars.bottomBarHeight} + env(safe-area-inset-bottom))`,
	boxShadow: `0 -${vars.borderWidth.thin} 0 ${vars.color.border.decorative}`,
	boxSizing: 'border-box',
	display: 'grid',
	gridTemplateRows: '44px 44px',
	insetBlockEnd: 0,
	insetInline: 0,
	paddingBlock: `${vars.space['8']} calc(${vars.space['8']} + env(safe-area-inset-bottom))`,
	position: 'fixed',
	zIndex: 36,
	'@container': {
		[`(inline-size >= ${breakpoints.bp768}px)`]: {
			display: 'none',
		},
	},
});

export const bottomCompare = style({
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
	animation: `${rise} 220ms cubic-bezier(0.16, 1, 0.3, 1)`,
	background: vars.color.background.surface.raised,
	borderRadius: vars.radius.surface,
	boxShadow: vars.shadow.floating,
	boxSizing: 'border-box',
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

export const messagePanel = style({
	borderStartStartRadius: vars.radius.surface,
	marginInlineStart: vars.space['16'],
	minBlockSize: `calc(100dvh - ${appVars.topBarHeight})`,
	'@container': {
		[`(inline-size >= ${breakpoints.bp768}px)`]: { marginInlineStart: vars.space['24'] },
	},
});

export const message = style({
	boxSizing: 'border-box',
	marginInline: 'auto',
	maxInlineSize: '40rem',
	paddingBlock: vars.space['64'],
	paddingInline: vars.space['16'],
});
