import { breakpoints, vars } from '@luke-ui/react/theme';
import { createVar, globalStyle, keyframes, style } from '@vanilla-extract/css';
import { plainButton } from './review.css.js';

const fadeIn = keyframes({ from: { opacity: 0 } });
const rise = keyframes({ from: { opacity: 0, translate: '0 24px' } });
const drawerOffset = createVar();
const easeOut = 'cubic-bezier(0.16, 1, 0.3, 1)';
const reducedMotion = '(prefers-reduced-motion: reduce)';

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
		[reducedMotion]: {
			selectors: {
				'&[data-entering]': { animation: 'none' },
			},
		},
	},
});

export const viewPopover = style({
	inlineSize: '300px',
});

export const reviewPopover = style({
	inlineSize: '380px',
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
		[reducedMotion]: {
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
		[reducedMotion]: {
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
		[reducedMotion]: {
			transition: 'none',
			selectors: { '&[data-entering], &[data-exiting]': { translate: 'none', transition: 'none' } },
		},
	},
});

/* ------------------------------------------------------------------- menu */

export const menu = style({
	minInlineSize: '15rem',
	outline: 'none',
	padding: vars.space['4'],
});

export const menuItem = style({
	alignItems: 'center',
	display: 'flex',
	minBlockSize: '36px',
	outline: 'none',
	paddingInline: '10px',
	selectors: {
		'&[data-focused]': {
			background: vars.interaction.tint.hover,
		},
		'&[data-disabled]': {
			color: vars.color.foreground.disabled,
		},
	},
});

/* ----------------------------------------------------------- view options */

export const options = style({});

// Each choice is a 44px touch target on a phone.
globalStyle(`${options} label`, {
	'@container': {
		[`(inline-size < ${breakpoints.bp768}px)`]: {
			alignItems: 'center',
			minBlockSize: '44px',
		},
	},
});

export const optionLabel = style({
	alignItems: 'center',
	display: 'inline-flex',
	gap: vars.space['8'],
	inlineSize: '100%',
	justifyContent: 'space-between',
});

/** A row of mutually exclusive choices that take effect at once. */
export const segmented = style({
	display: 'flex',
	gap: '2px',
	inlineSize: 'max-content',
	padding: '2px',
});

export const segmentedFill = style({
	display: 'grid',
	gridTemplateColumns: 'repeat(3, 1fr)',
	inlineSize: 'auto',
});

export const segment = style({
	alignItems: 'center',
	appearance: 'none',
	background: 'none',
	border: 0,
	color: vars.color.foreground.secondary,
	display: 'inline-flex',
	font: 'inherit',
	fontVariantNumeric: 'tabular-nums',
	gap: vars.space['8'],
	justifyContent: 'center',
	minBlockSize: '32px',
	minInlineSize: '44px',
	outline: 'none',
	paddingInline: '10px',
	selectors: {
		'&[data-hovered]': {
			background: vars.interaction.tint.hover,
			color: vars.color.foreground.primary,
		},
		'&[data-selected], &[data-pressed]': {
			background: vars.interaction.tint.pressed,
			color: vars.color.foreground.primary,
		},
		'&[data-focus-visible]': {
			outline: `2px solid ${vars.color.focus}`,
			outlineOffset: '-3px',
		},
	},
	'@container': {
		[`(inline-size < ${breakpoints.bp768}px)`]: {
			minBlockSize: '44px',
		},
	},
});

export const slider = style({
	alignItems: 'center',
	display: 'grid',
	gap: `${vars.space['4']} ${vars.space['12']}`,
	gridTemplateColumns: '1fr auto',
});

export const sliderLabel = style({
	color: vars.color.foreground.secondary,
});

export const sliderTrack = style({
	blockSize: '28px',
	gridColumn: '1 / -1',
	position: 'relative',
	selectors: {
		'&::before': {
			background: vars.color.border.decorative,
			blockSize: '4px',
			borderRadius: '2px',
			content: '""',
			insetBlockStart: '50%',
			insetInline: 0,
			position: 'absolute',
			translate: '0 -50%',
		},
	},
	'@container': {
		[`(inline-size < ${breakpoints.bp768}px)`]: {
			blockSize: '44px',
		},
	},
});

export const sliderThumb = style({
	background: vars.color.background.accent.solid.rest,
	blockSize: '18px',
	borderRadius: vars.radius.full,
	boxShadow: `0 0 0 3px ${vars.color.background.surface.raised}`,
	inlineSize: '18px',
	insetBlockStart: '50%',
	selectors: {
		'&[data-focus-visible]': {
			outline: `2px solid ${vars.color.focus}`,
			outlineOffset: '3px',
		},
	},
});

export const details = style({
	color: vars.color.foreground.secondary,
	fontVariantNumeric: 'tabular-nums',
	margin: 0,
});

export const shortcutsTrigger = style([
	plainButton,
	{
		alignItems: 'center',
		color: vars.color.foreground.secondary,
		display: 'inline-flex',
		gap: '6px',
		justifySelf: 'start',
		marginInline: '-4px',
		minBlockSize: '32px',
		paddingInline: vars.space['4'],
	},
]);

export const shortcutsChevron = style({
	transition: 'rotate 150ms ease-out',
	selectors: {
		[`${shortcutsTrigger}[aria-expanded="true"] &`]: {
			rotate: '180deg',
		},
	},
	'@media': {
		[reducedMotion]: { transition: 'none' },
	},
});

export const shortcutList = style({
	alignItems: 'baseline',
	display: 'grid',
	gap: `${vars.space['8']} ${vars.space['12']}`,
	gridTemplateColumns: 'auto 1fr',
	margin: 0,
});

export const shortcutKeys = style({
	textAlign: 'end',
});

export const shortcutLabel = style({
	color: vars.color.foreground.secondary,
	margin: 0,
});
