import { vars } from '@luke-ui/react/theme';
import { globalStyle, style } from '@vanilla-extract/css';
import { docsTabletMinInlineSize } from '../../lib/docs-container-queries.js';
import { monacoChromeColors } from '../../lib/shiki-theme.js';

const SEPARATOR_THUMB_THICKNESS = '0.375rem';
const SEPARATOR_THUMB_LENGTH = '4rem';

/**
 * CSS owns the visible flex direction so the desktop row layout is already correct while the
 * server-rendered vertical orientation waits for `useIsDesktop` to correct the panel behaviour.
 * Layout primitives cannot express the `!important` + container-query flip against
 * react-resizable-panels' inline orientation.
 */
export const panelGroup = style({
	'@layer': {
		components: {
			display: 'flex',
			flexBasis: 'auto',
			flexGrow: 1,
			flexShrink: 1,
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
			backgroundColor: monacoChromeColors.light.background,
			minBlockSize: 0,
			selectors: {
				':root.dark &': {
					backgroundColor: monacoChromeColors.dark.background,
				},
			},
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
				backgroundColor: `color-mix(in srgb, ${vars.color.foreground.secondary} 50%, transparent)`,
				blockSize: SEPARATOR_THUMB_THICKNESS,
				borderRadius: vars.radius.full,
				content: "''",
				inlineSize: SEPARATOR_THUMB_LENGTH,
				insetBlockStart: '50%',
				insetInlineStart: '50%',
				position: 'absolute',
				transform: 'translate(-50%, -50%)',
				transition: `background-color ${vars.motion.feedback.duration} ${vars.motion.feedback.easing}`,
			},
			selectors: {
				'&[data-separator=active]::after': {
					backgroundColor: `color-mix(in srgb, ${vars.color.foreground.secondary} 80%, transparent)`,
				},
				'&[data-separator=focus]::after': {
					backgroundColor: `color-mix(in srgb, ${vars.color.foreground.secondary} 80%, transparent)`,
				},
				'&[data-separator=hover]::after': {
					backgroundColor: `color-mix(in srgb, ${vars.color.foreground.secondary} 65%, transparent)`,
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
			minBlockSize: 0,
			position: 'relative',
		},
	},
});

export const previewPanelFullscreen = style({
	'@layer': {
		components: {
			backgroundColor: vars.color.background.surface.subdued,
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
			backgroundColor: vars.color.background.surface.base,
			borderBlockEnd: `1px solid ${vars.color.border.decorative}`,
			minBlockSize: `calc(${vars.controlSize.px32} + ${vars.space['8']} * 2 + 1px)`,
			paddingBlock: vars.space['8'],
			paddingInline: vars.space['8'],
			'@container': {
				[docsTabletMinInlineSize]: {
					paddingInline: vars.space['12'],
				},
			},
		},
	},
});

export const compileError = style({
	'@layer': {
		components: {
			backgroundColor: vars.color.background.surface.base,
			borderBlockEnd: `1px solid ${vars.color.border.decorative}`,
			color: vars.color.foreground.danger.rest,
			fontFamily: vars.font.family.code,
			fontSize: vars.font.caption.fontSize,
			lineHeight: vars.font.caption.lineHeight,
			paddingBlock: vars.space['8'],
			paddingInline: vars.space['16'],
		},
	},
});

export const previewCanvas = style({
	'@layer': {
		components: {
			backgroundColor: `color-mix(in srgb, ${vars.color.background.surface.subdued} 50%, transparent)`,
			overflow: 'auto',
			padding: vars.space['8'],
			'@container': {
				[docsTabletMinInlineSize]: {
					padding: vars.space['12'],
				},
			},
		},
	},
});

export const previewFrame = style({
	'@layer': {
		components: {
			backgroundColor: vars.color.background.surface.base,
			borderColor: vars.color.border.decorative,
			borderRadius: vars.radius.surface,
			borderStyle: 'solid',
			borderWidth: '1px',
			blockSize: '100%',
			marginInline: 'auto',
			maxInlineSize: '100%',
			overflow: 'hidden',
			position: 'relative',
			transition: `inline-size ${vars.motion.enter.duration} ${vars.motion.enter.easing}`,
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
			backgroundColor: `color-mix(in srgb, ${vars.color.background.surface.base} 90%, transparent)`,
			inset: 0,
			position: 'absolute',
			transition: `opacity ${vars.motion.enter.duration} ${vars.motion.enter.easing}, visibility ${vars.motion.enter.duration} ${vars.motion.enter.easing}`,
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
			backgroundColor: vars.color.background.surface.raised,
			borderColor: vars.color.border.decorative,
			borderRadius: vars.radius.full,
			borderStyle: 'solid',
			borderWidth: '1px',
			color: vars.color.foreground.secondary,
			fontSize: vars.font.caption.fontSize,
			lineHeight: vars.font.caption.lineHeight,
			paddingBlock: vars.space['4'],
			paddingInline: vars.space['12'],
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
			paddingBlockStart: vars.space['12'],
			position: 'relative',
		},
	},
});

/** Gutter digit colour and end alignment — Box excludes typography. */
export const skeletonLineNumber = style({
	'@layer': {
		components: {
			color: monacoChromeColors.light.lineNumber,
			textAlign: 'end',
			selectors: {
				':root.dark &': {
					color: monacoChromeColors.dark.lineNumber,
				},
			},
		},
	},
});

/** Monaco gutter gap is 0.625rem, not a Luke UI space token. */
export const skeletonLineContent = style({
	'@layer': {
		components: {
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
			inset: 0,
			pointerEvents: 'none',
			position: 'absolute',
		},
	},
});

/**
 * Preview host for StoryWrapper. Stack owns the column; the direct child must flex-grow so the
 * wrapper fills the iframe and keeps its overflow scrolling.
 */
export const previewRunner = style({});

globalStyle(`${previewRunner} > *`, {
	'@layer': {
		components: {
			flexBasis: 'auto',
			flexGrow: 1,
			flexShrink: 1,
			minBlockSize: 0,
		},
	},
});
