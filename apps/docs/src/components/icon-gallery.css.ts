import { vars } from '@luke-ui/react/theme';
import { style } from '@vanilla-extract/css';

export const count = style({
	'@layer': {
		components: {
			marginInlineStart: 'auto',
		},
	},
});

export const frame = style({
	'@layer': {
		components: {
			borderColor: vars.color.border.decorative,
			borderRadius: vars.radius.surface,
			borderStyle: 'solid',
			borderWidth: '1px',
			overflow: 'hidden',
		},
	},
});

export const cell = style({
	'@layer': {
		components: {
			borderBlockEndColor: vars.color.border.decorative,
			borderBlockEndStyle: 'solid',
			borderBlockEndWidth: '1px',
			borderInlineEndColor: vars.color.border.decorative,
			borderInlineEndStyle: 'solid',
			borderInlineEndWidth: '1px',
			display: 'flex',
			flexDirection: 'column',
			marginBlockEnd: '-1px',
			marginInlineEnd: '-1px',
		},
	},
});

export const iconName = style({
	'@layer': {
		components: {
			inlineSize: '100%',
		},
	},
});

export const copyRow = style({
	'@layer': {
		components: {
			borderBlockStartColor: vars.color.border.decorative,
			borderBlockStartStyle: 'solid',
			borderBlockStartWidth: '1px',
			display: 'grid',
			gridTemplateColumns: '1fr 1fr',
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

export const emptyState = style({
	'@layer': {
		components: {
			textAlign: 'center',
		},
	},
});
