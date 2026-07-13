import type { RecipeVariants } from '@vanilla-extract/recipes';
import { recipeInLayer, styleInLayer } from '../styles/layered-style.css.js';
import { vars } from '../theme/contract.css.js';

const base = styleInLayer('recipes', {
	'@media': {
		'(forced-colors: active)': {
			backgroundColor: 'ButtonFace',
			borderColor: 'ButtonText',
			boxShadow: 'none',
			color: 'ButtonText',
			forcedColorAdjust: 'auto',
			selectors: {
				'&[data-focus-visible="true"]': {
					outlineColor: 'Highlight',
				},
				'&[data-disabled="true"]': {
					borderColor: 'GrayText',
					color: 'GrayText',
					opacity: 1,
				},
				'&[data-pending="true"]::after': {
					borderColor: 'ButtonText',
					borderInlineEndColor: 'transparent',
				},
			},
			transform: 'none',
		},
		'(prefers-reduced-motion: reduce)': {
			selectors: {
				'&[data-hovered="true"]:not([data-disabled="true"]):not([data-pending="true"])': {
					transform: 'none',
				},
				'&[data-pressed="true"]:not([data-disabled="true"]):not([data-pending="true"])': {
					transform: 'none',
				},
			},
		},
	},
	alignItems: 'center',
	appearance: 'none',
	borderColor: 'transparent',
	borderRadius: vars.radius.control,
	borderStyle: 'solid',
	borderWidth: '1px',
	boxShadow: vars.depth.resting,
	boxSizing: 'border-box',
	cursor: 'pointer',
	display: 'inline-flex',
	fontFamily: vars.font.family,
	fontWeight: vars.font.weight.label,
	isolation: 'isolate',
	justifyContent: 'center',
	letterSpacing: vars.font[200].letterSpacing,
	lineHeight: vars.font[200].lineHeight,
	minBlockSize: '24px',
	minInlineSize: '24px',
	outlineColor: 'transparent',
	outlineOffset: '2px',
	outlineStyle: 'solid',
	outlineWidth: '2px',
	position: 'relative',
	textDecoration: 'none',
	transform: 'translateY(0)',
	transitionDuration: vars.motion.duration.fast,
	transitionProperty: 'background-color, border-color, box-shadow, color, opacity, transform',
	transitionTimingFunction: vars.motion.easing.standard,
	whiteSpace: 'nowrap',
	selectors: {
		'&[data-disabled="true"]': {
			cursor: 'not-allowed',
			opacity: 0.55,
		},
		'&[data-focus-visible="true"]': {
			outlineColor: vars.color.border.focus,
		},
		'&[data-hovered="true"]:not([data-disabled="true"]):not([data-pending="true"])': {
			boxShadow: vars.depth.raised,
			transform: 'translateY(-1px)',
		},
		'&[data-pending="true"]': {
			cursor: 'wait',
		},
		'&[data-pressed="true"]:not([data-disabled="true"]):not([data-pending="true"])': {
			boxShadow: vars.depth.recessed,
			transform: 'translateY(1px)',
		},
	},
});

/** Semantic appearance and material recipe shared by Button and IconButton. */
export const button = recipeInLayer('recipes', {
	base,
	defaultVariants: {
		isBlock: false,
		size: 'medium',
		tone: 'accent',
		variant: 'solid',
	},
	variants: {
		isBlock: {
			false: {},
			true: { inlineSize: '100%' },
		},
		size: {
			medium: {
				blockSize: vars.controlSize.medium,
				fontSize: vars.font[200].fontSize,
				gap: vars.space[200],
				paddingInline: vars.space[400],
			},
			small: {
				blockSize: vars.controlSize.small,
				fontSize: vars.font[100].fontSize,
				gap: vars.space[100],
				letterSpacing: vars.font[100].letterSpacing,
				lineHeight: vars.font[100].lineHeight,
				paddingInline: vars.space[300],
			},
		},
		tone: {
			accent: {},
			danger: {},
			neutral: {},
		},
		variant: {
			ghost: {},
			solid: {},
			subtle: {},
		},
	},
	compoundVariants: [
		...appearance(
			'neutral',
			'solid',
			vars.color.intent.neutral.surface,
			vars.color.intent.neutral.onSolid,
		),
		...appearance(
			'accent',
			'solid',
			vars.color.intent.accent.surface,
			vars.color.intent.accent.onSolid,
		),
		...appearance(
			'danger',
			'solid',
			vars.color.intent.danger.surface,
			vars.color.intent.danger.onSolid,
		),
		...appearance('neutral', 'subtle', vars.color.intent.neutral.surface, vars.color.text.primary),
		...appearance(
			'accent',
			'subtle',
			vars.color.intent.accent.surface,
			vars.color.intent.accent.text,
		),
		...appearance(
			'danger',
			'subtle',
			vars.color.intent.danger.surface,
			vars.color.intent.danger.text,
		),
		ghostAppearance('neutral', vars.color.text.primary),
		ghostAppearance('accent', vars.color.intent.accent.text),
		ghostAppearance('danger', vars.color.intent.danger.text),
	],
});

export type ButtonVariants = RecipeVariants<typeof button>;

type Tone = 'neutral' | 'accent' | 'danger';
type Surface = {
	solid: string;
	solidHover: string;
	solidPressed: string;
	subtle: string;
	subtleHover: string;
	subtlePressed: string;
};

function appearance(tone: Tone, variant: 'solid' | 'subtle', surface: Surface, color: string) {
	const prefix = variant === 'solid' ? 'solid' : 'subtle';
	return [
		{
			style: {
				backgroundColor: surface[prefix],
				color,
				selectors: {
					'&[data-hovered="true"]:not([data-disabled="true"]):not([data-pending="true"])': {
						backgroundColor: surface[`${prefix}Hover`],
					},
					'&[data-pressed="true"]:not([data-disabled="true"]):not([data-pending="true"])': {
						backgroundColor: surface[`${prefix}Pressed`],
					},
				},
			},
			variants: { tone, variant },
		},
	];
}

function ghostAppearance(tone: Tone, color: string) {
	const surface = vars.color.intent[tone].surface;
	return {
		style: {
			backgroundColor: 'transparent',
			borderColor: 'transparent',
			boxShadow: 'none',
			color,
			selectors: {
				'&[data-hovered="true"]:not([data-disabled="true"]):not([data-pending="true"])': {
					backgroundColor: surface.subtleHover,
					boxShadow: vars.depth.raised,
				},
				'&[data-pressed="true"]:not([data-disabled="true"]):not([data-pending="true"])': {
					backgroundColor: surface.subtlePressed,
					boxShadow: vars.depth.recessed,
				},
			},
		},
		variants: { tone, variant: 'ghost' as const },
	};
}
