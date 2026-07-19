import { keyframes } from '@vanilla-extract/css';
import type { RecipeVariants } from '@vanilla-extract/recipes';
import { recipeInLayer } from '../styles/layered-style.css.js';
import { vars } from '../theme/contract.css.js';

const overlayIn = keyframes({
	from: { opacity: 0 },
	to: { opacity: 1 },
});

const overlayOut = keyframes({
	from: { opacity: 1 },
	to: { opacity: 0 },
});

const contentIn = keyframes({
	'0%': { opacity: 0, transform: 'translate(-50%, -50%) scale(0.95)' },
	'100%': { opacity: 1, transform: 'translate(-50%, -50%) scale(1)' },
});

const contentOut = keyframes({
	'0%': { opacity: 1, transform: 'translate(-50%, -50%) scale(1)' },
	'100%': { opacity: 0, transform: 'translate(-50%, -50%) scale(0.95)' },
});

export const dialogOverlay = recipeInLayer('recipes', {
	base: {
		'@media': {
			'(prefers-reduced-motion: reduce)': {
				selectors: {
					'&[data-entering]': { animation: 'none' },
					'&[data-exiting]': { animation: 'none' },
				},
			},
		},
		backgroundColor: 'rgb(0 0 0 / 0.8)',
		inset: 0,
		isolation: 'isolate',
		position: 'fixed',
		selectors: {
			'&[data-entering]': { animation: `${overlayIn} 100ms ease-out` },
			'&[data-exiting]': { animation: `${overlayOut} 100ms ease-in` },
		},
		zIndex: 50,
	},
});

export const dialogContent = recipeInLayer('recipes', {
	base: {
		'@media': {
			'(prefers-reduced-motion: reduce)': {
				selectors: {
					'&[data-entering]': { animation: 'none' },
					'&[data-exiting]': { animation: 'none' },
				},
			},
			'(min-width: 640px)': {
				maxWidth: '28rem',
			},
		},
		'@supports': {
			'(backdrop-filter: blur(4px))': {
				backdropFilter: 'blur(4px)',
			},
		},
		backgroundColor: vars.color.surface.floating,
		borderRadius: vars.radius.overlay,
		border: `1px solid ${vars.color.border.decorative}`,
		boxShadow: vars.depth.overlay,
		color: vars.color.text.primary,
		display: 'grid',
		gap: vars.space[600],
		left: '50%',
		maxWidth: 'calc(100% - 2rem)',
		outline: 'none',
		padding: vars.space[600],
		position: 'fixed',
		selectors: {
			'&[data-entering]': { animation: `${contentIn} 100ms ease-out` },
			'&[data-exiting]': { animation: `${contentOut} 100ms ease-in` },
		},
		top: '50%',
		transform: 'translate(-50%, -50%)',
		width: '100%',
		zIndex: 50,
	},
});

export const dialog = recipeInLayer('recipes', {
	base: {
		display: 'inherit',
		gap: 'inherit',
		outline: 'none',
	},
});

export const dialogHeader = recipeInLayer('recipes', {
	base: {
		display: 'flex',
		flexDirection: 'column',
		gap: vars.space[200],
	},
});

export const dialogFooter = recipeInLayer('recipes', {
	base: {
		'@media': {
			'(min-width: 640px)': {
				flexDirection: 'row',
				justifyContent: 'flex-end',
			},
		},
		display: 'flex',
		flexDirection: 'column-reverse',
		gap: vars.space[200],
	},
});

export const dialogTitle = recipeInLayer('recipes', {
	base: {
		fontFamily: vars.font.family,
		fontSize: vars.font[400].fontSize,
		fontWeight: vars.font.weight.heading,
		lineHeight: 1,
		margin: 0,
	},
});

export const dialogDescription = recipeInLayer('recipes', {
	base: {
		color: vars.color.text.secondary,
		fontSize: vars.font[200].fontSize,
	},
});

const closeButtonReset = {
	alignItems: 'center',
	appearance: 'none',
	background: 'none',
	border: 'none',
	color: 'inherit',
	cursor: 'pointer',
	display: 'inline-flex',
	font: 'inherit',
	justifyContent: 'center',
	outline: 'none',
	padding: 0,
} as const;

export const dialogCloseButton = recipeInLayer('recipes', {
	base: {
		...closeButtonReset,
		blockSize: vars.controlSize.small,
		inlineSize: vars.controlSize.small,
		position: 'absolute',
		insetBlockStart: vars.space[400],
		insetInlineEnd: vars.space[400],
		borderRadius: vars.radius.control,
		selectors: {
			'&[data-hovered="true"]': {
				backgroundColor: vars.color.intent.neutral.surface.subtleHover,
			},
			'&[data-focus-visible="true"]': {
				outline: `2px solid ${vars.color.border.focus}`,
				outlineOffset: '2px',
			},
		},
	},
});

export type DialogOverlayVariants = RecipeVariants<typeof dialogOverlay>;
export type DialogContentVariants = RecipeVariants<typeof dialogContent>;
export type DialogVariants = RecipeVariants<typeof dialog>;
export type DialogCloseButtonVariants = RecipeVariants<typeof dialogCloseButton>;
export type DialogHeaderVariants = RecipeVariants<typeof dialogHeader>;
export type DialogFooterVariants = RecipeVariants<typeof dialogFooter>;
export type DialogTitleVariants = RecipeVariants<typeof dialogTitle>;
export type DialogDescriptionVariants = RecipeVariants<typeof dialogDescription>;
