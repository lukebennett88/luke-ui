import { breakpoints, vars } from '@luke-ui/react/theme';
import { style } from '@vanilla-extract/css';
import { appVars } from '../styles/app-tokens.css.js';
import { plainButton } from './review.css.js';

/** Beside the captures on wide screens and inside the drawer elsewhere. */
export const contents = style({
	blockSize: `calc(100dvh - ${appVars.topBarHeight})`,
	boxSizing: 'border-box',
});

export const contentsInOverlay = style({
	blockSize: '100%',
});

export const title = style({
	fontSize: 'inherit',
	fontWeight: vars.font.weight.heading,
	lineHeight: 'inherit',
	margin: 0,
});

export const summary = style({
	color: vars.color.foreground.secondary,
	margin: 0,
});

export const filterGrow = style({
	flex: '1 1 auto',
	minInlineSize: 0,
});

export const pushEnd = style({
	marginInlineStart: 'auto',
});

export const list = style({
	flex: '1 1 auto',
	overflowY: 'auto',
	overscrollBehavior: 'contain',
	paddingBlock: `${vars.space['4']} ${vars.space['24']}`,
	paddingInline: vars.space['8'],
	// Contains the visually hidden text in each row, which would otherwise widen the page.
	position: 'relative',
	scrollbarWidth: 'thin',
});

export const group = style({
	listStyle: 'none',
	margin: `0 0 ${vars.space['8']}`,
	padding: 0,
});

export const groupHeading = style({
	color: vars.color.foreground.secondary,
	fontWeight: vars.font.weight.heading,
	paddingBlock: `${vars.space['12']} ${vars.space['4']}`,
	paddingInline: vars.space['8'],
});

export const item = style([
	plainButton,
	{
		boxSizing: 'border-box',
		color: vars.color.foreground.primary,
		inlineSize: '100%',
		minBlockSize: '32px',
		paddingInline: vars.space['8'],
		selectors: {
			'&[aria-current="true"]': {
				background: vars.interaction.tint.pressed,
			},
		},
		'@container': {
			[`(inline-size < ${breakpoints.bp768}px)`]: {
				minBlockSize: '44px',
			},
		},
	},
]);

export const itemState = style({
	color: vars.color.foreground.secondary,
	gap: '6px',
});

/** Marks a capture that changed since the reviewer viewed it. Paired with text for assistive tech. */
export const changedDot = style({
	background: vars.color.foreground.warning.rest,
	blockSize: '6px',
	borderRadius: vars.radius.full,
	flexShrink: 0,
	inlineSize: '6px',
});

export const foot = style({
	paddingBlock: '10px',
	paddingInline: vars.space['16'],
});
