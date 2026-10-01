/**
 * State definitions shared by field control recipes. Each entry lists every
 * selector that means "this control is in state X".
 *
 * The defaults cover a RAC `Group` that carries the field's data attributes
 * itself and contains a single `input`. An anatomy whose element carries a
 * state in another form extends them through `composeInputStateSelectors`.
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

/** A state name in the shared field-state matrix. */
type InputState = keyof typeof inputStates;

/**
 * Composes the shared field-state selectors used by the text input and combobox recipes.
 *
 * `extraStates` appends selectors to a state's list, for an anatomy whose element carries a state
 * in a form the defaults do not cover, such as a bare `<input>` that is itself `:read-only`.
 */
export function composeInputStateSelectors(extraStates: Partial<Record<InputState, string>> = {}) {
	const states = {
		disabled: withExtraState(inputStates.disabled, extraStates.disabled),
		focusWithin: withExtraState(inputStates.focusWithin, extraStates.focusWithin),
		hover: withExtraState(inputStates.hover, extraStates.hover),
		invalid: withExtraState(inputStates.invalid, extraStates.invalid),
		readOnly: withExtraState(inputStates.readOnly, extraStates.readOnly),
	};
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

function withExtraState(selectors: string, extra: string | undefined): string {
	return extra === undefined ? selectors : `${selectors}, ${extra}`;
}

/** Only explicit disabled attrs; avoids `:has()` matching an ancestor that contains any disabled input on the page. */
const descendantDisabledState = '[data-disabled="true"], [aria-disabled="true"]';

/** Selector for parts styled by a disabled ancestor (prefixes, suffixes, triggers). */
export const descendantDisabledSelector = `:where(${descendantDisabledState}) &`;
