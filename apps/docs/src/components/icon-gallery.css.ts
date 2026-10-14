import { vars } from '@luke-ui/react/theme';
import { style } from '@vanilla-extract/css';

/** Collapsed grid cell borders; Stack/Grid own the internal layout. */
export const cell = style({
	'@layer': {
		components: {
			borderBlockEndColor: vars.color.border.decorative,
			borderBlockEndStyle: 'solid',
			borderBlockEndWidth: '1px',
			borderInlineEndColor: vars.color.border.decorative,
			borderInlineEndStyle: 'solid',
			borderInlineEndWidth: '1px',
			marginBlockEnd: '-1px',
			marginInlineEnd: '-1px',
		},
	},
});

/** Top rule only; Grid owns the two-column copy footer. */
export const copyRow = style({
	'@layer': {
		components: {
			borderBlockStartColor: vars.color.border.decorative,
			borderBlockStartStyle: 'solid',
			borderBlockStartWidth: '1px',
		},
	},
});

export const copyButton = style({
	'@layer': {
		components: {
			alignItems: 'center',
			backgroundColor: 'transparent',
			borderStyle: 'none',
			color: vars.color.text.secondary,
			columnGap: vars.space.sp4,
			cursor: 'pointer',
			display: 'flex',
			fontSize: vars.font.caption.fontSize,
			fontWeight: vars.font.weight.label,
			justifyContent: 'center',
			lineHeight: vars.font.caption.lineHeight,
			minBlockSize: vars.space.sp32,
			minInlineSize: 0,
			padding: 0,
			transition: `background-color ${vars.motion.duration.feedback} ${vars.motion.easing.standard}, color ${vars.motion.duration.feedback} ${vars.motion.easing.standard}`,
			whiteSpace: 'nowrap',
			selectors: {
				'&:hover, &:focus-visible': {
					backgroundColor: vars.color.background.neutral.subtle.hover,
					color: vars.color.text.primary,
				},
				'&:focus-visible': {
					outline: `2px solid ${vars.color.border.focus}`,
					outlineOffset: '-2px',
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

export const copyButtonDivider = style({
	'@layer': {
		components: {
			borderInlineEndColor: vars.color.border.decorative,
			borderInlineEndStyle: 'solid',
			borderInlineEndWidth: '1px',
		},
	},
});
