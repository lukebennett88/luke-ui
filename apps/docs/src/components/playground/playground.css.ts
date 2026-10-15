import { vars } from '@luke-ui/react/theme';
import { globalStyle, style } from '@vanilla-extract/css';
import { docsTabletMinInlineSize } from '../../lib/docs-container-queries.js';

/** Monaco github-light-high-contrast `editor.background`. */
const MONACO_LIGHT_BACKGROUND = '#ffffff';
/** Monaco github-dark-high-contrast `editor.background`. */
const MONACO_DARK_BACKGROUND = '#0a0c10';
/** Monaco light gutter digits. */
const MONACO_LIGHT_LINE_NUMBER = '#88929d';
/** Monaco dark gutter digits. */
const MONACO_DARK_LINE_NUMBER = '#9ea7b3';

const SEPARATOR_THUMB_THICKNESS = '0.375rem';
const SEPARATOR_THUMB_LENGTH = '4rem';

export const page = style({
	'@layer': {
		components: {
			display: 'flex',
			flexDirection: 'column',
			blockSize: '100dvh',
		},
	},
});

/**
 * CSS owns the visible flex direction so the desktop row layout is already correct while the
 * server-rendered vertical orientation waits for `useIsDesktop` to correct the panel behaviour.
 */
export const panelGroup = style({
	'@layer': {
		components: {
			display: 'flex',
			flex: '1 1 auto',
			// Important so CSS wins over the inline flex-direction react-resizable-panels sets from
			// its (possibly stale) orientation prop before `useIsDesktop` corrects it.
			flexDirection: 'column !important' as 'column',
			minBlockSize: 0,
			'@container': {
				[docsTabletMinInlineSize]: {
					flexDirection: 'row !important' as 'row',
				},
			},
		},
	},
});

export const editorPanel = style({
	'@layer': {
		components: {
			backgroundColor: MONACO_LIGHT_BACKGROUND,
			minBlockSize: 0,
			selectors: {
				':root.dark &': {
					backgroundColor: MONACO_DARK_BACKGROUND,
				},
			},
		},
	},
});

export const editorPanelBody = style({
	'@layer': {
		components: {
			blockSize: '100%',
			minBlockSize: 0,
		},
	},
});

export const editorShell = style({
	'@layer': {
		components: {
			display: 'flex',
			flexDirection: 'column',
			blockSize: '100%',
			minBlockSize: 0,
		},
	},
});

export const editorMount = style({
	'@layer': {
		components: {
			flex: '1 1 auto',
			minBlockSize: 0,
		},
	},
});

/**
 * react-resizable-panels owns hit-testing; this rule only draws the hairline and the centred
 * grab thumb. Thumb orientation flips with the root container query.
 */
export const separator = style({
	'@layer': {
		components: {
			backgroundColor: vars.color.border.decorative,
			blockSize: '1px',
			flexShrink: 0,
			inlineSize: 'auto',
			position: 'relative',
			zIndex: 10,
			'::after': {
				backgroundColor: `color-mix(in srgb, ${vars.color.text.secondary} 50%, transparent)`,
				blockSize: SEPARATOR_THUMB_THICKNESS,
				borderRadius: vars.radius.full,
				content: "''",
				inlineSize: SEPARATOR_THUMB_LENGTH,
				insetBlockStart: '50%',
				insetInlineStart: '50%',
				position: 'absolute',
				transform: 'translate(-50%, -50%)',
				transition: `background-color ${vars.motion.duration.feedback} ${vars.motion.easing.standard}`,
			},
			selectors: {
				'&[data-separator=active]::after': {
					backgroundColor: `color-mix(in srgb, ${vars.color.text.secondary} 80%, transparent)`,
				},
				'&[data-separator=focus]::after': {
					backgroundColor: `color-mix(in srgb, ${vars.color.text.secondary} 80%, transparent)`,
				},
				'&[data-separator=hover]::after': {
					backgroundColor: `color-mix(in srgb, ${vars.color.text.secondary} 65%, transparent)`,
				},
			},
			'@media': {
				'(prefers-reduced-motion: reduce)': {
					'::after': {
						transition: 'none',
					},
				},
			},
			'@container': {
				[docsTabletMinInlineSize]: {
					blockSize: 'auto',
					inlineSize: '1px',
					'::after': {
						blockSize: SEPARATOR_THUMB_LENGTH,
						inlineSize: SEPARATOR_THUMB_THICKNESS,
					},
				},
			},
		},
	},
});

export const previewPanel = style({
	'@layer': {
		components: {
			display: 'flex',
			flexDirection: 'column',
			minBlockSize: 0,
			position: 'relative',
		},
	},
});

export const previewPanelFullscreen = style({
	'@layer': {
		components: {
			backgroundColor: vars.color.surface.subdued,
			blockSize: 'auto',
			inlineSize: 'auto',
			inset: 0,
			position: 'fixed',
			zIndex: 50,
		},
	},
});

/** Keeps the editor and preview toolbars the same block size when their controls differ. */
export const paneToolbar = style({
	'@layer': {
		components: {
			alignItems: 'center',
			backgroundColor: vars.color.surface.base,
			borderBlockEnd: `1px solid ${vars.color.border.decorative}`,
			display: 'flex',
			flexShrink: 0,
			minBlockSize: `calc(${vars.controlSize.small} + ${vars.space.sp8} * 2 + 1px)`,
			paddingBlock: vars.space.sp8,
			paddingInline: vars.space.sp8,
			'@container': {
				[docsTabletMinInlineSize]: {
					paddingInline: vars.space.sp12,
				},
			},
		},
	},
});

export const previewToolbar = style({
	'@layer': {
		components: {
			gap: vars.space.sp8,
			justifyContent: 'space-between',
		},
	},
});

export const compileError = style({
	'@layer': {
		components: {
			backgroundColor: vars.color.surface.base,
			borderBlockEnd: `1px solid ${vars.color.border.decorative}`,
			color: vars.color.foreground.danger.rest,
			fontFamily: vars.font.family.code,
			fontSize: vars.font.caption.fontSize,
			lineHeight: vars.font.caption.lineHeight,
			paddingBlock: vars.space.sp8,
			paddingInline: vars.space.sp16,
		},
	},
});

export const previewCanvas = style({
	'@layer': {
		components: {
			backgroundColor: `color-mix(in srgb, ${vars.color.surface.subdued} 50%, transparent)`,
			flex: '1 1 auto',
			minBlockSize: 0,
			overflow: 'auto',
			padding: vars.space.sp8,
			'@container': {
				[docsTabletMinInlineSize]: {
					padding: vars.space.sp12,
				},
			},
		},
	},
});

export const previewFrame = style({
	'@layer': {
		components: {
			backgroundColor: vars.color.surface.base,
			borderColor: vars.color.border.decorative,
			borderRadius: vars.radius.surface,
			borderStyle: 'solid',
			borderWidth: '1px',
			blockSize: '100%',
			marginInline: 'auto',
			maxInlineSize: '100%',
			overflow: 'hidden',
			position: 'relative',
			transition: `inline-size ${vars.motion.duration.enter} ${vars.motion.easing.standard}`,
			'@media': {
				'(prefers-reduced-motion: reduce)': {
					transition: 'none',
				},
			},
		},
	},
});

/**
 * Iframes swallow pointer events that cross into them during a separator drag. Disable them while
 * the group reports an active or hovered separator.
 */
export const previewIframe = style({
	'@layer': {
		components: {
			border: 0,
			blockSize: '100%',
			inlineSize: '100%',
			selectors: {
				'[data-group]:has([data-separator=active]) &': {
					pointerEvents: 'none',
				},
				'[data-group]:has([data-separator=hover]) &': {
					pointerEvents: 'none',
				},
			},
		},
	},
});

export const previewLoading = style({
	'@layer': {
		components: {
			alignItems: 'center',
			backgroundColor: `color-mix(in srgb, ${vars.color.surface.base} 90%, transparent)`,
			display: 'flex',
			inset: 0,
			justifyContent: 'center',
			position: 'absolute',
			transition: `opacity ${vars.motion.duration.enter} ${vars.motion.easing.standard}, visibility ${vars.motion.duration.enter} ${vars.motion.easing.standard}`,
			'@media': {
				'(prefers-reduced-motion: reduce)': {
					transition: 'none',
				},
			},
		},
	},
});

export const previewLoadingHidden = style({
	'@layer': {
		components: {
			opacity: 0,
			visibility: 'hidden',
		},
	},
});

export const loadingPill = style({
	'@layer': {
		components: {
			alignItems: 'center',
			backgroundColor: vars.color.surface.overlay,
			borderColor: vars.color.border.decorative,
			borderRadius: vars.radius.full,
			borderStyle: 'solid',
			borderWidth: '1px',
			color: vars.color.text.secondary,
			display: 'flex',
			fontSize: vars.font.caption.fontSize,
			gap: vars.space.sp8,
			lineHeight: vars.font.caption.lineHeight,
			paddingBlock: vars.space.sp4,
			paddingInline: vars.space.sp12,
		},
	},
});

export const editorSkeleton = style({
	'@layer': {
		components: {
			blockSize: '100%',
			fontFamily: vars.font.family.code,
			fontSize: '13px',
			inlineSize: '100%',
			lineHeight: '20px',
			overflow: 'hidden',
			paddingBlockStart: vars.space.sp12,
			position: 'relative',
		},
	},
});

export const skeletonLine = style({
	'@layer': {
		components: {
			alignItems: 'center',
			blockSize: '20px',
			display: 'flex',
		},
	},
});

export const skeletonLineNumber = style({
	'@layer': {
		components: {
			color: MONACO_LIGHT_LINE_NUMBER,
			flexShrink: 0,
			inlineSize: '3ch',
			textAlign: 'end',
			selectors: {
				':root.dark &': {
					color: MONACO_DARK_LINE_NUMBER,
				},
			},
		},
	},
});

export const skeletonLineContent = style({
	'@layer': {
		components: {
			flex: '1 1 auto',
			minInlineSize: 0,
			overflow: 'hidden',
			paddingInlineEnd: vars.space.sp16,
			paddingInlineStart: '0.625rem',
		},
	},
});

export const skeletonBar = style({
	'@layer': {
		components: {
			blockSize: '0.75rem',
			display: 'block',
			inlineSize: 'var(--length)',
			marginInlineStart: 'var(--indent)',
		},
	},
});

export const skeletonPillOverlay = style({
	'@layer': {
		components: {
			alignItems: 'center',
			display: 'flex',
			inset: 0,
			justifyContent: 'center',
			pointerEvents: 'none',
			position: 'absolute',
		},
	},
});

export const previewRunner = style({
	'@layer': {
		components: {
			display: 'flex',
			flexDirection: 'column',
			minBlockSize: '100dvh',
		},
	},
});

globalStyle(`${previewRunner} > *`, {
	'@layer': {
		components: {
			flex: '1 1 auto',
		},
	},
});
