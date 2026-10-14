import { vars } from '@luke-ui/react/theme';
import { style } from '@vanilla-extract/css';

/**
 * Unstyled full-width disclosure trigger. Luke `Button` always applies control chrome, so docs
 * disclosures keep RAC `Button` via Box `renderRoot` and this reset.
 *
 * Caption metrics keep Track `firstLine` rails on the same 1lh as label/type text, even when the
 * trigger sits inside a heading.
 */
export const trigger = style({
	'@layer': {
		components: {
			backgroundColor: 'transparent',
			borderStyle: 'none',
			color: 'inherit',
			cursor: 'pointer',
			fontFamily: 'inherit',
			fontSize: vars.font.caption.fontSize,
			fontWeight: 'inherit',
			lineHeight: vars.font.caption.lineHeight,
			textAlign: 'start',
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

/** Start-rail chevron that rotates to point down when expanded. */
export const chevronEnd = style({
	'@layer': {
		components: {
			color: vars.color.text.secondary,
			flexShrink: 0,
			transition: `transform ${vars.motion.duration.feedback} ${vars.motion.easing.standard}`,
			selectors: {
				'[data-expanded] &': {
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
