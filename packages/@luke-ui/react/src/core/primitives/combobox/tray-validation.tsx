import type { JSX, RefObject } from 'react';
import { useContext, useEffect, useRef } from 'react';
import { ComboBoxStateContext } from 'react-aria-components/ComboBox';
import { FormContext } from 'react-aria-components/Form';
import { useSlottedContext } from 'react-aria-components/slots';
import { visuallyHiddenRecipe } from '../../visually-hidden/recipe.css.js';
import { useComboboxValidation } from './validation-context.js';

interface ComboboxTrayValidationProps {
	/** Focused on invalid submit, when this control is the first invalid one in its form. */
	triggerRef: RefObject<HTMLButtonElement | null>;
}

/**
 * Keeps native form validation available while the tray (and its text input) is closed. Rendered
 * by `ComboboxTrayTrigger`, since that is the part that exists exactly while the tray is closed.
 *
 * On invalid submit, focuses the tray trigger instead of this aria-hidden control — but only when
 * this control is the first invalid participating control in its owning form, so that multiple
 * invalid comboboxes in one form send focus to the first rather than the last.
 */
export function ComboboxTrayValidation(props: ComboboxTrayValidationProps): JSX.Element | null {
	const { triggerRef } = props;
	const { allowsCustomValue, form, isDisabled, isReadOnly, isRequired, validationBehavior } =
		useComboboxValidation();
	const state = useContext(ComboBoxStateContext);
	const ref = useRef<HTMLInputElement>(null);

	// Match React Aria: field prop, then enclosing `<Form>`, then `'native'`.
	const formContext = useSlottedContext(FormContext);
	const resolvedValidationBehavior =
		validationBehavior ?? formContext?.validationBehavior ?? 'native';

	// Disabled, read-only, and `validationBehavior: 'aria'` must leave constraint validation
	// entirely — dropping `required` alone is not enough.
	const isValidated =
		resolvedValidationBehavior === 'native' && isDisabled !== true && isReadOnly !== true;

	const customError = isValidated
		? (state?.realtimeValidation.validationErrors.join(' ') ?? '')
		: '';
	const selected = state?.value ?? null;
	const selectedValue: string = Array.isArray(selected)
		? selected.map(String).join(',')
		: (selected?.toString() ?? '');
	// With `allowsCustomValue`, typed text with no matching option is a valid value in its own
	// right, so a `required` check must fall back to the input text once there is no selection.
	const value =
		allowsCustomValue && selectedValue === '' ? (state?.inputValue ?? '') : selectedValue;

	useEffect(() => {
		ref.current?.setCustomValidity(customError);
	}, [customError, value]);

	if (state == null) return null;

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
 * Whether `input` is the first invalid, participating control in its owning form, in document
 * order. `event.preventDefault()` in `onInvalid` suppresses the browser's own focusing of the
 * first invalid control, so this control decides for itself whether it should take focus instead.
 * With no owning form there is nothing to compare against, so it always counts as first.
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

/** Snapshot a live `ValidityState` into the plain object React Aria stores. */
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
