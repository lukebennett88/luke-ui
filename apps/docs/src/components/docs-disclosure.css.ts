import { vars } from '@luke-ui/react/theme';
import { style } from '@vanilla-extract/css';

// DS gap: Luke `Button` always draws control chrome, so there is no plain, unstyled button. Docs
// disclosures keep RAC `Button` via `renderRoot` and reset the browser's button chrome here. The
// hover fill is a state selector that Box fills cannot follow.
export const trigger = style({
	'@layer': {
		components: {
			backgroundColor: 'transparent',
			borderStyle: 'none',
			color: 'inherit',
			cursor: 'pointer',
			selectors: {
				'&:hover': {
					backgroundColor: vars.color.background.neutral.subtle.hover,
				},
				'&:focus-visible': {
					outline: `2px solid ${vars.color.border.focus}`,
					outlineOffset: '-2px',
				},
			},
		},
	},
});

// DS gap: Icon has no rotation or state-driven transform. The chevron points down when expanded,
// from either a `data-expanded` ancestor or its own trigger's `aria-expanded`.
export const chevronEnd = style({
	'@layer': {
		components: {
			color: vars.color.text.secondary,
			flexShrink: 0,
			transition: `transform ${vars.motion.duration.feedback} ${vars.motion.easing.standard}`,
			selectors: {
				'[data-expanded] &, [aria-expanded="true"] > &': {
					transform: 'rotate(90deg)',
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
