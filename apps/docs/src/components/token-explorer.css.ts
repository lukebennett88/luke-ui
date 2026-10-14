import { keyframes, style } from '@vanilla-extract/css';

const motionSample = keyframes({
	from: { transform: 'translateX(-0.75rem)' },
	to: { transform: 'translateX(0.75rem)' },
});

// DS gap: Box has no animation props, and Luke UI ships no motion sample. The keyframes read the
// token's own duration and easing (set inline), and reduced motion stops them.
export const motionDot = style({
	'@layer': {
		components: {
			animationDirection: 'alternate',
			animationIterationCount: 'infinite',
			animationName: motionSample,
			'@media': {
				'(prefers-reduced-motion: reduce)': {
					animation: 'none',
				},
			},
		},
	},
});
