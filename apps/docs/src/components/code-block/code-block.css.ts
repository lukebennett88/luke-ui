import { vars } from '@luke-ui/react/theme';
import { globalStyle, style } from '@vanilla-extract/css';

export const root = style({
	'@layer': {
		recipes: {
			backgroundColor: vars.color.surface.recessed,
			borderColor: vars.color.border.decorative,
			borderRadius: vars.radius.surface,
			borderStyle: 'solid',
			borderWidth: '1px',
			color: vars.color.text.primary,
			display: 'flex',
			flexDirection: 'column',
			fontFamily: vars.font.family.code,
			fontSize: vars.font.caption.fontSize,
			lineHeight: vars.font.caption.lineHeight,
			maxInlineSize: '100%',
			overflow: 'hidden',
			position: 'relative',
		},
	},
});

/** Vertical rhythm for MDX fences; parent Stack/Cluster owns spacing elsewhere. */
export const mdxFence = style({
	'@layer': {
		recipes: {
			marginBlockStart: vars.space.sp24,
		},
	},
});

export const flush = style({
	'@layer': {
		recipes: {
			borderInlineWidth: 0,
			borderRadius: 0,
			borderBlockEndWidth: 0,
		},
	},
});

export const header = style({
	'@layer': {
		recipes: {
			alignItems: 'center',
			borderBlockEndColor: vars.color.border.decorative,
			borderBlockEndStyle: 'solid',
			borderBlockEndWidth: '1px',
			display: 'flex',
			gap: vars.space.sp8,
			minBlockSize: vars.controlSize.medium,
			paddingBlock: vars.space.sp4,
			paddingInline: vars.space.sp12,
		},
	},
});

export const title = style({
	'@layer': {
		recipes: {
			color: vars.color.text.secondary,
			flex: '1 1 auto',
			fontFamily: vars.font.family.body,
			fontSize: vars.font.label.fontSize,
			lineHeight: vars.font.label.lineHeight,
			minInlineSize: 0,
			overflow: 'hidden',
			textOverflow: 'ellipsis',
			whiteSpace: 'nowrap',
		},
	},
});

export const actions = style({
	'@layer': {
		recipes: {
			alignItems: 'center',
			display: 'flex',
			flexShrink: 0,
			gap: vars.space.sp4,
			marginInlineStart: 'auto',
		},
	},
});

export const floatingActions = style({
	'@layer': {
		recipes: {
			insetBlockStart: vars.space.sp8,
			insetInlineEnd: vars.space.sp8,
			position: 'absolute',
			zIndex: 1,
		},
	},
});

/** Inherits figure direction so floating-copy padding mirrors with the button. */
export const viewportFrame = style({
	'@layer': {
		recipes: {
			minInlineSize: 0,
		},
	},
});

export const viewportFrameWithFloatingCopy = style({
	'@layer': {
		recipes: {
			// Same physical side as floatingActions (insetInlineEnd on the figure).
			paddingInlineEnd: vars.space.sp48,
		},
	},
});

export const viewport = style({
	'@layer': {
		recipes: {
			maxBlockSize: '37.5rem',
			overflow: 'auto',
			paddingBlock: vars.space.sp12,
			paddingInline: vars.space.sp16,
			selectors: {
				'&:focus-visible': {
					outlineColor: vars.color.border.focus,
					outlineOffset: '-2px',
					outlineStyle: 'solid',
					outlineWidth: '2px',
				},
			},
		},
	},
});

export const pre = style({
	'@layer': {
		recipes: {
			// max-content so long lines widen the scrollport; min 100% so short blocks fill the frame.
			inlineSize: 'max-content',
			margin: 0,
			minInlineSize: '100%',
			overflow: 'visible',
			whiteSpace: 'pre',
		},
	},
});

globalStyle(`${pre} code`, {
	'@layer': {
		recipes: {
			// Reset prose inline-code chrome if `not-prose` is missing on an ancestor.
			backgroundColor: 'transparent',
			borderRadius: 0,
			borderWidth: 0,
			display: 'flex',
			flexDirection: 'column',
			fontFamily: 'inherit',
			fontSize: 'inherit',
			lineHeight: 'inherit',
			padding: 0,
		},
	},
});

// Dual-theme Shiki spans: light-dark picks the active colour mode.
globalStyle(`${pre} :is(.shiki, code) span`, {
	'@layer': {
		recipes: {
			color: 'light-dark(var(--shiki-light), var(--shiki-dark))',
		},
	},
});
