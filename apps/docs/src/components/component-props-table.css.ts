import { vars } from '@luke-ui/react/theme';
import { style } from '@vanilla-extract/css';

export const groupCell = style({
	'@layer': {
		components: {
			padding: 0,
		},
	},
});

/**
 * Unstyled full-width disclosure button. Luke `Button` always applies control chrome, so the docs
 * keep RAC `Button` with this reset. Hover and expanded fills follow React Aria's API tables.
 */
export const groupButton = style({
	'@layer': {
		components: {
			alignItems: 'center',
			backgroundColor: 'transparent',
			borderStyle: 'none',
			color: vars.color.text.primary,
			cursor: 'pointer',
			display: 'flex',
			fontFamily: 'inherit',
			fontSize: vars.font.label.fontSize,
			fontWeight: vars.font.weight.emphasis,
			gap: vars.space.sp4,
			inlineSize: '100%',
			lineHeight: vars.font.label.lineHeight,
			paddingBlock: vars.space.sp8,
			paddingInline: vars.space.sp16,
			textAlign: 'start',
			selectors: {
				'&:hover': {
					backgroundColor: vars.color.background.neutral.subtle.hover,
				},
				'&[aria-expanded="true"]': {
					backgroundColor: vars.color.surface.subdued,
				},
				'&[aria-expanded="true"]:hover': {
					backgroundColor: vars.color.background.neutral.subtle.pressed,
				},
				'&:focus-visible': {
					outline: `2px solid ${vars.color.border.focus}`,
					outlineOffset: '-2px',
				},
			},
		},
	},
});

/** Points right, then turns down when the button's own disclosure is open. */
export const groupChevron = style({
	'@layer': {
		components: {
			color: vars.color.text.secondary,
			flexShrink: 0,
			transition: `transform ${vars.motion.duration.feedback} ${vars.motion.easing.standard}`,
			selectors: {
				'[aria-expanded="true"] > &': {
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
