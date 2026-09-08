import type { JSX, ReactNode } from 'react';
import { createContext, use } from 'react';

interface ComboboxValidationContextValue {
	/** Whether the combobox allows a non-item matching input value to be set. */
	allowsCustomValue: boolean;
	/** The `<form>` element to associate the combobox with, by id. */
	form: string | undefined;
	/**
	 * Whether the selected item's text or its key is submitted. `allowsCustomValue` forces `'text'`,
	 * since typed text that matches no item has no key to submit.
	 */
	formValue: 'key' | 'text' | undefined;
	/** Whether the combobox is disabled, in which case it never blocks submission. */
	isDisabled: boolean;
	/** Whether the combobox is read-only, in which case it never blocks submission. */
	isReadOnly: boolean;
	/** Whether a selection (or, with `allowsCustomValue`, non-empty text) is required to submit. */
	isRequired: boolean;
	/** The name submitted with the combobox's value. */
	name: string | undefined;
	/**
	 * How the combobox reports validation. Only `'native'` takes part in constraint validation;
	 * `'aria'` reports through ARIA alone and must never block submission.
	 */
	validationBehavior: 'aria' | 'native' | undefined;
}

const defaultValidationContextValue: ComboboxValidationContextValue = {
	allowsCustomValue: false,
	form: undefined,
	formValue: undefined,
	isDisabled: false,
	isReadOnly: false,
	isRequired: false,
	name: undefined,
	validationBehavior: undefined,
};

const ComboboxValidationContext = createContext<ComboboxValidationContextValue | null>(null);

/** The root's validation-relevant props, not otherwise carried by `ComboBoxStateContext`. */
export function useComboboxValidation(): ComboboxValidationContextValue {
	return use(ComboboxValidationContext) ?? defaultValidationContextValue;
}

/**
 * Whether the combobox submits the input text rather than the selected key. React Aria forces text
 * mode under `allowsCustomValue`, and in text mode it names the visible text input instead of
 * rendering a hidden input of its own.
 */
export function isTextFormValue(value: ComboboxValidationContextValue): boolean {
	return value.allowsCustomValue || value.formValue === 'text';
}

export function ComboboxValidationProvider({
	value,
	children,
}: {
	value: ComboboxValidationContextValue;
	children: ReactNode;
}): JSX.Element {
	return (
		<ComboboxValidationContext.Provider value={value}>
			{children}
		</ComboboxValidationContext.Provider>
	);
}
