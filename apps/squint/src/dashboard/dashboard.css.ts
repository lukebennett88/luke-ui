import { breakpoints, vars } from '@luke-ui/react/theme';
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
