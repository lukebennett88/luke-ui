import { vars } from '@luke-ui/react/theme';
import { createVar, keyframes, style } from '@vanilla-extract/css';
import { REDUCED_MOTION } from '../styles/style-rules.js';

const fadeIn = keyframes({ from: { opacity: 0 } });
const rise = keyframes({ from: { opacity: 0, translate: '0 24px' } });
const drawerOffset = createVar();
const easeOut = 'cubic-bezier(0.16, 1, 0.3, 1)';

/* --------------------------------------------------------------- popovers */

export const popover = style({
	background: vars.color.background.surface.raised,
	borderRadius: vars.radius.surface,
	boxShadow: vars.shadow.floating,
	boxSizing: 'border-box',
	color: vars.color.foreground.primary,
	fontFamily: vars.font.label.fontFamily,
	fontSize: vars.font.label.fontSize,
	lineHeight: vars.font.label.lineHeight,
	maxBlockSize: 'calc(100dvh - 80px)',
	outline: 'none',
	overflow: 'auto',
	selectors: {
		'&[data-entering]': {
			animation: `${fadeIn} 140ms ${easeOut}`,
		},
	},
	'@media': {
		[REDUCED_MOTION]: {
			selectors: {
				'&[data-entering]': { animation: 'none' },
			},
		},
	},
});

export const reviewPopover = style({
	inlineSize: '380px',
});

export const shortcutsPopover = style({
	inlineSize: '300px',
});

export const dialog = style({
	blockSize: '100%',
	outline: 'none',
});

export const dialogBody = style({
	padding: vars.space['16'],
});

export const dialogTitle = style({
	fontSize: vars.font.body.fontSize,
	fontWeight: vars.font.weight.heading,
	lineHeight: vars.font.body.lineHeight,
	margin: 0,
});

/* ----------------------------------------------------------------- sheets */

export const modalOverlay = style({
	alignItems: 'flex-end',
	background: vars.color.background.backdrop,
	display: 'flex',
	inset: 0,
	justifyContent: 'center',
	position: 'fixed',
	zIndex: 60,
	selectors: {
		'&[data-entering]': {
			animation: `${fadeIn} 160ms ease-out`,
		},
	},
	'@media': {
		[REDUCED_MOTION]: {
			selectors: {
				'&[data-entering]': { animation: 'none' },
			},
		},
	},
});

export const drawerOverlay = style({
	backgroundColor: vars.color.background.backdrop,
	inset: 0,
	position: 'fixed',
	transition: `background-color ${vars.motion.enter.duration} ${vars.motion.enter.easing}`,
	zIndex: 60,
	selectors: {
		'&[data-entering], &[data-exiting]': { backgroundColor: 'transparent' },
		'&[data-exiting]': {
			pointerEvents: 'none',
			transition: `background-color ${vars.motion.exit.duration} ${vars.motion.exit.easing}`,
		},
	},
});

/** A phone sheet that rises from the bottom. */
export const sheet = style({
	background: vars.color.background.surface.raised,
	borderStartEndRadius: vars.radius.overlay,
	borderStartStartRadius: vars.radius.overlay,
	boxShadow: vars.shadow.overlay,
	fontFamily: vars.font.label.fontFamily,
	fontSize: vars.font.label.fontSize,
	inlineSize: '100%',
	lineHeight: vars.font.label.lineHeight,
	maxBlockSize: '88dvh',
	outline: 'none',
	overflow: 'auto',
	paddingBlockEnd: 'env(safe-area-inset-bottom)',
	selectors: {
		'&[data-entering]': {
			animation: `${rise} 220ms ${easeOut}`,
		},
	},
	'@media': {
		[REDUCED_MOTION]: {
			selectors: {
				'&[data-entering]': { animation: `${fadeIn} 160ms ease-out` },
			},
		},
	},
});

export const sheetFull = style({
	blockSize: '100dvh',
	borderRadius: 0,
	maxBlockSize: 'none',
});

export const sheetHead = style({
	marginBlock: '-6px -4px',
	marginInlineEnd: '-8px',
});

export const drawer = style({
	blockSize: '100%',
	boxShadow: vars.shadow.overlay,
	fontFamily: vars.font.label.fontFamily,
	fontSize: vars.font.label.fontSize,
	inlineSize: 'min(22rem, 90vw)',
	lineHeight: vars.font.label.lineHeight,
	marginInlineStart: 'auto',
	outline: 'none',
	position: 'relative',
	transition: `translate ${vars.motion.enter.duration} ${vars.motion.enter.easing}`,
	translate: 'none',
	vars: { [drawerOffset]: '100%' },
	selectors: {
		'&:dir(rtl)': { vars: { [drawerOffset]: '-100%' } },
		'&[data-entering], &[data-exiting]': { translate: `${drawerOffset} 0` },
		'&[data-exiting]': {
			transition: `translate ${vars.motion.exit.duration} ${vars.motion.exit.easing}`,
		},
	},
	'@media': {
		[REDUCED_MOTION]: {
			transition: 'none',
			selectors: { '&[data-entering], &[data-exiting]': { translate: 'none', transition: 'none' } },
		},
	},
});
