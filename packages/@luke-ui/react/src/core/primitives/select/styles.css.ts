import { vars } from '../../../theme/contract.css.js';
import { FONT_METRIC_SCALE } from '../../../theme/font-metric-scale.js';
import { focusRing } from '../../styles/focus-ring.js';
import { descendantDisabledSelector } from '../../styles/input-states.js';
import { pressFeedback } from '../../styles/press-feedback.js';
import type { SlottedConfigInput } from '../../styles/recipe.js';
import { recipe } from '../../styles/recipe.js';
import { contextualFocus, surfaceStyle } from '../../styles/surface.js';

const notDisabled = ':not([data-disabled="true"])';
const rootInvalid = `[data-invalid="true"] &${notDisabled}`;

/**
 * Raw slotted config for the Select primitives.
 *
 * Slots: `root` (the `SelectRoot` element), `trigger` (the button that draws the control chrome),
 * `value` (the selected value or placeholder), and `indicator` (the chevron). The listbox, item,
 * and popover surfaces come from the combobox recipe.
 *
 * The trigger draws the same well chrome as `comboboxRecipe`'s `control` slot and
 * `textInputPartsRecipe`'s `control` slot. Change the three together until they share one source.
 */
const selectConfig = {
	slots: {
		root: {
			minInlineSize: 0,
		},
		trigger: {
			'@media': {
				'(forced-colors: active)': {
					backgroundColor: 'Field',
					borderColor: 'FieldText',
					boxShadow: 'none',
					color: 'FieldText',
					forcedColorAdjust: 'auto',
					selectors: {
						'&[data-disabled="true"]': { borderColor: 'GrayText', color: 'GrayText', opacity: 1 },
						'&[data-focus-visible="true"]': { outlineColor: 'Highlight' },
					},
				},
			},
			alignItems: 'center',
			appearance: 'none',
			...surfaceStyle('surface.base'),
			borderColor: vars.color.border.control.rest,
			borderRadius: vars.radius.control,
			borderStyle: 'solid',
			borderWidth: '1px',
			boxShadow: vars.shadow.inset,
			display: 'inline-flex',
			fontFamily: vars.font.family.body,
			gap: vars.space['8'],
			inlineSize: '100%',
			isolation: 'isolate',
			letterSpacing: FONT_METRIC_SCALE[16].letterSpacing,
			lineHeight: FONT_METRIC_SCALE[16].lineHeight,
			margin: 0,
			minInlineSize: 0,
			// The ring follows React Aria's focus-visible signal below, so the native ring cannot draw
			// a second one where the two disagree.
			outline: 'none',
			paddingBlock: 0,
			...pressFeedback,
			textAlign: 'start',
			transitionDuration: vars.motion.feedback.duration,
			transitionProperty: 'background-color, border-color, box-shadow, color',
			transitionTimingFunction: vars.motion.feedback.easing,

			selectors: {
				'&[data-disabled="true"]': {
					cursor: 'not-allowed',
					opacity: vars.interaction.disabledOpacity,
				},
				// An open select keeps the hover border while its popover is showing.
				[`&[data-hovered="true"]${notDisabled}, &[aria-expanded="true"]${notDisabled}`]: {
					borderColor: vars.color.border.control.hover,
				},
				// Focus only adds the ring, so it composes with every state.
				[`&[data-focus-visible="true"]${notDisabled}`]: focusRing(contextualFocus()),
				// The field's error message carries the non-colour invalid cue, so the border keeps its
				// resting width and only takes the danger colour. This comes after the states above so an
				// invalid select keeps its danger border while hovered, open, or focused.
				[rootInvalid]: { borderColor: vars.color.border.danger.strong },
			},
		},
		value: {
			color: vars.color.foreground.primary,
			flex: 1,
			minInlineSize: 0,
			overflow: 'hidden',
			textOverflow: 'ellipsis',
			whiteSpace: 'nowrap',

			selectors: {
				'&[data-placeholder="true"]': { color: vars.color.foreground.secondary },
				[descendantDisabledSelector]: { color: vars.color.foreground.disabled },
			},
		},
		indicator: {
			alignItems: 'center',
			color: vars.color.foreground.secondary,
			display: 'inline-flex',
			flexShrink: 0,

			selectors: {
				[descendantDisabledSelector]: { color: vars.color.foreground.disabled },
			},
		},
	},
	defaultVariants: { size: 'medium' },
	variants: {
		size: {
			medium: {
				trigger: {
					blockSize: vars.controlSize.px40,
					fontSize: FONT_METRIC_SCALE[16].fontSize,
					paddingInline: vars.space['12'],
				},
			},
			small: {
				trigger: {
					blockSize: vars.controlSize.px32,
					fontSize: FONT_METRIC_SCALE[14].fontSize,
					letterSpacing: FONT_METRIC_SCALE[14].letterSpacing,
					lineHeight: FONT_METRIC_SCALE[14].lineHeight,
					paddingInline: vars.space['8'],
				},
			},
		},
	},
} as const satisfies SlottedConfigInput;

/**
 * Slotted recipe for the Select primitives. Internal — not exported from a public entrypoint.
 *
 * `selectRecipe({ size }).root() / .trigger() / .value() / .indicator()`.
 */
export const selectRecipe = recipe(selectConfig);

/** Allowed `size` values for the Select primitives. */
export type SelectSize = keyof typeof selectConfig.variants.size;
