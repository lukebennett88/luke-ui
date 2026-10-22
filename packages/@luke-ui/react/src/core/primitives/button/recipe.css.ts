import { vars } from '../../../theme/contract.css.js';
import { FONT_METRIC_SCALE } from '../../../theme/font-metric-scale.js';
import { MIN_TARGET_SIZE } from '../../sizing/control-size.js';
import { style } from '../../styles/layered-style.css.js';
import { pressFeedback } from '../../styles/press-feedback.js';
import { recipe } from '../../styles/recipe.js';
import { contextualForeground, surfaceStyle } from '../../styles/surface.js';
import { textRecipe } from '../../text/recipe.css.js';
import { textActionAppearance, textLinkAppearance } from './text-action-appearance.js';

export const actionElementClassName = style({}, 'action');

const enabled = ':not([data-disabled="true"]):not([data-pending="true"])';
const hovered = `&[data-hovered="true"]${enabled}`;
const pressed = `&[data-pressed="true"]${enabled}`;

/** Shared presentation recipe for Button and button-shaped Link. */
export const buttonRecipeInternal = recipe({
	base: [
		actionElementClassName,
		{
			font: 'inherit',
			...pressFeedback,
			transitionDuration: vars.motion.feedback.duration,
			transitionProperty:
				'background-color, border-color, box-shadow, color, opacity, text-decoration-color',
			transitionTimingFunction: vars.motion.feedback.easing,
			selectors: {
				'&[data-disabled="true"]': {
					cursor: 'not-allowed',
					opacity: vars.interaction.disabledOpacity,
				},
			},
		},
	],
	defaultVariants: {
		appearance: 'button',
		inlineSize: 'auto',
		kind: 'action',
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
						borderWidth: '1px',
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
					},
				},
				alignItems: 'center',
				appearance: 'none',
				// No border outside forced colours: inset depth and the face finish would leave an
				// unshaded rim inside even a transparent one. The size padding makes up its width.
				borderColor: 'transparent',
				borderRadius: vars.radius.control,
				borderStyle: 'solid',
				borderWidth: 0,
				boxShadow: vars.depth.resting,
				display: 'inline-flex',
				fontFamily: vars.font.family.body,
				fontWeight: vars.font.weight.label,
				isolation: 'isolate',
				justifyContent: 'center',
				letterSpacing: FONT_METRIC_SCALE[14].letterSpacing,
				lineHeight: FONT_METRIC_SCALE[14].lineHeight,
				minBlockSize: MIN_TARGET_SIZE,
				minInlineSize: MIN_TARGET_SIZE,
				// `buttonSize()` sets the inline padding. A native `<button>` has block padding too.
				paddingBlock: 0,
				position: 'relative',
				textDecoration: 'none',
				whiteSpace: 'nowrap',
				// Hover and pressed change colour, depth, and finish, never position or scale.
				selectors: {
					'&[data-hovered="true"]:not([data-disabled="true"]):not([data-pending="true"])': {
						boxShadow: vars.depth.raised,
					},
					'&[data-pending="true"]': {
						cursor: 'wait',
					},
					'&[data-pressed="true"]:not([data-disabled="true"]):not([data-pending="true"])': {
						boxShadow: vars.depth.recessed,
					},
				},
			},
			text: [
				textRecipe({ shouldDisableTrim: true, shouldInheritFont: true }),
				{
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
					appearance: 'none',
					backgroundColor: 'transparent',
					backgroundImage: 'none',
					border: 0,
					borderRadius: 0,
					boxShadow: 'none',
					// `inline`, not `inline-block`: a text Link must break across lines mid-label inside a
					// paragraph. A native `<button>` computes `inline-block` either way, so Button is
					// unaffected.
					display: 'inline',
					minBlockSize: 0,
					padding: 0,
					position: 'relative',
					textAlign: 'start',
					textDecorationColor: 'currentColor',
					verticalAlign: 'baseline',
				},
			],
		},
		inlineSize: {
			auto: {},
			full: { inlineSize: '100%' },
		},
		// Private. Link sets `link` for its text weight and decoration.
		kind: {
			action: {},
			link: {},
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
		{
			// Undoes `textRecipe`'s `minInlineSize: 0`, which lets a grid or flex parent collapse the
			// button to one character per line. Must be a compound variant: `textRecipe`'s base and
			// this recipe's variants emit into separate same-named `recipes` layer blocks, so only a
			// style from this recipe's own call reliably lands last.
			style: { minInlineSize: 'auto' },
			variants: { appearance: 'text' as const },
		},
		...buttonAppearance('neutral', 'low', 'ghost'),
		...buttonAppearance('neutral', 'standard', 'subtle'),
		...buttonAppearance('neutral', 'high', 'solid', 'accent'),
		...buttonAppearance('critical', 'low', 'ghost'),
		...buttonAppearance('critical', 'standard', 'subtle'),
		...buttonAppearance('critical', 'high', 'solid'),
		...textAppearance('action', 'neutral', 'low'),
		...textAppearance('action', 'neutral', 'standard'),
		...textAppearance('action', 'neutral', 'high'),
		...textAppearance('action', 'critical', 'low'),
		...textAppearance('action', 'critical', 'standard'),
		...textAppearance('link', 'neutral', 'low'),
		...textAppearance('link', 'neutral', 'standard'),
		...textAppearance('link', 'neutral', 'high'),
	],
});

type Tone = 'neutral' | 'critical';
type BackgroundTone = 'neutral' | 'danger' | 'accent';
type ButtonSurface = 'ghost' | 'subtle' | 'solid';

/**
 * A button's fill in each interaction state, paired with its foreground context through
 * `surfaceStyle`. A ghost paints nothing at rest, so it reads the surrounding context, and its hover
 * and pressed fills establish a subtle one. A critical tone keeps the danger hue on a subtle fill or
 * a surrounding surface, and reads on-solid primary on a solid one.
 */
function buttonAppearance(
	tone: Tone,
	prominence: 'low' | 'standard' | 'high',
	surface: ButtonSurface,
	backgroundTone: BackgroundTone = tone === 'critical' ? 'danger' : 'neutral',
) {
	const toneColor = tone === 'critical' ? { color: contextualForeground('danger') } : ({} as const);

	if (surface === 'ghost') {
		return [
			{
				style: {
					backgroundColor: 'transparent',
					backgroundImage: 'none',
					borderColor: 'transparent',
					boxShadow: 'none',
					color: contextualForeground('primary'),
					...toneColor,
					selectors: {
						[hovered]: {
							...surfaceStyle(`${backgroundTone}.subtle.hover`),
							...toneColor,
							boxShadow: vars.depth.raised,
						},
						[pressed]: {
							...surfaceStyle(`${backgroundTone}.subtle.pressed`),
							...toneColor,
							boxShadow: vars.depth.recessed,
						},
					},
				},
				variants: { appearance: 'button' as const, prominence, tone },
			},
		];
	}

	// A subtle button always uses the neutral fill; only its text takes the tone.
	const fill = surface === 'subtle' ? 'neutral' : backgroundTone;
	const isSolid = surface === 'solid';
	return [
		{
			style: {
				'@media': {
					'(forced-colors: active)': { backgroundImage: 'none' },
				},
				...surfaceStyle(`${fill}.${surface}.rest`),
				...toneColor,
				backgroundImage: isSolid ? vars.controlFinish.resting : 'none',
				selectors: {
					[hovered]: {
						...surfaceStyle(`${fill}.${surface}.hover`),
						...toneColor,
						backgroundImage: isSolid ? vars.controlFinish.raised : 'none',
					},
					[pressed]: {
						...surfaceStyle(`${fill}.${surface}.pressed`),
						...toneColor,
						backgroundImage: isSolid ? vars.controlFinish.recessed : 'none',
					},
				},
			},
			variants: { appearance: 'button' as const, prominence, tone },
		},
	];
}

function buttonSize(size: 'medium' | 'small') {
	const paddingInline = size === 'medium' ? vars.space['16'] : vars.space['12'];
	// The extra 1px replaces the border. Forced colours draws the border, so it uses the plain padding.
	const inset = {
		'@media': {
			'(forced-colors: active)': { paddingInline },
		},
		paddingInline: `calc(${paddingInline} + 1px)`,
	};
	return {
		style:
			size === 'medium'
				? {
						...inset,
						blockSize: vars.controlSize.px40,
						fontSize: FONT_METRIC_SCALE[14].fontSize,
						gap: vars.space['8'],
					}
				: {
						...inset,
						blockSize: vars.controlSize.px32,
						fontSize: FONT_METRIC_SCALE[12].fontSize,
						gap: vars.space['4'],
						letterSpacing: FONT_METRIC_SCALE[12].letterSpacing,
						lineHeight: FONT_METRIC_SCALE[12].lineHeight,
					},
		variants: { appearance: 'button' as const, size },
	};
}

function textAppearance(
	kind: 'action' | 'link',
	tone: Tone,
	prominence: 'low' | 'standard' | 'high',
) {
	const appearance =
		kind === 'link' ? textLinkAppearance(tone, prominence) : textActionAppearance(tone, prominence);
	return [
		{
			style: {
				...appearance.rest,
				selectors: {
					'&[data-hovered="true"]:not([data-disabled="true"])': {
						...appearance.hover,
					},
					'&[data-pressed="true"]:not([data-disabled="true"])': {
						...appearance.pressed,
					},
					// Declared last so focus-visible's underline beats the hover/pressed decoration
					// above, even though all three selectors share the same specificity.
					'&[data-focus-visible="true"]:not([data-disabled="true"])': {
						...appearance.focus,
					},
				},
			},
			variants: { appearance: 'text' as const, kind, prominence, tone },
		},
	];
}
