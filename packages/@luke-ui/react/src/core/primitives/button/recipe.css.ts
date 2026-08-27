import { vars } from '../../../theme/contract.css.js';
import { FONT_METRIC_SCALE } from '../../../theme/font-metric-scale.js';
import { styleInLayer } from '../../styles/layered-style.css.js';
import type { RecipeSelection } from '../../styles/recipe.js';
import { recipe } from '../../styles/recipe.js';

const base = styleInLayer('recipes', {
	'@media': {
		'(forced-colors: active)': {
			backgroundColor: 'ButtonFace',
			backgroundImage: 'none',
			borderColor: 'ButtonText',
			boxShadow: 'none',
			color: 'ButtonText',
			forcedColorAdjust: 'auto',
			selectors: {
				'&[data-disabled="true"]': {
					borderColor: 'GrayText',
					color: 'GrayText',
					opacity: 1,
				},
				'&[data-pending="true"]::after': {
					borderColor: 'ButtonText',
					borderInlineEndColor: 'transparent',
				},
				'&[data-pending="true"]': {
					opacity: 1,
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
	cursor: 'default',
	display: 'inline-flex',
	fontFamily: vars.font.family.body,
	fontWeight: vars.font.weight.label,
	isolation: 'isolate',
	justifyContent: 'center',
	letterSpacing: FONT_METRIC_SCALE[14].letterSpacing,
	lineHeight: FONT_METRIC_SCALE[14].lineHeight,
	minBlockSize: vars.controlSize.minTarget,
	minInlineSize: vars.controlSize.minTarget,
	position: 'relative',
	textDecoration: 'none',
	transform: 'translateY(0)',
	transitionDuration: vars.motion.duration.feedback,
	transitionProperty: 'background-color, border-color, box-shadow, color, opacity, transform',
	transitionTimingFunction: vars.motion.easing.standard,
	whiteSpace: 'nowrap',
	selectors: {
		'&[data-disabled="true"]': {
			cursor: 'not-allowed',
			opacity: vars.interaction.disabledOpacity,
		},
		'&[data-hovered="true"]:not([data-disabled="true"]):not([data-pending="true"])': {
			boxShadow: vars.depth.raised,
			transform: 'translateY(-1px)',
		},
		'&[data-pending="true"]': {
			cursor: 'wait',
			opacity: vars.interaction.disabledOpacity,
		},
		'&[data-pressed="true"]:not([data-disabled="true"]):not([data-pending="true"])': {
			boxShadow: vars.depth.recessed,
			transform: 'translateY(1px)',
		},
	},
});

/** Semantic appearance and material recipe shared by Button and IconButton. */
export const buttonRecipe = recipe({
	base,
	defaultVariants: {
		appearance: 'solid',
		isBlock: false,
		size: 'medium',
		tone: 'neutral',
	},
	variants: {
		appearance: {
			ghost: {},
			solid: {},
			subtle: {},
		},
		isBlock: {
			false: {},
			true: { inlineSize: '100%' },
		},
		size: {
			medium: {
				blockSize: vars.controlSize.medium,
				fontSize: FONT_METRIC_SCALE[14].fontSize,
				gap: vars.space.sp8,
				paddingInline: vars.space.sp16,
			},
			small: {
				blockSize: vars.controlSize.small,
				fontSize: FONT_METRIC_SCALE[12].fontSize,
				gap: vars.space.sp4,
				letterSpacing: FONT_METRIC_SCALE[12].letterSpacing,
				lineHeight: FONT_METRIC_SCALE[12].lineHeight,
				paddingInline: vars.space.sp12,
			},
		},
		tone: {
			accent: {},
			danger: {},
			neutral: {},
		},
	},
	compoundVariants: [
		...appearance(
			'neutral',
			'solid',
			vars.color.background.neutral,
			vars.color.foreground.neutral.onSolid,
		),
		...appearance(
			'accent',
			'solid',
			vars.color.background.accent,
			vars.color.foreground.accent.onSolid,
		),
		...appearance(
			'danger',
			'solid',
			vars.color.background.danger,
			vars.color.foreground.danger.onSolid,
		),
		...appearance('neutral', 'subtle', vars.color.background.neutral, vars.color.text.primary),
		...appearance(
			'accent',
			'subtle',
			vars.color.background.accent,
			vars.color.foreground.accent.rest,
		),
		...appearance(
			'danger',
			'subtle',
			vars.color.background.danger,
			vars.color.foreground.danger.rest,
		),
		ghostAppearance('neutral', vars.color.text.primary),
		ghostAppearance('accent', vars.color.foreground.accent.rest),
		ghostAppearance('danger', vars.color.foreground.danger.rest),
	],
});

export type ButtonRecipeVariants = RecipeSelection<typeof buttonRecipe>;

type Tone = 'neutral' | 'accent' | 'danger';
/** The subtle/solid background ramp shape shared by every semantic role. */
type Background = (typeof vars.color.background)[Tone];

function appearance(
	tone: Tone,
	appearance: 'solid' | 'subtle',
	background: Background,
	color: string,
) {
	const ramp = background[appearance];
	return [
		{
			style: {
				'@media': {
					'(forced-colors: active)': { backgroundImage: 'none' },
				},
				backgroundColor: ramp.rest,
				backgroundImage: vars.actionControlFinish.resting,
				color,
				selectors: {
					'&[data-hovered="true"]:not([data-disabled="true"]):not([data-pending="true"])': {
						backgroundColor: ramp.hover,
						backgroundImage: vars.actionControlFinish.raised,
					},
					'&[data-pressed="true"]:not([data-disabled="true"]):not([data-pending="true"])': {
						backgroundColor: ramp.pressed,
						backgroundImage: vars.actionControlFinish.recessed,
					},
				},
			},
			variants: { appearance, tone },
		},
	];
}

function ghostAppearance(tone: Tone, color: string) {
	const subtle = vars.color.background[tone].subtle;
	return {
		style: {
			backgroundColor: 'transparent',
			backgroundImage: 'none',
			borderColor: 'transparent',
			boxShadow: 'none',
			color,
			selectors: {
				'&[data-hovered="true"]:not([data-disabled="true"]):not([data-pending="true"])': {
					backgroundColor: subtle.hover,
					boxShadow: vars.depth.raised,
				},
				'&[data-pressed="true"]:not([data-disabled="true"]):not([data-pending="true"])': {
					backgroundColor: subtle.pressed,
					boxShadow: vars.depth.recessed,
				},
			},
		},
		variants: { appearance: 'ghost' as const, tone },
	};
}
