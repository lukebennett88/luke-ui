import { vars } from '@luke-ui/react/theme';
import { interactionState } from '@luke-ui/react/utils';
import { style } from '@vanilla-extract/css';
import {
	interactionStateBackgroundImage,
	interactionStateTransitionProperty,
} from './interaction-state';

/**
 * Soft bordered surface link. Background states live here (not on Box sprinkles) so hover/pressed
 * are not overridden by the utilities-layer `backgroundColor` class.
 */
export const cardLink = style({
	'@layer': {
		components: {
			backgroundColor: vars.color.surface.base,
			backgroundImage: interactionStateBackgroundImage,
			color: vars.color.text.primary,
			textDecoration: 'none',
			transition: `${interactionStateTransitionProperty} ${vars.motion.feedback.duration} ${vars.motion.feedback.easing}`,
			selectors: {
				'&:hover': {
					...interactionState('hover'),
				},
				'&:active': {
					...interactionState('pressed'),
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
		components: {
			textAlign: 'end',
		},
	},
});
