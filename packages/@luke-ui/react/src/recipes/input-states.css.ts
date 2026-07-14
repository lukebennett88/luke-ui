import type { StyleRule } from '@vanilla-extract/css';
import { focusRing } from '../styles/focus-ring.js';
import { vars } from '../styles/vars.css.js';
import { vars as themeVars } from '../theme/contract.css.js';

/**
 * State definitions shared by field control recipes (the `TextInput` group,
 * the Combobox control): each entry lists every selector that means "this
 * control is in state X".
 *
 * The defaults cover a RAC `Group` that carries the field's data attributes
 * itself and contains a single `input`. Anatomies with more parts extend
 * these — see `combobox.css.ts`, which also watches its trigger button.
 */
export const inputStates = {
	disabled:
		'[data-disabled="true"], [aria-disabled="true"], :has(input:disabled), :has(input[aria-disabled="true"])',
	focusWithin: '[data-focus-within="true"], :focus-within',
	hover: '[data-hovered="true"], :hover',
	invalid:
		'[data-invalid="true"], [aria-invalid="true"], :has(:invalid), :has(input[aria-invalid="true"])',
	// Scoped to `input` deliberately: bare `:read-only` matches any non-editable
	// element (spans, buttons), so `:has(:read-only)` would match any control
	// that contains an adornment or trigger.
	readOnly: '[data-readonly="true"], :has(input:read-only)',
};

/** State definitions consumed by {@link inputChromeStyles}. */
export type InputStates = typeof inputStates;

/** Only explicit disabled attrs; avoids `:has()` matching an ancestor that contains any disabled input on the page. */
const descendantDisabledState = '[data-disabled="true"], [aria-disabled="true"]';

/** Selector for parts styled by a disabled ancestor (adornments, triggers). */
export const descendantDisabledSelector = `:where(${descendantDisabledState}) &`;

function composeInputStateSelectors(states: InputStates) {
	const disabled = `&:where(${states.disabled})`;
	return {
		disabled,
		focusWithin: `&:where(${states.focusWithin})`,
		hover: `&:where(${states.hover}):not(:where(${states.disabled})):not(:where(${states.focusWithin}))`,
		invalid: `&:where(${states.invalid})`,
		invalidFocusWithin: `&:where(${states.invalid}):where(${states.focusWithin})`,
		readOnly: `&:where(${states.readOnly}):not(:where(${states.disabled}))`,
	};
}

interface InputChromeOptions {
	/** Border color for the disabled state. */
	disabledBorderColor?: string;
}

/**
 * Complete base style for a field control group: resting chrome plus
 * disabled / hover / focus-within / invalid / read-only treatments and
 * forced-colors support.
 */
export function inputChromeStyles(
	states: InputStates,
	options: InputChromeOptions = {},
): StyleRule {
	const selectors = composeInputStateSelectors(states);
	const { disabledBorderColor = vars.backgroundColor.inputDisabled } = options;

	return {
		'@media': {
			'(forced-colors: active)': {
				selectors: {
					[selectors.focusWithin]: {
						outlineColor: 'Highlight',
					},
					[selectors.invalid]: {
						borderColor: 'ButtonText',
					},
					[selectors.invalidFocusWithin]: {
						borderColor: 'ButtonText',
						outlineColor: 'Highlight',
					},
					[selectors.disabled]: {
						borderColor: 'GrayText',
						color: 'GrayText',
					},
				},
			},
		},
		alignItems: 'center',
		backgroundColor: vars.backgroundColor.input,
		borderColor: vars.border.input,
		borderRadius: vars.borderRadius.medium,
		borderStyle: 'solid',
		borderWidth: vars.borderWidth.thin,
		color: vars.themeColor.inputColor,
		display: 'inline-flex',
		fontFamily: vars.font.family.body,
		inlineSize: '100%',
		minInlineSize: 0,
		overflow: 'hidden',

		selectors: {
			[selectors.disabled]: {
				backgroundColor: vars.backgroundColor.inputDisabled,
				borderColor: disabledBorderColor,
				color: vars.foregroundColor.disabled,
				cursor: 'not-allowed',
			},
			[selectors.hover]: {
				borderColor: vars.themeColor.paletteThemePrimary400,
			},
			[selectors.focusWithin]: {
				borderColor: vars.themeColor.paletteThemePrimary500,
				...focusRing(themeVars.color.border.focus),
			},
			[selectors.invalid]: {
				borderColor: vars.border.critical,
				outlineStyle: 'none',
			},
			[selectors.invalidFocusWithin]: {
				borderColor: vars.border.critical,
				...focusRing(themeVars.color.border.focus),
			},
			[selectors.readOnly]: {
				backgroundColor: vars.backgroundColor.subtle,
			},
		},
		transitionDuration: vars.motion.duration.fast,
		transitionProperty: 'color, background-color, border-color',
		transitionTimingFunction: vars.motion.easing.standard,
	};
}
