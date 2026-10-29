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
 * The trigger uses the standard button appearance; these styles supply Select's layout and states.
 */
const selectConfig = {
	slots: {
		root: {
			minInlineSize: 0,
		},
		trigger: {
			'@media': {
				'(forced-colors: active)': {
					selectors: {
						'&[data-focus-visible="true"]': { outlineColor: 'Highlight' },
						// System colours have no danger hue, so the ring would only repeat the border. Like the
						// fields, the trigger leaves the invalid cue to FieldError here.
						[`${rootInvalid}::after`]: { display: 'none' },
					},
				},
			},
			alignItems: 'center',
			display: 'inline-flex',
			fontFamily: vars.font.family.body,
			fontWeight: vars.font.weight.body,
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
			textAlign: 'start',

			selectors: {
				'&[data-disabled="true"]': {
					cursor: 'not-allowed',
					opacity: vars.interaction.disabledOpacity,
				},
				// Focus only adds the ring, so it composes with every state.
				[`&[data-focus-visible="true"]${notDisabled}`]: focusRing(vars.color.focus),
				// FieldError carries the non-colour cue. Keep the ring over every button finish.
				[`${rootInvalid}::after`]: {
					borderRadius: 'inherit',
					boxShadow: `inset 0 0 0 2px ${vars.color.border.danger.strong}`,
					content: '""',
					inset: 0,
					pointerEvents: 'none',
					position: 'absolute',
				},
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
			transition: `rotate ${vars.motion.feedback.duration} ${vars.motion.feedback.easing}`,
			'@media': { '(prefers-reduced-motion: reduce)': { transition: 'none' } },

			selectors: {
				'&[data-open="true"][data-default="true"]': { rotate: '180deg' },
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
