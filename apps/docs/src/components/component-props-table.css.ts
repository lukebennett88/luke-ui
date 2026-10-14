import { vars } from '@luke-ui/react/theme';
import { style } from '@vanilla-extract/css';

export const group = style({
	'@layer': {
		components: {
			backgroundColor: vars.color.surface.base,
			borderColor: vars.color.border.decorative,
			borderRadius: vars.radius.surface,
			borderStyle: 'solid',
			borderWidth: '1px',
			overflow: 'hidden',
		},
	},
});

export const groupTrigger = style({
	'@layer': {
		components: {
			alignItems: 'center',
			backgroundColor: 'transparent',
			borderStyle: 'none',
			color: 'inherit',
			columnGap: vars.space.sp8,
			cursor: 'pointer',
			display: 'flex',
			font: 'inherit',
			inlineSize: '100%',
			justifyContent: 'space-between',
			paddingBlock: vars.space.sp12,
			paddingInline: vars.space.sp16,
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
				[`${group}[data-expanded] &`]: {
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

export const groupPanel = style({
	'@layer': {
		components: {
			borderBlockStartColor: vars.color.border.decorative,
			borderBlockStartStyle: 'solid',
			borderBlockStartWidth: '1px',
			paddingBlockEnd: vars.space.sp4,
			paddingInline: vars.space.sp4,
		},
	},
});
