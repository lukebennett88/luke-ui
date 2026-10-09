import { vars } from '@luke-ui/react/theme';
import { style } from '@vanilla-extract/css';

/**
 * Soft bordered surface link. Background states live here (not on Box sprinkles) so hover/pressed
 * are not overridden by the utilities-layer `backgroundColor` class.
 */
export const cardLink = style({
	'@layer': {
		recipes: {
			backgroundColor: vars.color.surface.canvas,
			color: vars.color.text.primary,
			textDecoration: 'none',
			transition: `background-color ${vars.motion.duration.feedback} ${vars.motion.easing.standard}`,
			selectors: {
				'&:hover': {
					// Soften the subtle hover ramp the way Fumadocs used accent/80.
					backgroundColor: vars.color.background.neutral.subtle.hover,
				},
				'&:active': {
					backgroundColor: vars.color.background.neutral.subtle.pressed,
				},
				'&:focus-visible': {
					outline: `2px solid ${vars.color.border.focus}`,
					outlineOffset: '2px',
				},
			},
			'@media': {
				'(prefers-reduced-motion: reduce)': {
					transition: 'none',
				},
			},
		},
	},
});

export const cardLinkAlignEnd = style({
	'@layer': {
		recipes: {
			textAlign: 'end',
		},
	},
});
