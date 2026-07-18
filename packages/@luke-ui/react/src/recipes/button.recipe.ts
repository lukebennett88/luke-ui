import { defineRecipe } from '@pandacss/dev';
import type { RecipeConfig } from '@pandacss/dev';
import { focusRing } from '../styles/focus-ring.js';

type ButtonTone = 'neutral' | 'accent' | 'danger';
type ButtonSurface = Record<
	'solid' | 'solidHover' | 'solidPressed' | 'subtle' | 'subtleHover' | 'subtlePressed',
	string
>;
type ButtonCompoundVariant = NonNullable<RecipeConfig['compoundVariants']>[number];

const buttonSurfaces = {
	accent: {
		solid: 'intent.accent.surface.solid',
		solidHover: 'intent.accent.surface.solidHover',
		solidPressed: 'intent.accent.surface.solidPressed',
		subtle: 'intent.accent.surface.subtle',
		subtleHover: 'intent.accent.surface.subtleHover',
		subtlePressed: 'intent.accent.surface.subtlePressed',
	},
	danger: {
		solid: 'intent.danger.surface.solid',
		solidHover: 'intent.danger.surface.solidHover',
		solidPressed: 'intent.danger.surface.solidPressed',
		subtle: 'intent.danger.surface.subtle',
		subtleHover: 'intent.danger.surface.subtleHover',
		subtlePressed: 'intent.danger.surface.subtlePressed',
	},
	neutral: {
		solid: 'intent.neutral.surface.solid',
		solidHover: 'intent.neutral.surface.solidHover',
		solidPressed: 'intent.neutral.surface.solidPressed',
		subtle: 'intent.neutral.surface.subtle',
		subtleHover: 'intent.neutral.surface.subtleHover',
		subtlePressed: 'intent.neutral.surface.subtlePressed',
	},
} satisfies Record<ButtonTone, ButtonSurface>;

const buttonCompoundVariants = [
	appearance('neutral', 'solid', buttonSurfaces.neutral, 'intent.neutral.onSolid'),
	appearance('accent', 'solid', buttonSurfaces.accent, 'intent.accent.onSolid'),
	appearance('danger', 'solid', buttonSurfaces.danger, 'intent.danger.onSolid'),
	appearance('neutral', 'subtle', buttonSurfaces.neutral, 'text.primary'),
	appearance('accent', 'subtle', buttonSurfaces.accent, 'intent.accent.text'),
	appearance('danger', 'subtle', buttonSurfaces.danger, 'intent.danger.text'),
	ghostAppearance('neutral', buttonSurfaces.neutral, 'text.primary'),
	ghostAppearance('accent', buttonSurfaces.accent, 'intent.accent.text'),
	ghostAppearance('danger', buttonSurfaces.danger, 'intent.danger.text'),
] satisfies NonNullable<RecipeConfig['compoundVariants']>;

export const buttonRecipe = defineRecipe({
	className: 'button',
	description: 'Semantic appearance and material recipe shared by Button and IconButton.',
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
		fontFamily: 'family',
		fontWeight: 'label',
		isolation: 'isolate',
		justifyContent: 'center',
		letterSpacing: '200',
		lineHeight: '200',
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
		'&[data-focus-visible="true"]': focusRing('border.focus'),
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
				fontSize: '200',
				gap: '200',
				paddingInline: '400',
			},
			small: {
				blockSize: 'controlSize.small',
				fontSize: '100',
				gap: '100',
				letterSpacing: '100',
				lineHeight: '100',
				paddingInline: '300',
			},
		},
		tone: { accent: {}, danger: {}, neutral: {} },
	},
	compoundVariants: buttonCompoundVariants,
});

function appearance(
	tone: ButtonTone,
	appearance: 'solid' | 'subtle',
	surface: ButtonSurface,
	color: string,
): ButtonCompoundVariant {
	const prefix = appearance === 'solid' ? 'solid' : 'subtle';

	return {
		appearance,
		tone,
		css: {
			'@media (forced-colors: active)': { backgroundImage: 'none' },
			backgroundColor: surface[prefix],
			backgroundImage: 'var(--luke-action-control-finish-resting)',
			color,
			'&[data-hovered="true"]:not([data-disabled="true"]):not([data-pending="true"])': {
				backgroundColor: surface[`${prefix}Hover`],
				backgroundImage: 'var(--luke-action-control-finish-raised)',
			},
			'&[data-pressed="true"]:not([data-disabled="true"]):not([data-pending="true"])': {
				backgroundColor: surface[`${prefix}Pressed`],
				backgroundImage: 'var(--luke-action-control-finish-recessed)',
			},
		},
	};
}

function ghostAppearance(
	tone: ButtonTone,
	surface: ButtonSurface,
	color: string,
): ButtonCompoundVariant {
	return {
		appearance: 'ghost',
		tone,
		css: {
			backgroundColor: 'transparent',
			backgroundImage: 'none',
			borderColor: 'transparent',
			boxShadow: 'none',
			color,
			'&[data-hovered="true"]:not([data-disabled="true"]):not([data-pending="true"])': {
				backgroundColor: surface.subtleHover,
				boxShadow: 'raised',
			},
			'&[data-pressed="true"]:not([data-disabled="true"]):not([data-pending="true"])': {
				backgroundColor: surface.subtlePressed,
				boxShadow: 'recessed',
			},
		},
	};
}
