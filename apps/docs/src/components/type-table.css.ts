import { vars } from '@luke-ui/react/theme';
import { style } from '@vanilla-extract/css';
import { SITE_HEADER_BLOCK_SIZE } from './site-header-size.js';

// Named so shell-wide unnamed `@container` queries still resolve against `:root`.
const TYPE_TABLE_CONTAINER = 'luke-docs-type-table';
/** Wide enough for the Prop and Type columns to sit side by side. */
const TYPE_COLUMN_MIN_INLINE_SIZE = `${TYPE_TABLE_CONTAINER} (inline-size >= 1024px)`;

/** Container query host + caption type; column tracks live on Grid. */
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

/** Shown beside Prop once the type-table container is wide enough. */
export const typeColumn = style({
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

/** Button reset and interaction; Box owns padding via renderRoot. */
export const trigger = style({
	'@layer': {
		components: {
			backgroundColor: 'transparent',
			borderStyle: 'none',
			color: 'inherit',
			cursor: 'pointer',
			font: 'inherit',
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
			fontWeight: vars.font.weight.label,
			minInlineSize: 'fit-content',
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

export const propTypeLink = style({
	'@layer': {
		components: {
			color: 'inherit',
			textDecoration: 'underline',
			textUnderlineOffset: '0.15em',
		},
	},
});

/** Rotation only; Track owns placement in the end rail. */
export const chevron = style({
	'@layer': {
		components: {
			color: vars.color.text.secondary,
			transition: `transform ${vars.motion.duration.feedback} ${vars.motion.easing.standard}`,
			selectors: {
				[`${row}[data-expanded] &`]: {
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
