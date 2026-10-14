import { vars } from '@luke-ui/react/theme';
import { style } from '@vanilla-extract/css';
import { SITE_HEADER_BLOCK_SIZE } from './site-header-size.js';

// Named so shell-wide unnamed `@container` queries still resolve against `:root`.
const TYPE_TABLE_CONTAINER = 'luke-docs-type-table';
/** Wide enough for the Prop and Type columns to sit side by side. */
const TYPE_COLUMN_MIN_INLINE_SIZE = `${TYPE_TABLE_CONTAINER} (inline-size >= 1024px)`;

/** Container query host + caption type; layout chrome lives on Box/Stack/Cluster/Grid. */
export const root = style({
	'@layer': {
		components: {
			color: vars.color.text.primary,
			containerName: TYPE_TABLE_CONTAINER,
			containerType: 'inline-size',
			fontSize: vars.font.caption.fontSize,
			lineHeight: vars.font.caption.lineHeight,
		},
	},
});

export const headerProp = style({
	'@layer': {
		components: {
			flex: '0 0 25%',
			minInlineSize: 'fit-content',
			paddingInlineEnd: vars.space.sp8,
		},
	},
});

export const headerType = style({
	'@layer': {
		components: {
			display: 'none',
			'@container': {
				[TYPE_COLUMN_MIN_INLINE_SIZE]: {
					display: 'block',
				},
			},
		},
	},
});

export const row = style({
	'@layer': {
		components: {
			borderColor: 'transparent',
			borderRadius: vars.radius.control,
			borderStyle: 'solid',
			borderWidth: '1px',
			overflow: 'hidden',
			scrollMarginBlockStart: `calc(${SITE_HEADER_BLOCK_SIZE} + ${vars.space.sp24})`,
			selectors: {
				'&[data-expanded]': {
					backgroundColor: vars.color.surface.base,
					borderColor: vars.color.border.decorative,
					boxShadow: vars.depth.raised,
				},
				'&[data-expanded]:not(:last-child)': {
					marginBlockEnd: vars.space.sp8,
				},
			},
		},
	},
});

export const trigger = style({
	'@layer': {
		components: {
			alignItems: 'center',
			backgroundColor: 'transparent',
			borderStyle: 'none',
			color: 'inherit',
			cursor: 'pointer',
			display: 'flex',
			font: 'inherit',
			inlineSize: '100%',
			paddingBlock: vars.space.sp8,
			paddingInline: vars.space.sp12,
			paddingInlineEnd: vars.space.sp32,
			position: 'relative',
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

export const propName = style({
	'@layer': {
		components: {
			color: vars.color.text.primary,
			flex: '0 0 25%',
			fontFamily: vars.font.family.code,
			fontSize: vars.font.caption.fontSize,
			fontWeight: vars.font.weight.label,
			lineHeight: vars.font.caption.lineHeight,
			minInlineSize: 'fit-content',
			paddingInlineEnd: vars.space.sp8,
		},
	},
});

export const propNameDeprecated = style({
	'@layer': {
		components: {
			color: vars.color.text.secondary,
			textDecoration: 'line-through',
		},
	},
});

export const propType = style({
	'@layer': {
		components: {
			display: 'none',
			minInlineSize: 0,
			'@container': {
				[TYPE_COLUMN_MIN_INLINE_SIZE]: {
					display: 'block',
				},
			},
		},
	},
});

export const propTypeLink = style({
	'@layer': {
		components: {
			color: 'inherit',
			textDecoration: 'underline',
			textUnderlineOffset: '0.15em',
		},
	},
});

export const chevron = style({
	'@layer': {
		components: {
			color: vars.color.text.secondary,
			insetBlockStart: '50%',
			insetInlineEnd: vars.space.sp8,
			position: 'absolute',
			transform: 'translateY(-50%)',
			transition: `transform ${vars.motion.duration.feedback} ${vars.motion.easing.standard}`,
			selectors: {
				[`${row}[data-expanded] &`]: {
					transform: 'translateY(-50%) rotate(180deg)',
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

/** Top rule only; Grid owns columns, gap, and padding. */
export const panel = style({
	'@layer': {
		components: {
			borderBlockStartColor: vars.color.border.decorative,
			borderBlockStartStyle: 'solid',
			borderBlockStartWidth: '1px',
			fontSize: vars.font.caption.fontSize,
			lineHeight: vars.font.caption.lineHeight,
		},
	},
});

export const description = style({
	'@layer': {
		components: {
			color: vars.color.text.primary,
			selectors: {
				'&:empty': {
					display: 'none',
				},
			},
		},
	},
});
