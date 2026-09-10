import { vars } from '../../../theme/contract.css.js';
import { FONT_METRIC_SCALE } from '../../../theme/font-metric-scale.js';
import { recipe } from '../../styles/recipe.js';

/** Shared presentation recipe for Button and button-shaped Link. */
export const buttonRecipeInternal = recipe({
	base: {
		'@media': {
			'(prefers-reduced-motion: reduce)': {
				transition: 'none',
			},
		},
		font: 'inherit',
		transitionDuration: vars.motion.duration.feedback,
		transitionProperty:
			'background-color, border-color, box-shadow, color, opacity, text-decoration-color, transform',
		transitionTimingFunction: vars.motion.easing.standard,
		selectors: {
			'&[data-disabled="true"]': {
				cursor: 'not-allowed',
				opacity: vars.interaction.disabledOpacity,
			},
		},
	},
	defaultVariants: {
		appearance: 'button',
		isBlock: false,
		prominence: 'standard',
		size: 'medium',
		tone: 'neutral',
	},
	variants: {
		appearance: {
			button: {
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
				whiteSpace: 'nowrap',
				selectors: {
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
			},
			text: {
				'@media': {
					'(forced-colors: active)': {
						color: 'LinkText',
						forcedColorAdjust: 'auto',
						selectors: {
							'&[data-disabled="true"]': {
								color: 'GrayText',
								opacity: 1,
							},
						},
					},
				},
				textDecorationColor: 'currentColor',
			},
		},
		isBlock: {
			false: {},
			true: { inlineSize: '100%' },
		},
		prominence: {
			low: {},
			standard: {},
			high: {},
		},
		size: {
			medium: {},
			small: {},
		},
		tone: {
			critical: {},
			neutral: {},
		},
	},
	compoundVariants: [
		buttonSize('medium'),
		buttonSize('small'),
		...buttonAppearance('neutral', 'low', 'ghost', vars.color.text.primary),
		...buttonAppearance('neutral', 'standard', 'subtle', vars.color.text.primary),
		...buttonAppearance('neutral', 'high', 'solid', vars.color.foreground.accent.onSolid, 'accent'),
		...buttonAppearance('critical', 'low', 'ghost', vars.color.foreground.danger.rest),
		...buttonAppearance('critical', 'standard', 'subtle', vars.color.foreground.danger.rest),
		...buttonAppearance('critical', 'high', 'solid', vars.color.foreground.danger.onSolid),
		...textAppearance('neutral', 'low'),
		...textAppearance('neutral', 'standard'),
		...textAppearance('neutral', 'high'),
		...textAppearance('critical', 'low'),
		...textAppearance('critical', 'standard'),
	],
});

type Tone = 'neutral' | 'critical';
type BackgroundTone = Tone | 'accent';
type ButtonSurface = 'ghost' | 'subtle' | 'solid';
type Background = (typeof vars.color.background)['neutral'];

function buttonAppearance(
	tone: Tone,
	prominence: 'low' | 'standard' | 'high',
	surface: ButtonSurface,
	color: string,
	backgroundTone: BackgroundTone = tone,
) {
	if (surface === 'ghost') {
		const subtle = backgroundForTone(tone).subtle;
		return [
			{
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
				variants: { appearance: 'button' as const, prominence, tone },
			},
		];
	}

	const ramp = backgroundForTone(surface === 'subtle' ? 'neutral' : backgroundTone)[surface];
	const isSolid = surface === 'solid';
	return [
		{
			style: {
				'@media': {
					'(forced-colors: active)': { backgroundImage: 'none' },
				},
				backgroundColor: ramp.rest,
				backgroundImage: isSolid ? vars.actionControlFinish.resting : 'none',
				color,
				selectors: {
					'&[data-hovered="true"]:not([data-disabled="true"]):not([data-pending="true"])': {
						backgroundColor: ramp.hover,
						backgroundImage: isSolid ? vars.actionControlFinish.raised : 'none',
					},
					'&[data-pressed="true"]:not([data-disabled="true"]):not([data-pending="true"])': {
						backgroundColor: ramp.pressed,
						backgroundImage: isSolid ? vars.actionControlFinish.recessed : 'none',
					},
				},
			},
			variants: { appearance: 'button' as const, prominence, tone },
		},
	];
}

function buttonSize(size: 'medium' | 'small') {
	return {
		style:
			size === 'medium'
				? {
						blockSize: vars.controlSize.medium,
						fontSize: FONT_METRIC_SCALE[14].fontSize,
						gap: vars.space.sp8,
						paddingInline: vars.space.sp16,
					}
				: {
						blockSize: vars.controlSize.small,
						fontSize: FONT_METRIC_SCALE[12].fontSize,
						gap: vars.space.sp4,
						letterSpacing: FONT_METRIC_SCALE[12].letterSpacing,
						lineHeight: FONT_METRIC_SCALE[12].lineHeight,
						paddingInline: vars.space.sp12,
					},
		variants: { appearance: 'button' as const, size },
	};
}

function textAppearance(tone: Tone, prominence: 'low' | 'standard' | 'high') {
	const foreground =
		tone === 'critical'
			? vars.color.foreground.danger
			: prominence === 'high'
				? vars.color.foreground.accent
				: vars.color.foreground.neutral;
	return [
		{
			style: {
				color: foreground.rest,
				selectors: {
					'&[data-hovered="true"]:not([data-disabled="true"])': {
						color: foreground.hover,
						textDecoration: 'underline',
					},
					'&[data-focus-visible="true"]:not([data-disabled="true"])': {
						textDecoration: 'underline',
					},
					'&[data-pressed="true"]:not([data-disabled="true"])': {
						color: foreground.pressed,
						textDecoration: 'underline',
					},
				},
				textDecoration: prominence === 'low' ? 'none' : 'underline',
			},
			variants: { appearance: 'text' as const, prominence, tone },
		},
	];
}

function backgroundForTone(tone: BackgroundTone): Background {
	return tone === 'critical' ? vars.color.background.danger : vars.color.background[tone];
}
