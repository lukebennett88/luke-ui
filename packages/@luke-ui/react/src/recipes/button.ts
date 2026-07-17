import { cva } from '../../styled-system/css/index.mjs';
import type {
	RecipeRuntimeFn,
	RecipeVariantProps,
} from '../../styled-system/types/recipe.d.ts';
import { token } from '../../styled-system/tokens/index.mjs';

type ButtonVariantRecord = {
	appearance: { ghost: {}; solid: {}; subtle: {} };
	isBlock: { false: {}; true: {} };
	size: { medium: {}; small: {} };
	tone: { accent: {}; danger: {}; neutral: {} };
};

/** Semantic appearance and material recipe shared by Button and IconButton. */
export const button = cva({
	base: {
		'@media (forced-colors: active)': {
			backgroundColor: 'ButtonFace',
			backgroundImage: 'none',
			borderColor: 'ButtonText',
			boxShadow: 'none',
			color: 'ButtonText',
			forcedColorAdjust: 'auto',
			transform: 'none',
			'&[data-focus-visible="true"]': { outlineColor: 'Highlight' },
			'&[data-disabled="true"]': { borderColor: 'GrayText', color: 'GrayText', opacity: 1 },
			'&[data-pending="true"]::after': {
				borderColor: 'ButtonText',
				borderInlineEndColor: 'transparent',
			},
			'&[data-pending="true"]': { opacity: 1 },
		},
		'@media (prefers-reduced-motion: reduce)': {
			'&[data-hovered="true"]:not([data-disabled="true"]):not([data-pending="true"])': {
				transform: 'none',
			},
			'&[data-pressed="true"]:not([data-disabled="true"]):not([data-pending="true"])': {
				transform: 'none',
			},
		},
		alignItems: 'center',
		appearance: 'none',
		borderColor: 'transparent',
		borderRadius: 'control',
		borderStyle: 'solid',
		borderWidth: '1px',
		boxShadow: 'resting',
		boxSizing: 'border-box',
		cursor: 'pointer',
		display: 'inline-flex',
		fontFamily: 'var(--luke-font-family)',
		fontWeight: 'label',
		isolation: 'isolate',
		justifyContent: 'center',
		letterSpacing: 'var(--luke-font-200-letter-spacing)',
		lineHeight: 'var(--luke-font-200-line-height)',
		minBlockSize: '24px',
		minInlineSize: '24px',
		outlineColor: 'transparent',
		outlineOffset: '2px',
		outlineStyle: 'solid',
		outlineWidth: '2px',
		position: 'relative',
		textDecoration: 'none',
		transform: 'translateY(0)',
		transitionDuration: 'fast',
		transitionProperty: 'background-color, border-color, box-shadow, color, opacity, transform',
		transitionTimingFunction: 'standard',
		whiteSpace: 'nowrap',
		'&[data-disabled="true"]': { cursor: 'not-allowed', opacity: 0.55 },
		'&[data-focus-visible="true"]': {
			outlineColor: token('colors.border.focus'),
			outlineOffset: '2px',
			outlineStyle: 'solid',
			outlineWidth: '2px',
		},
		'&[data-hovered="true"]:not([data-disabled="true"]):not([data-pending="true"])': {
			boxShadow: 'raised',
			transform: 'translateY(-1px)',
		},
		'&[data-pending="true"]': { cursor: 'wait', opacity: 0.55 },
		'&[data-pressed="true"]:not([data-disabled="true"]):not([data-pending="true"])': {
			boxShadow: 'recessed',
			transform: 'translateY(1px)',
		},
	},
	defaultVariants: { appearance: 'solid', isBlock: false, size: 'medium', tone: 'neutral' },
	variants: {
		appearance: { ghost: {}, solid: {}, subtle: {} },
		isBlock: { false: {}, true: { inlineSize: '100%' } },
		size: {
			medium: {
				blockSize: 'controlSize.medium',
				fontSize: 'var(--luke-font-200-font-size)',
				gap: '200',
				paddingInline: '400',
			},
			small: {
				blockSize: 'controlSize.small',
				fontSize: 'var(--luke-font-100-font-size)',
				gap: '100',
				letterSpacing: 'var(--luke-font-100-letter-spacing)',
				lineHeight: 'var(--luke-font-100-line-height)',
				paddingInline: '300',
			},
		},
		tone: { accent: {}, danger: {}, neutral: {} },
	},
	compoundVariants: [
		{
			appearance: 'solid',
			tone: 'neutral',
			css: {
				'@media (forced-colors: active)': { backgroundImage: 'none' },
				backgroundColor: 'intent.neutral.surface.solid',
				backgroundImage: 'var(--luke-action-control-finish-resting)',
				color: 'intent.neutral.onSolid',
				'&[data-hovered="true"]:not([data-disabled="true"]):not([data-pending="true"])': {
					backgroundColor: 'intent.neutral.surface.solidHover',
					backgroundImage: 'var(--luke-action-control-finish-raised)',
				},
				'&[data-pressed="true"]:not([data-disabled="true"]):not([data-pending="true"])': {
					backgroundColor: 'intent.neutral.surface.solidPressed',
					backgroundImage: 'var(--luke-action-control-finish-recessed)',
				},
			},
		},
		{
			appearance: 'solid',
			tone: 'accent',
			css: {
				'@media (forced-colors: active)': { backgroundImage: 'none' },
				backgroundColor: 'intent.accent.surface.solid',
				backgroundImage: 'var(--luke-action-control-finish-resting)',
				color: 'intent.accent.onSolid',
				'&[data-hovered="true"]:not([data-disabled="true"]):not([data-pending="true"])': {
					backgroundColor: 'intent.accent.surface.solidHover',
					backgroundImage: 'var(--luke-action-control-finish-raised)',
				},
				'&[data-pressed="true"]:not([data-disabled="true"]):not([data-pending="true"])': {
					backgroundColor: 'intent.accent.surface.solidPressed',
					backgroundImage: 'var(--luke-action-control-finish-recessed)',
				},
			},
		},
		{
			appearance: 'solid',
			tone: 'danger',
			css: {
				'@media (forced-colors: active)': { backgroundImage: 'none' },
				backgroundColor: 'intent.danger.surface.solid',
				backgroundImage: 'var(--luke-action-control-finish-resting)',
				color: 'intent.danger.onSolid',
				'&[data-hovered="true"]:not([data-disabled="true"]):not([data-pending="true"])': {
					backgroundColor: 'intent.danger.surface.solidHover',
					backgroundImage: 'var(--luke-action-control-finish-raised)',
				},
				'&[data-pressed="true"]:not([data-disabled="true"]):not([data-pending="true"])': {
					backgroundColor: 'intent.danger.surface.solidPressed',
					backgroundImage: 'var(--luke-action-control-finish-recessed)',
				},
			},
		},
		{
			appearance: 'subtle',
			tone: 'neutral',
			css: {
				'@media (forced-colors: active)': { backgroundImage: 'none' },
				backgroundColor: 'intent.neutral.surface.subtle',
				backgroundImage: 'var(--luke-action-control-finish-resting)',
				color: 'text.primary',
				'&[data-hovered="true"]:not([data-disabled="true"]):not([data-pending="true"])': {
					backgroundColor: 'intent.neutral.surface.subtleHover',
					backgroundImage: 'var(--luke-action-control-finish-raised)',
				},
				'&[data-pressed="true"]:not([data-disabled="true"]):not([data-pending="true"])': {
					backgroundColor: 'intent.neutral.surface.subtlePressed',
					backgroundImage: 'var(--luke-action-control-finish-recessed)',
				},
			},
		},
		{
			appearance: 'subtle',
			tone: 'accent',
			css: {
				'@media (forced-colors: active)': { backgroundImage: 'none' },
				backgroundColor: 'intent.accent.surface.subtle',
				backgroundImage: 'var(--luke-action-control-finish-resting)',
				color: 'intent.accent.text',
				'&[data-hovered="true"]:not([data-disabled="true"]):not([data-pending="true"])': {
					backgroundColor: 'intent.accent.surface.subtleHover',
					backgroundImage: 'var(--luke-action-control-finish-raised)',
				},
				'&[data-pressed="true"]:not([data-disabled="true"]):not([data-pending="true"])': {
					backgroundColor: 'intent.accent.surface.subtlePressed',
					backgroundImage: 'var(--luke-action-control-finish-recessed)',
				},
			},
		},
		{
			appearance: 'subtle',
			tone: 'danger',
			css: {
				'@media (forced-colors: active)': { backgroundImage: 'none' },
				backgroundColor: 'intent.danger.surface.subtle',
				backgroundImage: 'var(--luke-action-control-finish-resting)',
				color: 'intent.danger.text',
				'&[data-hovered="true"]:not([data-disabled="true"]):not([data-pending="true"])': {
					backgroundColor: 'intent.danger.surface.subtleHover',
					backgroundImage: 'var(--luke-action-control-finish-raised)',
				},
				'&[data-pressed="true"]:not([data-disabled="true"]):not([data-pending="true"])': {
					backgroundColor: 'intent.danger.surface.subtlePressed',
					backgroundImage: 'var(--luke-action-control-finish-recessed)',
				},
			},
		},
		{
			appearance: 'ghost',
			tone: 'neutral',
			css: {
				backgroundColor: 'transparent',
				backgroundImage: 'none',
				borderColor: 'transparent',
				boxShadow: 'none',
				color: 'text.primary',
				'&[data-hovered="true"]:not([data-disabled="true"]):not([data-pending="true"])': {
					backgroundColor: 'intent.neutral.surface.subtleHover',
					boxShadow: 'raised',
				},
				'&[data-pressed="true"]:not([data-disabled="true"]):not([data-pending="true"])': {
					backgroundColor: 'intent.neutral.surface.subtlePressed',
					boxShadow: 'recessed',
				},
			},
		},
		{
			appearance: 'ghost',
			tone: 'accent',
			css: {
				backgroundColor: 'transparent',
				backgroundImage: 'none',
				borderColor: 'transparent',
				boxShadow: 'none',
				color: 'intent.accent.text',
				'&[data-hovered="true"]:not([data-disabled="true"]):not([data-pending="true"])': {
					backgroundColor: 'intent.accent.surface.subtleHover',
					boxShadow: 'raised',
				},
				'&[data-pressed="true"]:not([data-disabled="true"]):not([data-pending="true"])': {
					backgroundColor: 'intent.accent.surface.subtlePressed',
					boxShadow: 'recessed',
				},
			},
		},
		{
			appearance: 'ghost',
			tone: 'danger',
			css: {
				backgroundColor: 'transparent',
				backgroundImage: 'none',
				borderColor: 'transparent',
				boxShadow: 'none',
				color: 'intent.danger.text',
				'&[data-hovered="true"]:not([data-disabled="true"]):not([data-pending="true"])': {
					backgroundColor: 'intent.danger.surface.subtleHover',
					boxShadow: 'raised',
				},
				'&[data-pressed="true"]:not([data-disabled="true"]):not([data-pending="true"])': {
					backgroundColor: 'intent.danger.surface.subtlePressed',
					boxShadow: 'recessed',
				},
			},
		},
	],
}) as unknown as RecipeRuntimeFn<ButtonVariantRecord>;

export type ButtonVariants = RecipeVariantProps<typeof button>;
