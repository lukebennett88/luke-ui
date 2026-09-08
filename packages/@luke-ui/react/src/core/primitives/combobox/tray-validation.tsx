import type { JSX, RefObject } from 'react';
import { useContext, useEffect, useRef } from 'react';
import { ComboBoxStateContext } from 'react-aria-components/ComboBox';
import { FormContext } from 'react-aria-components/Form';
import { useSlottedContext } from 'react-aria-components/slots';
import { visuallyHiddenRecipe } from '../../visually-hidden/recipe.css.js';
import { useComboboxValidation } from './validation-context.js';

interface ComboboxTrayValidationProps {
	/** Trigger to focus when this is the first invalid control in the form. */
	triggerRef: RefObject<HTMLButtonElement | null>;
}

/**
 * Keeps constraint validation available while the tray is closed. Hidden while open so search
 * keystrokes do not update an outside focus-scoped input. On invalid submit, focuses the trigger
 * when this is the first invalid participating control in the form.
 */
export function ComboboxTrayValidation(props: ComboboxTrayValidationProps): JSX.Element | null {
	const { triggerRef } = props;
	const { allowsCustomValue, form, isDisabled, isReadOnly, isRequired, validationBehavior } =
		useComboboxValidation();
	const state = useContext(ComboBoxStateContext);
	const ref = useRef<HTMLInputElement>(null);

	// Resolve like React Aria: field prop, then enclosing `<Form>`, then `'native'`.
	const formContext = useSlottedContext(FormContext);
	const resolvedValidationBehavior =
		validationBehavior ?? formContext?.validationBehavior ?? 'native';

	// Disabled, read-only, and `aria` must leave constraint validation entirely.
	const isValidated =
		resolvedValidationBehavior === 'native' && isDisabled !== true && isReadOnly !== true;

	const customError = isValidated
		? (state?.realtimeValidation.validationErrors.join(' ') ?? '')
		: '';
	const selected = state?.value ?? null;
	const selectedValue: string = Array.isArray(selected)
		? selected.map(String).join(',')
		: (selected?.toString() ?? '');
	// With `allowsCustomValue`, text with no selection still satisfies `required`.
	const value =
		allowsCustomValue && selectedValue === '' ? (state?.inputValue ?? '') : selectedValue;

	useEffect(() => {
		ref.current?.setCustomValidity(customError);
	}, [customError, value]);

	if (state == null) return null;

	// Only needed while the tray is closed. Updating this outside input on every search
	// keystroke races the dismissible overlay's focus scope on slower runners.
	if (state.isOpen) return null;

	return (
		<input
			aria-hidden
			className={visuallyHiddenRecipe()}
			disabled={!isValidated}
			form={form}
			onChange={() => {
				// Value is driven by the combobox selection; React requires a handler for a value prop.
			}}
			onInvalid={(event) => {
				event.preventDefault();

				const validity = event.currentTarget.validity;
				state.updateValidation({
					isInvalid: true,
					validationDetails: toValidationDetails(validity),
					validationErrors: [event.currentTarget.validationMessage],
				});
				state.commitValidation();

				if (isFirstInvalidControl(event.currentTarget)) {
					triggerRef.current?.focus();
				}
			}}
			ref={ref}
			required={isRequired}
			tabIndex={-1}
			value={value}
		/>
	);
}

/**
 * Whether `input` is the first invalid participating control in its form. `preventDefault` in
 * `onInvalid` stops the browser focusing that control, so this decides instead. With no owning
 * form, treat it as first.
 */
function isFirstInvalidControl(input: HTMLInputElement): boolean {
	const form = input.form;
	if (form == null) return true;

	for (const element of form.elements) {
		if (!(element instanceof HTMLElement)) continue;
		if (!('willValidate' in element) || !('validity' in element)) continue;

		const candidate = element as HTMLElement & { validity: ValidityState; willValidate: boolean };
		if (!candidate.willValidate) continue;
		if (candidate.validity.valid) continue;

		return candidate === input;
	}

	return true;
}

/** Snapshot of a live `ValidityState` for the plain object React Aria stores. */
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
