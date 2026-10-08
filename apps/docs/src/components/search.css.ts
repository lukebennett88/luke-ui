import { vars } from '@luke-ui/react/theme';
import { cx } from '@luke-ui/react/utils';
import type { ComplexStyleRule } from '@vanilla-extract/css';
import { createVar, globalStyle, style } from '@vanilla-extract/css';
import { DOCS_SEARCH_FIELD_VT_SHARE_CLASS } from './search-view-transition.js';

export const searchAnchorHeightVar = createVar();

const overlayEnter = cx('opacity', vars.motion.duration.enter, vars.motion.easing.standard);
const overlayExit = cx('opacity', vars.motion.duration.exit, vars.motion.easing.exit);
const panelResultsEnter = `max-block-size ${vars.motion.duration.enter} ${vars.motion.easing.standard}, opacity ${vars.motion.duration.enter} ${vars.motion.easing.standard}`;
const panelResultsExit = `max-block-size ${vars.motion.duration.exit} ${vars.motion.easing.exit}, opacity ${vars.motion.duration.exit} ${vars.motion.easing.exit}`;

const vtShareDuration = vars.motion.duration.enter;
const vtShareEasing = vars.motion.easing.standard;

const vtShareReducedMotion = {
	'@media': {
		'(prefers-reduced-motion: reduce)': {
			animationDuration: '0.01ms',
		},
	},
} as const satisfies ComplexStyleRule;

globalStyle(`::view-transition-group(.${DOCS_SEARCH_FIELD_VT_SHARE_CLASS})`, {
	animationDuration: vtShareDuration,
	animationTimingFunction: vtShareEasing,
	...vtShareReducedMotion,
});

globalStyle(`::view-transition-old(.${DOCS_SEARCH_FIELD_VT_SHARE_CLASS})`, {
	animationDuration: vtShareDuration,
	animationTimingFunction: vtShareEasing,
	...vtShareReducedMotion,
});

globalStyle(`::view-transition-new(.${DOCS_SEARCH_FIELD_VT_SHARE_CLASS})`, {
	animationDuration: vtShareDuration,
	animationTimingFunction: vtShareEasing,
	...vtShareReducedMotion,
});

const reducedMotionOverlay = {
	'@media': {
		'(prefers-reduced-motion: reduce)': {
			transition: 'none',
			selectors: {
				'&[data-entering]': {
					opacity: 1,
					transition: 'none',
				},
				'&[data-exiting]': {
					opacity: 1,
					pointerEvents: 'none',
					transition: 'none',
				},
			},
		},
	},
} as const satisfies ComplexStyleRule;

const reducedMotionNoTransition = {
	'@media': {
		'(prefers-reduced-motion: reduce)': {
			transition: 'none',
		},
	},
} as const satisfies ComplexStyleRule;

export const trigger = style({
	'@layer': {
		recipes: {
			'@media': {
				'(forced-colors: active)': {
					backgroundColor: 'Field',
					borderColor: 'FieldText',
					boxShadow: 'none',
					color: 'FieldText',
					forcedColorAdjust: 'auto',
				},
				'(prefers-reduced-motion: reduce)': {
					transition: 'none',
				},
			},
			backgroundColor: vars.color.surface.field,
			borderColor: vars.color.border.control,
			boxShadow: vars.depth.recessed,
			cursor: 'text',
			fontWeight: vars.font.weight.body,
			justifyContent: 'flex-start',
			textAlign: 'start',
			transitionDuration: vars.motion.duration.feedback,
			transitionProperty: 'background-color, border-color, box-shadow, color',
			transitionTimingFunction: vars.motion.easing.standard,
			// The trigger reads as a search field, so it follows the field model: the hover border, and
			// no button depth or fill changes. Focus keeps the Button's ring.
			selectors: {
				'&[data-hovered="true"]:not([data-disabled="true"]):not([data-pending="true"]), &[data-pressed="true"]:not([data-disabled="true"]):not([data-pending="true"])':
					{
						backgroundColor: vars.color.surface.field,
						borderColor: vars.color.border.controlHover,
						boxShadow: vars.depth.recessed,
					},
			},
		},
	},
});

export const triggerPlaceholder = style({
	'@layer': {
		recipes: {
			color: vars.color.text.secondary,
			fontWeight: vars.font.weight.body,
		},
	},
});

export const triggerSlotReserve = style({
	'@layer': {
		recipes: {
			blockSize: '100%',
			inlineSize: '100%',
			minBlockSize: '2.25rem',
			pointerEvents: 'none',
			visibility: 'hidden',
		},
	},
});

export const fieldMorphHost = style({
	'@layer': {
		recipes: {
			inlineSize: '100%',
		},
	},
});

export const triggerTrack = style({
	'@layer': {
		recipes: {
			inlineSize: '100%',
			minInlineSize: 0,
			textAlign: 'start',
		},
	},
});

export const overlay = style({
	'@layer': {
		recipes: {
			backgroundColor: vars.color.overlay.backdrop,
			inset: 0,
			position: 'fixed',
			transition: overlayEnter,
			zIndex: 100,
			selectors: {
				'&[data-entering]': {
					opacity: 0,
				},
				'&[data-exiting]': {
					opacity: 0,
					pointerEvents: 'none',
					transition: overlayExit,
				},
			},
			...reducedMotionOverlay,
		},
	},
});

export const modalPassThrough = style({
	'@layer': {
		recipes: {
			backgroundColor: 'transparent',
			border: 'none',
			boxShadow: 'none',
			maxInlineSize: 'none',
			outline: 'none',
			overflow: 'visible',
			padding: 0,
		},
	},
});

export const panel = style({
	'@layer': {
		recipes: {
			color: vars.color.text.primary,
			display: 'flex',
			flexDirection: 'column',
			maxBlockSize: 'none',
			overflow: 'visible',
			position: 'fixed',
			vars: {
				[searchAnchorHeightVar]: '2.5rem',
			},
			zIndex: 101,
		},
	},
});

export const panelFieldShell = style({
	'@layer': {
		recipes: {
			backgroundColor: vars.color.surface.overlay,
			borderColor: vars.color.border.decorative,
			borderRadius: vars.radius.surface,
			borderStyle: 'solid',
			borderWidth: '1px',
			boxShadow: vars.depth.floating,
			display: 'flex',
			flexDirection: 'column',
			inlineSize: '100%',
			maxBlockSize: 'min(70dvh, 40rem)',
			minBlockSize: 0,
			overflow: 'hidden',
		},
	},
});

export const panelResultsRegion = style({
	'@layer': {
		recipes: {
			borderColor: vars.color.border.decorative,
			borderStyle: 'solid',
			borderWidth: '1px',
			display: 'flex',
			flexDirection: 'column',
			maxBlockSize: 'min(calc(70dvh - 3rem), 36rem)',
			minBlockSize: 0,
			opacity: 1,
			overflow: 'hidden',
			paddingBlockEnd: vars.space.sp8,
			transition: panelResultsEnter,
			...reducedMotionNoTransition,
		},
	},
});

// `data-entering` / `data-exiting` live on the React Aria overlay, not the plain panel div.
globalStyle(`${overlay}[data-entering] ${panelResultsRegion}`, {
	maxBlockSize: 0,
	opacity: 0,
	'@media': {
		'(prefers-reduced-motion: reduce)': {
			maxBlockSize: 'min(calc(70dvh - 3rem), 36rem)',
			opacity: 1,
			transition: 'none',
		},
	},
});

globalStyle(`${overlay}[data-exiting] ${panelResultsRegion}`, {
	maxBlockSize: 0,
	opacity: 0,
	transition: panelResultsExit,
	'@media': {
		'(prefers-reduced-motion: reduce)': {
			opacity: 1,
			transition: 'none',
		},
	},
});

export const autocomplete = style({
	'@layer': {
		recipes: {
			display: 'flex',
			flex: 1,
			flexDirection: 'column',
			minBlockSize: 0,
		},
	},
});

export const dialog = style({
	'@layer': {
		recipes: {
			display: 'flex',
			flex: 1,
			flexDirection: 'column',
			maxBlockSize: 'inherit',
			minBlockSize: 0,
			outline: 'none',
		},
	},
});

export const inputRow = style({
	'@layer': {
		recipes: {
			alignItems: 'center',
			backgroundColor: vars.color.surface.overlay,
			borderRadius: vars.radius.surface,
			display: 'flex',
			flexShrink: 0,
			minBlockSize: searchAnchorHeightVar,
			// Leaves room for the field's outset focus ring inside the panel's `overflow: hidden`.
			paddingBlock: vars.space.sp12,
			paddingInline: vars.space.sp12,
		},
	},
});

export const field = style({
	'@layer': {
		recipes: {
			inlineSize: '100%',
			minInlineSize: 0,
		},
	},
});

export const input = style({
	'@layer': {
		recipes: {
			// Hide the native WebKit clear button so the ESC keycap is the only close control.
			selectors: {
				'&::-webkit-search-cancel-button': {
					appearance: 'none',
				},
			},
		},
	},
});

export const close = style({
	'@layer': {
		recipes: {
			flexShrink: 0,
		},
	},
});

export const results = style({
	'@layer': {
		recipes: {
			flex: 1,
			minBlockSize: 0,
			overflowY: 'auto',
			padding: vars.space.sp8,
			scrollPaddingBlock: vars.space.sp8,
			selectors: {
				'&:empty': {
					padding: 0,
				},
			},
		},
	},
});

export const resultSummary = style({
	'@layer': {
		recipes: {
			paddingBlock: vars.space.sp12,
			paddingInline: vars.space.sp16,
		},
	},
});

export const result = style({
	'@layer': {
		recipes: {
			':hover': {
				backgroundColor: vars.color.background.neutral.subtle.hover,
			},
			selectors: {
				'&[data-focused]': {
					backgroundColor: vars.color.background.accent.subtle.rest,
				},
				'&[data-focus-visible]': {
					outlineColor: vars.color.border.focus,
					outlineOffset: '-2px',
					outlineStyle: 'solid',
					outlineWidth: '2px',
				},
			},
			borderRadius: vars.radius.control,
			color: vars.color.text.primary,
			display: 'flex',
			flexDirection: 'column',
			fontSize: vars.font.label.fontSize,
			gap: vars.space.sp4,
			lineHeight: vars.font.label.lineHeight,
			paddingBlock: vars.space.sp12,
			paddingInline: vars.space.sp8,
			textDecoration: 'none',
		},
	},
});

// Nested rows move their block padding inside the rule so it runs unbroken between rows.
export const nestedItem = style({
	'@layer': {
		recipes: {
			paddingBlock: 0,
		},
	},
});

export const pageTitle = style({
	'@layer': {
		recipes: {
			fontWeight: vars.font.weight.emphasis,
		},
	},
});

export const breadcrumbs = style({
	'@layer': {
		recipes: {
			alignItems: 'center',
			color: vars.color.text.secondary,
			display: 'inline-flex',
			gap: vars.space.sp4,
		},
	},
});

export const breadcrumbChevron = style({
	'@layer': {
		recipes: {
			color: vars.color.text.secondary,
			flexShrink: 0,
		},
	},
});

export const nestedResult = style({
	'@layer': {
		recipes: {
			borderInlineStart: `1px solid ${vars.color.border.decorative}`,
			marginInlineStart: vars.space.sp8,
			paddingBlock: vars.space.sp8,
			paddingInlineStart: vars.space.sp12,
		},
	},
});

export const headingHash = style({
	'@layer': {
		recipes: {
			color: vars.color.text.secondary,
			fontWeight: vars.font.weight.emphasis,
		},
	},
});

export const headingContent = style({
	'@layer': {
		recipes: {
			fontWeight: vars.font.weight.emphasis,
		},
	},
});

export const textContent = style({
	'@layer': {
		recipes: {
			color: vars.color.text.secondary,
		},
	},
});

export const highlight = style({
	'@layer': {
		recipes: {
			backgroundColor: 'transparent',
			color: vars.color.text.primary,
			textDecoration: 'underline',
			textUnderlineOffset: '0.15em',
		},
	},
});

export const empty = style({
	'@layer': {
		recipes: {
			paddingBlock: vars.space.sp24,
			paddingInline: vars.space.sp16,
			textAlign: 'center',
		},
	},
});
