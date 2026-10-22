import { createVar, fallbackVar } from '@vanilla-extract/css';
import { iconMaskUrls } from '../../../../.generated/icon-mask-data.js';
import { vars } from '../../../theme/contract.css.js';
import { ICON_SIZES } from '../../sizing/icon-sizing.js';
import { pressFeedback } from '../../styles/press-feedback.js';
import type { SlottedConfigInput } from '../../styles/recipe.js';
import { recipe } from '../../styles/recipe.js';
import { contextualDisabledForeground, contextualForeground } from '../../styles/surface.js';

const dataDisabledSelector = '[data-disabled="true"]';

/**
 * Optional indentation for error messages that sit beneath a control+label row.
 * Descriptions stay at the field's inline start; only the error tone reads this
 * var. The `inline` slot sets it from `inlineFieldIndent` so an `InlineField` hangs
 * its error under the label text.
 */
const fieldMessageIndent = createVar();

/**
 * Inline distance from the start edge of an inline control to its label text: the control's
 * width plus the gap before the label. An inline control root (`CheckboxRoot`, `SwitchRoot`) sets it
 * per size, and the `inline` slot reads it, so any inline control indents its error the same way.
 */
export const inlineFieldIndent = createVar();

/** Gap between an inline control and its label text. */
export const inlineControlGap = vars.space['8'];

/** Gap between the error icon and the message text that follows it. */
const errorIconGap = vars.space['8'];

/**
 * Inline size of the error icon's rail. It is `fieldMessageIndent` less the gap, so the rail plus
 * the gap spans the indent exactly and the message text starts at the label's inline edge. `max()`
 * floors the rail at the icon's own size when no indent is set.
 */
const errorIconRailInlineSize = `max(calc(${fallbackVar(fieldMessageIndent, '0px')} - ${errorIconGap}), ${ICON_SIZES.px16})`;

/**
 * Raw slotted config for the `Field` primitive.
 *
 * A field's text sits on whatever surface surrounds the field, so every colour reads that
 * surface's foreground context: readable on a solid fill as well as a standard surface.
 *
 * Slots: `root` (stacked layout), `inline` (inline-control layout), `label`, `inlineLabel` (the
 * clickable label of an inline control such as `CheckboxLabel`), `inlineLabelText` (the text of a
 * composed inline control's label), `necessityMarker` (the required marker after a label's text),
 * `message` (description/error text), and `icon` (the error message's leading icon).
 *
 * `FieldError` lays the error `message` out with `lockupRecipe`, which centres the `icon` rail on
 * the message's first line and keeps wrapped lines aligned with the text. This recipe supplies the
 * rail's size and glyph.
 */
const fieldConfig = {
	slots: {
		root: {
			display: 'flex',
			flexDirection: 'column',
			gap: vars.space['4'],
			minInlineSize: 0,
		},
		inline: {
			display: 'flex',
			flexDirection: 'column',
			gap: vars.space['4'],
			minInlineSize: 0,
			// The error hangs under the label text by the control root's `inlineFieldIndent`;
			// descriptions stay at the field's inline edge.
			vars: {
				[fieldMessageIndent]: fallbackVar(inlineFieldIndent, '0px'),
			},
		},
		label: {
			color: contextualForeground('primary'),
			...vars.font.label,
			minInlineSize: 0,

			selectors: {
				[`${dataDisabledSelector} &`]: {
					color: contextualDisabledForeground(),
				},
			},
		},
		inlineLabel: {
			alignItems: 'flex-start',
			color: 'inherit',
			display: 'inline-flex',
			font: 'inherit',
			gap: inlineControlGap,
			minInlineSize: 0,
			...pressFeedback,
			selectors: {
				[`&${dataDisabledSelector}`]: {
					color: contextualDisabledForeground(),
					cursor: 'not-allowed',
				},
			},
		},
		inlineLabelText: {},
		necessityMarker: {},
		message: {
			...vars.font.label,
			fontWeight: vars.font.weight.body,
			minInlineSize: 0,
		},
		icon: {},
	},
	defaultVariants: {
		necessityIndicator: 'required-asterisk',
		tone: 'description',
	},
	variants: {
		necessityIndicator: {
			'required-asterisk': {},
			'required-label': {
				necessityMarker: {
					color: contextualForeground('secondary'),
					fontWeight: vars.font.weight.body,
					selectors: {
						[`${dataDisabledSelector} &`]: {
							color: 'inherit',
						},
					},
				},
			},
			'optional-label': {
				necessityMarker: {
					color: contextualForeground('secondary'),
					fontWeight: vars.font.weight.body,
					selectors: {
						[`${dataDisabledSelector} &`]: {
							color: 'inherit',
						},
					},
				},
			},
		},
		tone: {
			description: {
				message: {
					color: contextualForeground('secondary'),
				},
			},
			error: {
				icon: {
					'@media': {
						// `CanvasText` keeps the icon solid when author colours are ignored.
						'(forced-colors: active)': { backgroundColor: 'CanvasText' },
					},
					// The icon follows the message colour, which collapses to on-solid primary on a solid
					// fill. The icon's shape and the message text carry the error, never the hue alone.
					backgroundColor: 'currentColor',
					// The rail has no content to size it, and the mask paints only inside its box.
					blockSize: ICON_SIZES.px16,
					inlineSize: errorIconRailInlineSize,
					maskImage: iconMaskUrls.exclamationTriangle,
					maskPosition: 'center',
					maskRepeat: 'no-repeat',
					maskSize: ICON_SIZES.px16,
				},
				message: {
					color: contextualForeground('danger'),
					gap: errorIconGap,
				},
			},
		},
	},
} as const satisfies SlottedConfigInput;

/**
 * Slotted recipe for the `Field` primitive.
 *
 * `fieldRecipe({ necessityIndicator, tone }).root() / .inline() / .label() / .inlineLabel() /
 * .inlineLabelText() / .necessityMarker() / .message() / .icon()`.
 */
export const fieldRecipe = recipe(fieldConfig);
