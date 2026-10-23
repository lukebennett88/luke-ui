import { vars } from '@luke-ui/react/theme';
import { globalStyle, style } from '@vanilla-extract/css';

export const root = style({
	'@layer': {
		components: {
			backgroundColor: vars.color.surface.subdued,
			borderColor: vars.color.border.decorative,
			borderRadius: vars.radius.surface,
			borderStyle: 'solid',
			borderWidth: '1px',
			color: vars.color.text.primary,
			display: 'flex',
			flexDirection: 'column',
			fontFamily: vars.font.family.code,
			// Label matches the old Fumadocs `text-sm` fence size and inline `Code` at body size.
			fontSize: vars.font.label.fontSize,
			lineHeight: vars.font.label.lineHeight,
			// Own the figure margin; without Tailwind preflight the UA indent would show.
			margin: 0,
			maxInlineSize: '100%',
			overflow: 'hidden',
			position: 'relative',
		},
	},
});

/**
 * A titled block reads as a bar over a body: the root paints the lighter body (so ScrollFade's
 * edge mask fades into the same colour) and the header repaints `surface.subdued`. Untitled blocks
 * keep the all-subdued root, which also backs the overlay copy.
 */
export const titled = style({
	'@layer': {
		components: {
			backgroundColor: vars.color.surface.base,
		},
	},
});

/**
 * Vertical rhythm for code blocks in MDX flow. A `not-prose` root gets no Prose margin, so the
 * block supplies its own; a parent Stack/Cluster owns spacing elsewhere.
 */
export const mdxFence = style({
	'@layer': {
		components: {
			marginBlockStart: vars.space['32'],
		},
	},
});

export const flush = style({
	'@layer': {
		components: {
			borderInlineWidth: 0,
			borderRadius: 'inherit',
			borderBlockEndWidth: 0,
			overflow: 'visible',
		},
	},
});

/**
 * Inline start matches the viewport (`space.16`) so the caption lines up with the code text.
 * Copy button inset: measured `radius.surface` is 12px in Tactile and Paper; `radius.control` is
 * 8px in Tactile and 4px in Paper. A 4px inset nests concentrically in Tactile (12 - 4 = 8) and is
 * 3px off in Paper, while an 8px inset would be 5px off in Tactile (12 - 8 = 4), so the 40px
 * header keeps a 4px inset on the top, inline-end and bottom edges (`headerWithActions`).
 */
export const header = style({
	'@layer': {
		components: {
			alignItems: 'center',
			backgroundColor: vars.color.surface.subdued,
			borderBlockEndColor: vars.color.border.decorative,
			borderBlockEndStyle: 'solid',
			borderBlockEndWidth: '1px',
			display: 'flex',
			gap: vars.space['8'],
			minBlockSize: vars.controlSize.px40,
			paddingBlock: vars.space['4'],
			paddingInline: vars.space['16'],
		},
	},
});

/** Inline-end inset equals the block inset around the copy button (`space.4`). */
export const headerWithActions = style({
	'@layer': {
		components: {
			paddingInlineEnd: vars.space['4'],
		},
	},
});

export const title = style({
	'@layer': {
		components: {
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
		components: {
			alignItems: 'center',
			display: 'flex',
			flexShrink: 0,
			gap: vars.space['4'],
			marginInlineStart: 'auto',
		},
	},
});

/**
 * Titleless copy overlays the full-width scrollport (no side column).
 * Block offset centres the control on the first code line (viewport pad + half line − half control).
 */
export const overlayActions = style({
	'@layer': {
		components: {
			backgroundColor: vars.color.surface.subdued,
			insetBlockStart: `calc(${vars.space['12']} + (${vars.font.label.lineHeight} / 2) - (${vars.controlSize.px32} / 2))`,
			insetInlineEnd: vars.space['8'],
			position: 'absolute',
			zIndex: 1,
		},
	},
});

export const viewport = style({
	'@layer': {
		components: {
			minInlineSize: 0,
			paddingBlock: vars.space['12'],
			paddingInline: vars.space['16'],
			selectors: {
				// The figure (and flush example parents) clip overflow, so inset the global ring.
				'&:focus-visible': {
					outlineOffset: '-2px',
				},
			},
		},
	},
});

/**
 * Clear the overlay copy without a side column. Padding stays on the full-width
 * scrollport so the recessed surface continues under the button.
 */
export const viewportWithOverlayCopy = style({
	'@layer': {
		components: {
			paddingInlineEnd: vars.space['48'],
		},
	},
});

export const pre = style({
	'@layer': {
		components: {
			// Keep the figure's code stack; without Preflight the UA sets `font-family: monospace`.
			fontFamily: 'inherit',
			fontSize: 'inherit',
			lineHeight: 'inherit',
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
		components: {
			// Reset inline-code chrome so highlighted lines do not look like inline `code`.
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

// Empty lines are flex items and collapse to zero height without a minimum.
globalStyle(`${pre} code .line`, {
	'@layer': {
		components: {
			minBlockSize: vars.font.label.lineHeight,
		},
	},
});

// Dual-theme Shiki spans: light-dark picks the active colour mode.
globalStyle(`${pre} :is(.shiki, code) span`, {
	'@layer': {
		components: {
			color: 'light-dark(var(--shiki-light), var(--shiki-dark))',
		},
	},
});
