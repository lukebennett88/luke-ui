import { vars } from '@luke-ui/react/theme';
import { style } from '@vanilla-extract/css';
import { overlayMotion } from '../lib/overlay-motion.js';

/** Underlines the type name so it reads as interactive without a link's pointer cursor. */
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
			// The popover opens below its trigger, so it settles down from just above.
			...overlayMotion({
				hidden: { opacity: 0, translate: '0 -4px' },
				properties: ['opacity', 'translate'],
				rule: {
					backgroundColor: vars.color.surface.overlay,
					border: `1px solid ${vars.color.border.decorative}`,
					borderRadius: vars.radius.surface,
					boxShadow: vars.depth.floating,
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

/** The dialog takes focus when it opens. The popover surface already shows where focus went. */
export const dialog = style({
	'@layer': {
		components: {
			outline: 'none',
		},
	},
});

/**
 * Keeps the declaration's own line breaks and indentation. Source indents with tabs, which default to
 * eight columns and would take most of a phone's width.
 */
export const definition = style({
	'@layer': {
		components: {
			fontFamily: vars.font.family.code,
			overflowWrap: 'anywhere',
			tabSize: 2,
			whiteSpace: 'pre-wrap',
		},
	},
});
