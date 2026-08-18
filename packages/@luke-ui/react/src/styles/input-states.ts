/**
 * State definitions shared by field control recipes. Each entry lists every
 * selector that means "this control is in state X".
 *
 * The defaults cover a RAC `Group` that carries the field's data attributes
 * itself and contains a single `input`. Anatomies with more parts extend
 * these when their anatomy has more parts.
 */
const inputStates = {
	disabled:
		'[data-disabled="true"], [aria-disabled="true"], :has(input:disabled), :has(input[aria-disabled="true"])',
	focusWithin: '[data-focus-within="true"], :focus-within',
	hover: '[data-hovered="true"], :hover',
	// Deliberately not `:has(:invalid)`: native `:invalid` matches an empty
	// required input from first render, before any interaction or submit, while
	// `aria-invalid` stays null until validation actually runs. Styling on
	// `:has(:invalid)` would paint an untouched required field invalid while
	// telling assistive technology it is fine — the two clauses below track
	// React Aria's own validation state instead, which only flips once a real
	// failure has been recorded (`data-invalid`/`aria-invalid` are both null
	// beforehand).
	invalid: '[data-invalid="true"], [aria-invalid="true"], :has(input[aria-invalid="true"])',
	// Scoped to `input` deliberately: bare `:read-only` matches any non-editable
	// element (spans, buttons), so `:has(:read-only)` would match any control
	// that contains a prefix, suffix, or trigger.
	readOnly: '[data-readonly="true"], :has(input:read-only)',
};

/** Composes the shared field-state selectors used by TextField and Combobox recipes. */
export function composeInputStateSelectors() {
	const notDisabled = `:not(:where(${inputStates.disabled}))`;

	return {
		disabled: `&:where(${inputStates.disabled})`,
		focusWithin: `&:where(${inputStates.focusWithin})${notDisabled}`,
		hover: `&:where(${inputStates.hover})${notDisabled}:not(:where(${inputStates.focusWithin})):not(:where(${inputStates.readOnly}))`,
		invalid: `&:where(${inputStates.invalid})${notDisabled}`,
		invalidFocusWithin: `&:where(${inputStates.invalid}):where(${inputStates.focusWithin})${notDisabled}`,
		readOnly: `&:where(${inputStates.readOnly})${notDisabled}`,
		readOnlyFocusWithin: `&:where(${inputStates.readOnly}):where(${inputStates.focusWithin})${notDisabled}`,
	};
}

/** Only explicit disabled attrs; avoids `:has()` matching an ancestor that contains any disabled input on the page. */
const descendantDisabledState = '[data-disabled="true"], [aria-disabled="true"]';

/** Selector for parts styled by a disabled ancestor (prefixes, suffixes, triggers). */
export const descendantDisabledSelector = `:where(${descendantDisabledState}) &`;
