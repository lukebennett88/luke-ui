import { vars } from '@luke-ui/react/theme';
import { style } from '@vanilla-extract/css';

/**
 * Fill states for the home link cards. They live here rather than on Box because the components
 * layer outranks the utilities-layer resting `backgroundColor` class. Focus keeps the global ring.
 */
export const card = style({
	'@layer': {
		components: {
			color: vars.color.text.primary,
			textDecoration: 'none',
			transition: `background-color ${vars.motion.feedback.duration} ${vars.motion.feedback.easing}`,
			selectors: {
				'&:hover': {
					backgroundColor: vars.color.background.neutral.subtle.hover,
				},
				'&:active': {
					backgroundColor: vars.color.background.neutral.subtle.pressed,
				},
			},
		},
	},
});
