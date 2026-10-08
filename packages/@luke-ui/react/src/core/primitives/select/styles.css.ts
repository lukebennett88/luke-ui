import { vars } from '../../../theme/contract.css.js';
import { FONT_METRIC_SCALE } from '../../../theme/font-metric-scale.js';
import { focusRing } from '../../styles/focus-ring.js';
import { descendantDisabledSelector } from '../../styles/input-states.js';
import type { SlottedConfigInput } from '../../styles/recipe.js';
import { recipe } from '../../styles/recipe.js';

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
			// React Aria sets `data-focus-visible` on the root while the trigger has keyboard focus,
			// which the reset layer would draw as a ring around the whole field. The trigger owns the ring.
			outline: 'none',
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
				'(prefers-reduced-motion: reduce)': { transition: 'none' },
			},
			alignItems: 'center',
			appearance: 'none',
			backgroundColor: vars.color.surface.recessed,
			borderColor: vars.color.border.control,
			borderRadius: vars.radius.control,
			borderStyle: 'solid',
			borderWidth: '1px',
			boxShadow: vars.depth.recessed,
			color: vars.color.text.primary,
			display: 'inline-flex',
			fontFamily: vars.font.family.body,
			gap: vars.space.sp8,
			inlineSize: '100%',
			isolation: 'isolate',
			letterSpacing: FONT_METRIC_SCALE[16].letterSpacing,
			lineHeight: FONT_METRIC_SCALE[16].lineHeight,
			margin: 0,
			minInlineSize: 0,
			outline: 'none',
			paddingBlock: 0,
			textAlign: 'start',
			transitionDuration: vars.motion.duration.feedback,
			transitionProperty: 'background-color, border-color, color',
			transitionTimingFunction: vars.motion.easing.standard,

			selectors: {
				'&[data-disabled="true"]': {
					cursor: 'not-allowed',
					opacity: vars.interaction.disabledOpacity,
				},
				[`&[data-hovered="true"]${notDisabled}`]: { borderColor: vars.color.border.accent },
				[`&[aria-expanded="true"]${notDisabled}`]: { borderColor: vars.color.border.accent },
				[`&[data-focus-visible="true"]${notDisabled}`]: {
					borderColor: vars.color.border.accent,
					...focusRing(vars.color.border.focus),
				},
				// The field's error message carries the non-colour invalid cue, so the border keeps its
				// resting width and only takes the danger colour. This comes after the states above so an
				// invalid select keeps its danger border while hovered, open, or focused.
				[rootInvalid]: { borderColor: vars.color.background.danger.solid.rest },
			},
		},
		value: {
			color: vars.color.text.primary,
			flex: 1,
			minInlineSize: 0,
			overflow: 'hidden',
			textOverflow: 'ellipsis',
			whiteSpace: 'nowrap',

			selectors: {
				'&[data-placeholder="true"]': { color: vars.color.text.secondary },
				[descendantDisabledSelector]: { color: vars.color.text.disabled },
			},
		},
		indicator: {
			alignItems: 'center',
			color: vars.color.text.secondary,
			display: 'inline-flex',
			flexShrink: 0,

			selectors: {
				[descendantDisabledSelector]: { color: vars.color.text.disabled },
			},
		},
	},
	defaultVariants: { size: 'medium' },
	variants: {
		size: {
			medium: {
				trigger: {
					blockSize: vars.controlSize.medium,
					fontSize: FONT_METRIC_SCALE[16].fontSize,
					paddingInline: vars.space.sp12,
				},
			},
			small: {
				trigger: {
					blockSize: vars.controlSize.small,
					fontSize: FONT_METRIC_SCALE[14].fontSize,
					letterSpacing: FONT_METRIC_SCALE[14].letterSpacing,
					lineHeight: FONT_METRIC_SCALE[14].lineHeight,
					paddingInline: vars.space.sp8,
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
