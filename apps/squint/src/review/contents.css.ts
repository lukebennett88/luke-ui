import { vars } from '@luke-ui/react/theme';
import { style } from '@vanilla-extract/css';
import { appVars } from '../styles/app-tokens.css.js';
import { PHONE, touchTargetHeight } from '../styles/style-rules.js';

/** Beside the captures on wide screens and inside the drawer elsewhere. The whole column scrolls. */
export const sidebar = style({
	blockSize: `calc(100dvh - ${appVars.topBarHeight})`,
	boxSizing: 'border-box',
	overflowY: 'auto',
	overscrollBehavior: 'contain',
	scrollbarWidth: 'thin',
});

export const sidebarInOverlay = style({
	blockSize: '100%',
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

/** Layout on top of a small Button recipe: standard for the current example, low otherwise. */
export const item = style({
	boxSizing: 'border-box',
	display: 'flex',
	inlineSize: '100%',
	justifyContent: 'flex-start',
	textAlign: 'start',
	'@container': { [PHONE]: touchTargetHeight },
});

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
