// What Checkbox and Radio share: a line-height-sized control slot holding a small bordered
// indicator that fills with the accent once chosen. Each primitive spreads these into its own
// recipe, adds its shape and mark, and keeps its own selector list. Private: not exported.
import { createVar, fallbackVar } from '@vanilla-extract/css';
import { vars } from '../../../theme/contract.css.js';
import { FONT_METRIC_SCALE } from '../../../theme/font-metric-scale.js';
import { interactionTintVarName } from '../../../theme/interaction-tint-vars.js';
import { ICON_SIZES } from '../../sizing/icon-sizing.js';
import { focusRing } from '../../styles/focus-ring.js';
import { INTERACTION_STATE_LAYER_PROPERTY } from '../../styles/interaction-state-layer.js';
import { interactionStateLayer } from '../../styles/state-layer.css.js';
import { surfaceStyle } from '../../styles/surface.js';
import { textLineHeight } from '../../text/recipe.css.js';
import { inlineControlGap, inlineFieldIndent } from './recipe.css.js';

const controlSize = createVar();
const indicatorSize = createVar();

// Disabled and read-only controls give no hover or press feedback.
const interactive = ':not([data-disabled="true"]):not([data-readonly="true"])';

/** Selects the indicator while the control matches `state` and is hovered. */
export function hovered(state = '') {
	return `${state}[data-hovered="true"]${interactive} &`;
}

/** Selects the indicator while the control matches `state` and is pressed. */
export function pressed(state = '') {
	return `${state}[data-pressed="true"]${interactive} &`;
}

/** Uses a restrained portion of the shared tint over the indicator's small base surface. */
function stateLayer(state: 'hover' | 'pressed') {
	const strength = state === 'hover' ? 60 : 80;
	return {
		vars: {
			[interactionStateLayer]: `color-mix(in srgb, var(${interactionTintVarName(state)}) ${strength}%, transparent)`,
		},
	};
}

/** The control slot: as tall as a line of label text, so the indicator centres on the first line. */
export const choiceControl = {
	alignItems: 'center',
	blockSize: fallbackVar(textLineHeight, '1lh'),
	display: 'inline-flex',
	flexShrink: 0,
	inlineSize: controlSize,
	justifyContent: 'center',
} as const;

/** The root's custom properties for each size variant, including the label's inline indent. */
export const choiceSizeVars = {
	medium: {
		[controlSize]: FONT_METRIC_SCALE[16].lineHeight,
		[indicatorSize]: ICON_SIZES['size.20'],
		[inlineFieldIndent]: `calc(${controlSize} + ${inlineControlGap})`,
	},
	small: {
		[controlSize]: ICON_SIZES['size.20'],
		[indicatorSize]: ICON_SIZES['size.16'],
		[inlineFieldIndent]: `calc(${controlSize} + ${inlineControlGap})`,
	},
} as const;

/**
 * The indicator at rest, without its shape. Unchosen, it is a field part; chosen, a solid fill with
 * the control finish. Hover and pressed change colour, so they stay distinct without materials.
 * Every fill pairs with its foreground context, so the mark reads the fill's primary: on-solid
 * colour once chosen.
 */
export const choiceIndicator = {
	alignItems: 'center',
	...surfaceStyle('surface.base'),
	backgroundImage: `linear-gradient(${interactionStateLayer}, ${interactionStateLayer})`,
	// The finish spans the border too. From the padding box it would tile into the border and
	// repeat its lit top along the bottom edge.
	backgroundOrigin: 'border-box',
	blockSize: indicatorSize,
	borderColor: vars.color.border.control.rest,
	borderStyle: 'solid',
	borderWidth: '1px',
	display: 'inline-flex',
	inlineSize: indicatorSize,
	justifyContent: 'center',
	transitionDuration: vars.motion.feedback.duration,
	// No `color`: the mark appears with its fill's colour, not fading from the unchosen one.
	transitionProperty: `background-color, background-image, border-color, opacity, ${INTERACTION_STATE_LAYER_PROPERTY}`,
	transitionTimingFunction: vars.motion.feedback.easing,
} as const;

/**
 * What each indicator state paints. A primitive picks the selectors, so it decides which of its
 * states count as chosen and keeps the cascade order in view. `border.danger.strong` is the
 * guaranteed 3:1 boundary, so an invalid indicator keeps it through hover and press. The fill
 * carries the feedback instead.
 */
export const choiceIndicatorStates = {
	disabled: { opacity: vars.interaction.disabledOpacity },
	focusVisible: focusRing(vars.color.focus),
	hover: { ...stateLayer('hover'), borderColor: vars.color.border.control.hover },
	pressed: { ...stateLayer('pressed'), borderColor: vars.color.border.control.pressed },
	invalid: { borderColor: vars.color.border.danger.strong },
	invalidHover: { ...stateLayer('hover'), borderColor: vars.color.border.danger.strong },
	invalidPressed: { ...stateLayer('pressed'), borderColor: vars.color.border.danger.strong },
	chosen: {
		...surfaceStyle('accent.solid.rest'),
		backgroundImage: vars.controlFinish.resting,
		borderColor: vars.color.background.accent.solid.rest,
	},
	chosenHover: {
		...surfaceStyle('accent.solid.hover'),
		backgroundImage: vars.controlFinish.raised,
		borderColor: vars.color.background.accent.solid.hover,
	},
	chosenPressed: {
		...surfaceStyle('accent.solid.pressed'),
		backgroundImage: vars.controlFinish.recessed,
		borderColor: vars.color.background.accent.solid.pressed,
	},
	invalidChosen: {
		...surfaceStyle('danger.solid.rest'),
		borderColor: vars.color.border.danger.strong,
	},
	invalidChosenHover: {
		...surfaceStyle('danger.solid.hover'),
		borderColor: vars.color.border.danger.strong,
	},
	invalidChosenPressed: {
		...surfaceStyle('danger.solid.pressed'),
		borderColor: vars.color.border.danger.strong,
	},
} as const;

/** Every selector that sets an author colour on the indicator for `states`, with its invalid, hover and press forms. */
export function chosenForcedSelectors(...states: Array<string>) {
	return states
		.flatMap((state) => [state, `[data-invalid="true"]${state}`])
		.flatMap((state) => [`${state} &`, hovered(state), pressed(state)])
		.join(', ');
}

/** Forced-colours declarations for the indicator. The primitive orders them, disabled last. */
export const choiceForcedColors = {
	indicator: {
		backgroundColor: 'Canvas',
		backgroundImage: 'none',
		borderColor: 'CanvasText',
		forcedColorAdjust: 'auto',
	},
	focusVisible: { outlineColor: 'Highlight' },
	chosen: {
		backgroundColor: 'Highlight',
		backgroundImage: 'none',
		borderColor: 'Highlight',
		color: 'HighlightText',
	},
	disabledSelector: '[data-disabled="true"] &, [data-disabled="true"][data-invalid="true"] &',
	disabled: {
		backgroundColor: 'Canvas',
		backgroundImage: 'none',
		borderColor: 'GrayText',
		color: 'GrayText',
		opacity: 1,
	},
} as const;
