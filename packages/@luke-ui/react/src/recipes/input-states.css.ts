/**
 * State definitions shared by field control recipes. Each entry lists every
 * selector that means "this control is in state X".
 *
 * The defaults cover a RAC `Group` that carries the field's data attributes
 * itself and contains a single `input`. Anatomies with more parts extend
 * these when their anatomy has more parts.
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

export type InputStates = Record<keyof typeof inputStates, string>;

/** Composes state definitions into selectors shared by field control recipes. */
export function composeInputStateSelectors(states: InputStates) {
	const notDisabled = `:not(:where(${states.disabled}))`;

	return {
		disabled: `&:where(${states.disabled})`,
		focusWithin: `&:where(${states.focusWithin})${notDisabled}`,
		hover: `&:where(${states.hover})${notDisabled}:not(:where(${states.focusWithin})):not(:where(${states.readOnly}))`,
		invalid: `&:where(${states.invalid})${notDisabled}`,
		invalidFocusWithin: `&:where(${states.invalid}):where(${states.focusWithin})${notDisabled}`,
		readOnly: `&:where(${states.readOnly})${notDisabled}`,
		readOnlyFocusWithin: `&:where(${states.readOnly}):where(${states.focusWithin})${notDisabled}`,
	};
}

/** Only explicit disabled attrs; avoids `:has()` matching an ancestor that contains any disabled input on the page. */
const descendantDisabledState = '[data-disabled="true"], [aria-disabled="true"]';

/** Selector for parts styled by a disabled ancestor (adornments, triggers). */
export const descendantDisabledSelector = `:where(${descendantDisabledState}) &`;
