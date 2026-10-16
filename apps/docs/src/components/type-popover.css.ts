import { vars } from '@luke-ui/react/theme';
import { globalStyle, style } from '@vanilla-extract/css';
import { overlayMotion } from '../lib/overlay-motion.js';

/** Inline trigger that looks like code but is a focusable disclosure control. */
export const trigger = style({
	'@layer': {
		components: {
			backgroundColor: 'transparent',
			borderStyle: 'none',
			color: vars.color.foreground.accent.rest,
			cursor: 'pointer',
			font: 'inherit',
			padding: 0,
			textDecorationLine: 'underline',
			textDecorationStyle: 'dotted',
			textUnderlineOffset: '0.2em',
			selectors: {
				'&:hover': {
					color: vars.color.foreground.accent.hover,
					textDecorationStyle: 'solid',
				},
				'&:focus-visible': {
					borderRadius: vars.radius.control,
					outline: `2px solid ${vars.color.border.focus}`,
					outlineOffset: '2px',
				},
			},
		},
	},
});

export const popover = style({
	'@layer': {
		components: {
			...overlayMotion({
				hidden: { opacity: 0, translate: '0 -4px' },
				properties: ['opacity', 'translate'],
				rule: {
					backgroundColor: vars.color.surface.overlay,
					border: `1px solid ${vars.color.border.decorative}`,
					borderRadius: vars.radius.surface,
					boxShadow: vars.depth.floating,
					boxSizing: 'border-box',
					maxInlineSize: 'min(36rem, calc(100vw - 2rem))',
					maxBlockSize: 'min(24rem, calc(100vh - 4rem))',
					overflow: 'auto',
					padding: vars.space.sp12,
					translate: 'none',
					zIndex: 50,
				},
			}),
		},
	},
});

export const dialog = style({
	'@layer': {
		components: {
			outline: 'none',
		},
	},
});

export const definition = style({
	'@layer': {
		components: {
			color: vars.color.text.primary,
			fontFamily: vars.font.family.code,
			fontSize: vars.font.caption.fontSize,
			lineHeight: vars.font.caption.lineHeight,
			margin: 0,
			overflowWrap: 'anywhere',
			whiteSpace: 'pre-wrap',
		},
	},
});

export const loadError = style({
	'@layer': {
		components: {
			display: 'flex',
			flexDirection: 'column',
			gap: vars.space.sp8,
		},
	},
});

export const loadErrorMessage = style({
	'@layer': {
		components: {
			color: vars.color.text.secondary,
			fontFamily: vars.font.family.body,
			fontSize: vars.font.caption.fontSize,
			lineHeight: vars.font.caption.lineHeight,
			margin: 0,
		},
	},
});

export const retry = style({
	'@layer': {
		components: {
			alignSelf: 'start',
			backgroundColor: vars.color.background.neutral.subtle.rest,
			borderRadius: vars.radius.control,
			borderStyle: 'none',
			color: vars.color.text.primary,
			cursor: 'pointer',
			fontFamily: vars.font.family.body,
			fontSize: vars.font.caption.fontSize,
			lineHeight: vars.font.caption.lineHeight,
			paddingBlock: vars.space.sp4,
			paddingInline: vars.space.sp8,
			selectors: {
				'&:hover': {
					backgroundColor: vars.color.background.neutral.subtle.hover,
				},
				'&:focus-visible': {
					outline: `2px solid ${vars.color.border.focus}`,
					outlineOffset: '2px',
				},
			},
		},
	},
});

globalStyle(`${definition} code`, {
	'@layer': {
		components: {
			font: 'inherit',
		},
	},
});
