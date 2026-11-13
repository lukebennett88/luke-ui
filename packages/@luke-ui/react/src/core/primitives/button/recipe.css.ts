import { fallbackVar } from '@vanilla-extract/css';
import { vars } from '../../../theme/contract.css.js';
import { FONT_METRIC_SCALE } from '../../../theme/font-metric-scale.js';
import * as interactionTints from '../../../theme/interaction-tint-vars.js';
import { BUTTON_ICON_SIZE } from '../../button/button-sizing.js';
import { iconSizeVars } from '../../icon/icon-sizing.js';
import { MIN_TARGET_SIZE } from '../../sizing/control-size.js';
import { INTERACTION_STATE_LAYER_PROPERTY } from '../../styles/interaction-state-layer.js';
import { style } from '../../styles/layered-style.css.js';
import { pressFeedback } from '../../styles/press-feedback.js';
import { recipe } from '../../styles/recipe.js';
import { interactionStateLayer } from '../../styles/state-layer.css.js';
import { adaptiveStateLayer } from '../../styles/state-layer.js';
import {
	contextualForeground,
	surfaceFill,
	surfaceFinish,
	surfaceShadow,
	surfaceStyle,
} from '../../styles/surface.js';
import { textRecipe } from '../../text/recipe.css.js';
import { textActionAppearance, textLinkAppearance } from './text-action-appearance.js';

export const actionElementClassName = style({}, 'action');
export const expandedButtonClassName = style({}, 'expanded-button');

const enabled = ':not([data-disabled="true"]):not([data-pending="true"])';
// The open branch sits in `:where()` so its extra class doesn't outrank `pressed`, which would keep
// the hover finish on a pressed, open trigger.
const hovered = `&[data-hovered="true"]${enabled}, &:where(.${expandedButtonClassName}[aria-expanded="true"])${enabled}`;
const pressed = `&[data-pressed="true"]${enabled}`;

const textBase = [
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
] as const;

/** Shared presentation recipe for Button and button-shaped Link. */
export const buttonRecipeInternal = recipe({
	base: [
		actionElementClassName,
		{
			font: 'inherit',
			...pressFeedback,
			transitionDuration: vars.motion.feedback.duration,
			transitionProperty: `background-color, border-color, box-shadow, color, opacity, text-decoration-color, ${INTERACTION_STATE_LAYER_PROPERTY}`,
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
		prominence: 'standard',
		size: 'medium',
		tone: 'neutral',
	},
	variants: {
		appearance: {
			button: {
				'@media': {
					'(prefers-reduced-motion: reduce)': {
						transitionProperty:
							'background-color, border-color, box-shadow, color, opacity, text-decoration-color',
					},
					'(forced-colors: active)': {
						backgroundColor: 'ButtonFace',
						backgroundImage: 'none',
						borderColor: 'ButtonText',
						borderWidth: vars.borderWidth.thin,
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
				// No border outside forced colours: inset shadow and the face finish would leave an
				// unshaded rim inside even a transparent one. The size padding makes up its width.
				borderColor: 'transparent',
				borderRadius: vars.radius.control,
				borderStyle: 'solid',
				borderWidth: 0,
				boxShadow: vars.shadow.resting,
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
				vars: iconSizeVars(BUTTON_ICON_SIZE),
				whiteSpace: 'nowrap',
				// Hover and pressed change colour, shadow, and finish, never position or scale.
				selectors: {
					[hovered]: {
						boxShadow: vars.shadow.raised,
					},
					'&[data-pending="true"]': {
						cursor: 'wait',
					},
					'&[data-pressed="true"]:not([data-disabled="true"]):not([data-pending="true"])': {
						boxShadow: vars.shadow.inset,
					},
				},
			},
			// A text Button and a text Link share this base. Each takes its own colour and decoration below.
			// A text Link's icons keep their own size. A text Button's match the button appearance.
			link: textBase,
			text: [...textBase, { vars: iconSizeVars(BUTTON_ICON_SIZE) }],
		},
		inlineSize: {
			auto: {},
			full: { inlineSize: '100%' },
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
			danger: {},
			neutral: {},
		},
	},
	compoundVariants: [
		buttonSize('medium'),
		buttonSize('small'),
		// Undoes `textRecipe`'s `minInlineSize: 0`, which lets a grid or flex parent collapse the
		// button to one character per line. Must be a compound variant: `textRecipe`'s base and this
		// recipe's variants emit into separate same-named `recipes` layer blocks, so only a style from
		// this recipe's own call reliably lands last.
		...(['link', 'text'] as const).map((appearance) => {
			return { style: { minInlineSize: 'auto' }, variants: { appearance } };
		}),
		...buttonAppearance('neutral', 'low', 'transparent'),
		...buttonAppearance('neutral', 'standard', 'subtle'),
		...buttonAppearance('neutral', 'high', 'solid', 'accent'),
		...buttonAppearance('danger', 'low', 'transparent'),
		...buttonAppearance('danger', 'standard', 'subtle'),
		...buttonAppearance('danger', 'high', 'solid'),
		...textAppearance('text', 'neutral', 'low'),
		...textAppearance('text', 'neutral', 'standard'),
		...textAppearance('text', 'neutral', 'high'),
		...textAppearance('text', 'danger', 'low'),
		...textAppearance('text', 'danger', 'standard'),
		...textAppearance('link', 'neutral', 'low'),
		...textAppearance('link', 'neutral', 'standard'),
	],
});

type Tone = 'neutral' | 'danger';
type BackgroundTone = 'neutral' | 'danger' | 'accent';
type ButtonSurface = 'transparent' | 'subtle' | 'solid';

/**
 * A button's fill in each interaction state, paired with its foreground context through
 * `surfaceStyle`. A low Button paints the nearest managed surface's resting fill, with that
 * surface's hover or pressed fill as the state layer above it. A standard Button paints the adaptive
 * state layer over its resting subtle fill. Both keep their surrounding foreground context, and a
 * low Button on a solid keeps on-solid text in every state. Wherever a Button paints a finish, the
 * finish sits above its fill layer. Solid Buttons keep opaque state tokens and the control finish. A
 * danger tone keeps the danger hue on a surrounding surface or subtle rest, and reads on-solid
 * colour on a solid.
 */
function buttonAppearance(
	tone: Tone,
	prominence: 'low' | 'standard' | 'high',
	surface: ButtonSurface,
	backgroundTone: BackgroundTone = tone === 'danger' ? 'danger' : 'neutral',
) {
	const toneColor = tone === 'danger' ? { color: contextualForeground('danger') } : ({} as const);
	const variants = { appearance: 'button' as const, prominence, tone };
	const restColor =
		'color' in toneColor && toneColor.color !== undefined
			? toneColor.color
			: contextualForeground('primary');
	const layerGradient = `linear-gradient(${interactionStateLayer}, ${interactionStateLayer})`;

	if (surface === 'transparent') {
		return [
			{
				style: {
					'@media': {
						'(forced-colors: active)': { backgroundImage: 'none' },
					},
					backgroundColor: fallbackVar(surfaceFill.rest, 'transparent'),
					backgroundImage: layerGradient,
					borderColor: 'transparent',
					boxShadow: 'none',
					color: restColor,
					vars: { [interactionStateLayer]: 'transparent' },
					selectors: {
						[hovered]: {
							vars: {
								[interactionStateLayer]: fallbackVar(
									surfaceFill.hover,
									`var(${interactionTints.interactionTintVarName('hover')})`,
								),
							},
							backgroundImage: `${fallbackVar(surfaceFinish.hover, 'none')}, ${layerGradient}`,
							boxShadow: vars.shadow.raised,
						},
						[pressed]: {
							vars: {
								[interactionStateLayer]: fallbackVar(
									surfaceFill.pressed,
									`var(${interactionTints.interactionTintVarName('pressed')})`,
								),
							},
							backgroundImage: `${fallbackVar(surfaceFinish.pressed, 'none')}, ${layerGradient}`,
							boxShadow: fallbackVar(surfaceShadow.pressed, vars.shadow.inset),
						},
					},
				},
				variants,
			},
		];
	}

	// A subtle button always uses the neutral fill; only its text takes the tone.
	const fill = surface === 'subtle' ? 'neutral' : backgroundTone;
	if (surface === 'solid') {
		return [
			{
				style: {
					'@media': {
						'(forced-colors: active)': { backgroundImage: 'none' },
					},
					...surfaceStyle(`${fill}.solid.rest`),
					...toneColor,
					backgroundImage: vars.controlFinish.resting,
					selectors: {
						[hovered]: {
							...surfaceStyle(`${fill}.solid.hover`),
							...toneColor,
							backgroundImage: vars.controlFinish.raised,
						},
						[pressed]: {
							...surfaceStyle(`${fill}.solid.pressed`),
							...toneColor,
							backgroundImage: vars.controlFinish.recessed,
						},
					},
				},
				variants,
			},
		];
	}

	// Merge the adaptive layer's vars into the resting subtle pairing. A later `vars` object would
	// replace the pairing's foreground resets, so a danger standard Button on a solid would keep
	// inherited on-solid text over its light subtle fill.
	const subtleRest = surfaceStyle(`${fill}.subtle`);
	const hoverLayer = adaptiveStateLayer('hover');
	const pressedLayer = adaptiveStateLayer('pressed');
	return [
		{
			style: {
				'@media': {
					'(forced-colors: active)': { backgroundImage: 'none' },
				},
				...subtleRest,
				...toneColor,
				backgroundImage: `${vars.controlFinish.resting}, ${layerGradient}`,
				vars: {
					...subtleRest.vars,
					[interactionStateLayer]: 'transparent',
				},
				selectors: {
					[hovered]: {
						...hoverLayer,
						backgroundImage: `${vars.controlFinish.raised}, ${layerGradient}`,
					},
					[pressed]: {
						...pressedLayer,
						backgroundImage: `${vars.controlFinish.recessed}, ${layerGradient}`,
					},
				},
			},
			variants,
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
						blockSize: vars.controlSize['40'],
						fontSize: FONT_METRIC_SCALE[14].fontSize,
						gap: vars.space['8'],
					}
				: {
						...inset,
						blockSize: vars.controlSize['32'],
						fontSize: FONT_METRIC_SCALE[12].fontSize,
						gap: vars.space['4'],
						letterSpacing: FONT_METRIC_SCALE[12].letterSpacing,
						lineHeight: FONT_METRIC_SCALE[12].lineHeight,
					},
		variants: { appearance: 'button' as const, size },
	};
}

function textAppearance(
	appearance: 'link' | 'text',
	tone: Tone,
	prominence: 'low' | 'standard' | 'high',
) {
	const states =
		appearance === 'link'
			? textLinkAppearance(tone, prominence)
			: textActionAppearance(tone, prominence);
	return [
		{
			style: {
				...states.rest,
				selectors: {
					'&[data-hovered="true"]:not([data-disabled="true"])': {
						...states.hover,
					},
					'&[data-pressed="true"]:not([data-disabled="true"])': {
						...states.pressed,
					},
					// Declared last so focus-visible's underline beats the hover/pressed decoration
					// above, even though all three selectors share the same specificity.
					'&[data-focus-visible="true"]:not([data-disabled="true"])': {
						...states.focus,
					},
				},
			},
			variants: { appearance, prominence, tone },
		},
	];
}
