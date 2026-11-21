import { breakpoints, vars } from '@luke-ui/react/theme';
import { interactionState } from '@luke-ui/react/utils';
import { style } from '@vanilla-extract/css';
import { appVars } from '../styles/app-tokens.css.js';

export const panel = style({
	borderStartStartRadius: vars.radius.surface,
	marginInlineStart: vars.space['16'],
	minBlockSize: `calc(100dvh - ${appVars.topBarHeight})`,
	'@container': {
		[`(inline-size >= ${breakpoints.bp768}px)`]: { marginInlineStart: vars.space['24'] },
	},
});

export const main = style({
	boxSizing: 'border-box',
	marginInline: 'auto',
	maxInlineSize: '56rem',
});

export const list = style({
	listStyle: 'none',
	margin: 0,
	padding: 0,
});

/** The anchor is the card, so its visual states match the full hit area. */
export const row = style({
	boxSizing: 'border-box',
	gridTemplateColumns: 'minmax(0, 1fr) auto',
	minBlockSize: '64px',
	textDecoration: 'none',
	'@container': {
		[`(inline-size < ${breakpoints.bp768}px)`]: {
			gridTemplateColumns: 'minmax(0, 1fr)',
		},
	},
	selectors: {
		'&[data-hovered]': interactionState('hover'),
		'&[data-pressed]': interactionState('pressed'),
	},
});

export const number = style({
	color: vars.color.foreground.secondary,
	fontVariantNumeric: 'tabular-nums',
	marginInlineEnd: vars.space['4'],
});

/** A status in its role colour, with an icon where the state has one. */
export const status = style({
	alignItems: 'center',
	display: 'inline-flex',
	gap: vars.space['4'],
	whiteSpace: 'nowrap',
});
