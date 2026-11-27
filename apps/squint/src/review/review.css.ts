import { breakpoints, vars } from '@luke-ui/react/theme';
import { createVar, keyframes, style } from '@vanilla-extract/css';
import { appVars } from '../styles/app-tokens.css.js';
import {
	MAIN_PADDING,
	MAIN_RADIUS,
	noTransitionWhenReduced,
	PHONE,
	REDUCED_MOTION,
	touchTargetSize,
} from '../styles/style-rules.js';

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

/* ----------------------------------------------------------------- top bar */

export const reportTitle = style({ maxInlineSize: '32ch' });

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
	gap: vars.space['8'],
});

/** Wide enough for `9 of 12`, so the arrows stay put as the position changes. */
export const differencesPosition = style({
	minInlineSize: '6ch',
	textAlign: 'center',
	whiteSpace: 'nowrap',
});

/** Wide enough for `9/12`, so the phone's arrows stay put as the position changes. */
export const differencesPositionCompact = style({
	minInlineSize: '4ch',
	textAlign: 'center',
	whiteSpace: 'nowrap',
});

/** Wide enough for `Fit width`, so the zoom steps stay put as the level changes. */
export const zoomLevel = style({
	fontVariantNumeric: 'tabular-nums',
	minInlineSize: '9ch',
});

/** Touch targets on phones. */
export const touchTarget = style({
	'@container': { [PHONE]: touchTargetSize },
});

/* ------------------------------------------------------------------ layout */

const sidebarMotion = '300ms ease-in-out';
const sidebarWidth = '300px';
const sidebarOffset = createVar();

const WIDE = `(inline-size >= ${breakpoints.bp1280}px)`;

/** One column, or on wide screens with Contents, a sidebar column beside the comparisons. */
export const layout = style({
	display: 'grid',
	gridTemplateColumns: 'minmax(0, 1fr)',
	minBlockSize: `calc(100dvh - ${appVars.topBarHeight})`,
	'@container': {
		[WIDE]: {
			selectors: {
				'&[data-has-sidebar]': {
					gridTemplateColumns: `${vars.space['24']} minmax(0, 1fr)`,
					transition: `grid-template-columns ${sidebarMotion}`,
				},
				'&[data-has-sidebar][data-contents-open]': {
					gridTemplateColumns: `${sidebarWidth} minmax(0, 1fr)`,
				},
			},
			...noTransitionWhenReduced,
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
		[REDUCED_MOTION]: {
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
	boxSizing: 'border-box',
	gridColumn: 1,
	gridRow: 1,
	minInlineSize: 0,
	overflow: 'clip',
	padding: MAIN_PADDING,
	'@container': {
		[PHONE]: {
			paddingBlock: `0 ${vars.space['16']}`,
			paddingInline: 0,
		},
		[WIDE]: {
			selectors: {
				// Only a sidebar beside it gives the comparisons a corner to round.
				[`${layout}[data-has-sidebar] > &`]: {
					borderEndStartRadius: MAIN_RADIUS,
					borderStartStartRadius: MAIN_RADIUS,
					gridColumn: 2,
				},
			},
		},
	},
});

export const empty = style({
	color: vars.color.foreground.secondary,
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
	insetBlockEnd: `calc(${vars.space['16']} + env(safe-area-inset-bottom))`,
	insetInlineStart: '50%',
	maxInlineSize: `calc(100vw - ${vars.space['32']})`,
	paddingBlock: '6px',
	paddingInline: `${vars.space['16']} 6px`,
	position: 'fixed',
	translate: '-50% 0',
	zIndex: 40,
	'@media': {
		[REDUCED_MOTION]: { animation: 'none' },
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
