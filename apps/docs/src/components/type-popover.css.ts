import { vars } from '@luke-ui/react/theme';
import { style } from '@vanilla-extract/css';
import { overlayMotion } from '../lib/overlay-motion.js';

/** Inline disclosure trigger that reads like linked code. */
export const trigger = style({
	'@layer': {
		components: {
			textDecorationLine: 'underline',
			textDecorationStyle: 'dotted',
			textUnderlineOffset: '0.2em',
			selectors: {
				'&:hover': {
					textDecorationStyle: 'solid',
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

/** Multi-line declaration text; Code is single-line by default. */
export const definition = style({
	'@layer': {
		components: {
			fontFamily: vars.font.family.code,
			margin: 0,
			overflowWrap: 'anywhere',
			whiteSpace: 'pre-wrap',
		},
	},
});
