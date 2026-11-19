import { vars } from '@luke-ui/react/theme';
import { style } from '@vanilla-extract/css';
import { appVars } from '../styles/app-tokens.css.js';
import { compactQuery } from '../styles/queries.js';
import { plainButton } from './review.css.js';

/** Beside the captures on wide screens; inside a drawer or sheet elsewhere. */
export const contents = style({
	background: vars.color.background.surface.subdued,
	blockSize: `calc(100dvh - ${appVars.topBarHeight})`,
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	insetBlockStart: appVars.topBarHeight,
	position: 'sticky',
});

export const contentsInOverlay = style({
	blockSize: '100%',
	position: 'static',
	'@container': {
		[compactQuery]: {
			background: vars.color.background.surface.raised,
		},
	},
});

export const head = style({
	alignItems: 'flex-start',
	display: 'flex',
	gap: vars.space['8'],
	justifyContent: 'space-between',
	paddingBlock: `${vars.space['12']} 0`,
	paddingInline: `${vars.space['16']} ${vars.space['8']}`,
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

export const filters = style({
	display: 'grid',
	gap: vars.space['8'],
	paddingBlock: `${vars.space['8']} ${vars.space['12']}`,
	paddingInline: vars.space['16'],
});

export const filterRow = style({
	alignItems: 'center',
	display: 'flex',
	gap: vars.space['12'],
	justifyContent: 'space-between',
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
		alignItems: 'center',
		boxSizing: 'border-box',
		color: vars.color.foreground.primary,
		display: 'flex',
		gap: vars.space['8'],
		inlineSize: '100%',
		minBlockSize: '32px',
		paddingInline: vars.space['8'],
		selectors: {
			'&[aria-current="true"]': {
				background: vars.interaction.tint.pressed,
			},
		},
		'@container': {
			[compactQuery]: {
				minBlockSize: '44px',
			},
		},
	},
]);

export const itemState = style({
	alignItems: 'center',
	color: vars.color.foreground.secondary,
	display: 'inline-flex',
	gap: '6px',
	marginInlineStart: 'auto',
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
