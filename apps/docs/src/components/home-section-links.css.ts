import { vars } from '@luke-ui/react/theme';
import { interactionState } from '@luke-ui/react/utils';
import { style } from '@vanilla-extract/css';
import {
	interactionStateBackgroundImage,
	interactionStateTransitionProperty,
} from './interaction-state';

/**
 * Fill states for the home link cards. They live here rather than on Box because the components
 * layer outranks the utilities-layer resting `backgroundColor` class. Focus keeps the global ring.
 */
export const card = style({
	'@layer': {
		components: {
			color: vars.color.foreground.primary,
			backgroundImage: interactionStateBackgroundImage,
			textDecoration: 'none',
			transition: `${interactionStateTransitionProperty} ${vars.motion.feedback.duration} ${vars.motion.feedback.easing}`,
			selectors: {
				'&:hover': {
					...interactionState('hover'),
				},
				'&:active': {
					...interactionState('pressed'),
				},
			},
		},
	},
});
