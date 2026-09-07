import type { JSX, RefObject } from 'react';
import { useContext, useEffect, useRef } from 'react';
import { ComboBoxStateContext } from 'react-aria-components/ComboBox';
import { FormContext } from 'react-aria-components/Form';
import { useSlottedContext } from 'react-aria-components/slots';
import { visuallyHiddenRecipe } from '../../visually-hidden/recipe.css.js';

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
 * Keeps native form validation available while the tray (and its text input) is closed.
 * Focuses `triggerRef` on invalid submit instead of this aria-hidden control.
 */
export function ComboboxTrayValidation(props: ComboboxTrayValidationProps): JSX.Element | null {
	const { form, isDisabled, isReadOnly, isRequired, triggerRef, validationBehavior } = props;
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

				triggerRef.current?.focus();
			}}
			ref={ref}
			required={isRequired === true}
			tabIndex={-1}
			value={value}
		/>
	);
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
