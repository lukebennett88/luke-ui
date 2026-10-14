import { vars } from '@luke-ui/react/theme';
import { style } from '@vanilla-extract/css';

/** Button reset and focus; Cluster owns gap, padding, and justification. */
export const groupTrigger = style({
	'@layer': {
		components: {
			backgroundColor: 'transparent',
			borderStyle: 'none',
			color: 'inherit',
			cursor: 'pointer',
			display: 'block',
			font: 'inherit',
			inlineSize: '100%',
			padding: 0,
			textAlign: 'start',
			selectors: {
				'&:focus-visible': {
					outline: `2px solid ${vars.color.border.focus}`,
					outlineOffset: '-2px',
				},
			},
		},
	},
});

export const groupChevron = style({
	'@layer': {
		components: {
			color: vars.color.text.secondary,
			flexShrink: 0,
			transition: `transform ${vars.motion.duration.feedback} ${vars.motion.easing.standard}`,
			selectors: {
				'[data-expanded] &': {
					transform: 'rotate(180deg)',
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

/** Top rule only; Box owns panel padding. */
export const groupPanel = style({
	'@layer': {
		components: {
			borderBlockStartColor: vars.color.border.decorative,
			borderBlockStartStyle: 'solid',
			borderBlockStartWidth: '1px',
		},
	},
});
