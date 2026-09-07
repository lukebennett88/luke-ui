import type { CSSProperties, JSX, RefObject } from 'react';
import { useContext, useEffect, useRef } from 'react';
import { ComboBoxStateContext } from 'react-aria-components/ComboBox';
import { FormContext } from 'react-aria-components/Form';
import { useSlottedContext } from 'react-aria-components/slots';

interface ComboboxTrayValidationProps {
	/** The `<form>` to associate with, by id, matching the combobox's own `form` prop. */
	form?: string;
	/** Whether the combobox is disabled, in which case it never blocks submission. */
	isDisabled?: boolean;
	/** Whether the combobox is read-only, in which case it never blocks submission. */
	isReadOnly?: boolean;
	/** Whether a selection is required before the form can submit. */
	isRequired?: boolean;
	/** Focuses the tray trigger when the browser reports this control as the first invalid field. */
	triggerRef: RefObject<HTMLButtonElement | null>;
	/**
	 * How the combobox reports validation. Only `'native'` takes part in constraint validation;
	 * `'aria'` reports through ARIA alone and must never block submission.
	 */
	validationBehavior?: 'aria' | 'native';
}

/**
 * Carries native form validation for the mobile combobox.
 *
 * React Aria attaches `required` and custom validity to the combobox's text input, but the mobile
 * composition mounts that input inside the tray, so it is unmounted whenever the tray is closed and
 * an empty required field would submit. This renders a validation-only control that stays mounted,
 * mirrors the current selection, and reports the same validity the desktop input would.
 *
 * It is visually hidden rather than `type="hidden"`, because the constraint validation API skips
 * hidden inputs. `aria-hidden` and `tabIndex={-1}` keep it out of the accessibility tree and the tab
 * order, so it is never a focus target itself; when the browser reports it invalid, focus goes to
 * the tray trigger instead. It carries no `name`, so React Aria's own hidden input remains the only
 * submitted value.
 *
 * Based on the approach React Aria uses for `HiddenSelect`, which solves the same problem for a
 * `Select` that has no text input of its own.
 */
export function ComboboxTrayValidation(props: ComboboxTrayValidationProps): JSX.Element | null {
	const { form, isDisabled, isReadOnly, isRequired, triggerRef, validationBehavior } = props;
	const state = useContext(ComboBoxStateContext);
	const ref = useRef<HTMLInputElement>(null);

	// React Aria resolves `validationBehavior` as field prop, then enclosing `<Form>`, then
	// `'native'`. Resolve it the same way here, or a `<Form validationBehavior="aria">` would still
	// get native submission blocking from this control alone.
	const formContext = useSlottedContext(FormContext);
	const resolvedValidationBehavior =
		validationBehavior ?? formContext?.validationBehavior ?? 'native';

	// A disabled or read-only field is exempt from constraint validation, and `validationBehavior:
	// 'aria'` reports through ARIA rather than blocking submission. In each case this control has to
	// stay out of validation entirely, not merely drop `required`. A disabled input is skipped by
	// constraint validation, which is exactly the opt-out these three cases need.
	const isValidated =
		resolvedValidationBehavior === 'native' && isDisabled !== true && isReadOnly !== true;

	// React Aria's own validation result, so a `validate` callback or a server error blocks a closed
	// tray the same way it blocks the desktop input. This is the state React Aria itself feeds to
	// `setCustomValidity` on that input.
	const customError = isValidated
		? (state?.realtimeValidation.validationErrors.join(' ') ?? '')
		: '';
	// A single-select combobox carries one key; the multi-select shape is an array. Either way this
	// control only needs to know whether a value is present, so an empty string means "nothing
	// selected" and `required` fails.
	const selected = state?.value ?? null;
	const value: string = Array.isArray(selected)
		? selected.map(String).join(',')
		: (selected?.toString() ?? '');

	useEffect(() => {
		ref.current?.setCustomValidity(customError);
	}, [customError, value]);

	if (state == null) return null;

	return (
		<input
			aria-hidden
			disabled={!isValidated}
			form={form}
			onChange={() => {
				// Value is driven by the combobox selection; React requires a handler for a value prop.
			}}
			// The browser focuses the first invalid control on a blocked submit and shows its own
			// bubble. This control is not a real focus target and is visually hidden, so suppress
			// that, publish the error through React Aria instead — otherwise a blocked submit shows
			// nothing in `FieldError` — and focus the trigger the user can actually operate.
			onInvalid={(event) => {
				event.preventDefault();

				const validity = event.currentTarget.validity;
				state.updateValidation({
					isInvalid: true,
					validationDetails: toValidationDetails(validity),
					validationErrors: [event.currentTarget.validationMessage],
				});
				state.commitValidation();

				triggerRef.current?.focus();
			}}
			ref={ref}
			required={isRequired === true}
			style={HIDDEN_STYLE}
			tabIndex={-1}
			value={value}
		/>
	);
}

/**
 * Copies a live `ValidityState` into the plain object React Aria stores.
 *
 * `ValidityState` is a live accessor object tied to the element, so React Aria has to be handed a
 * snapshot rather than the instance itself.
 */
function toValidationDetails(validity: ValidityState): ValidityState {
	return {
		badInput: validity.badInput,
		customError: validity.customError,
		patternMismatch: validity.patternMismatch,
		rangeOverflow: validity.rangeOverflow,
		rangeUnderflow: validity.rangeUnderflow,
		stepMismatch: validity.stepMismatch,
		tooLong: validity.tooLong,
		tooShort: validity.tooShort,
		typeMismatch: validity.typeMismatch,
		valid: validity.valid,
		valueMissing: validity.valueMissing,
	};
}

// `VisuallyHidden` clips the control to a 1px box. Constraint validation ignores `display: none`
// and `type="hidden"` controls, so the control has to stay laid out to report validity at all.
const HIDDEN_STYLE: CSSProperties = {
	border: 0,
	clipPath: 'inset(50%)',
	height: 1,
	overflow: 'hidden',
	padding: 0,
	position: 'absolute',
	whiteSpace: 'nowrap',
	width: 1,
};
