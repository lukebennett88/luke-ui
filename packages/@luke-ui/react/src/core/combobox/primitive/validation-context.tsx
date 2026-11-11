import type { JSX, ReactNode } from 'react';
import { createContext, use } from 'react';

interface ComboboxValidationContextValue {
	/** Whether a value that matches no item is allowed. */
	allowsCustomValue: boolean;
	/** The id of the `<form>` to associate with the combobox. */
	form: string | undefined;
	/**
	 * Whether the field submits the selected key or its text. `allowsCustomValue` forces `'text'`.
	 */
	formValue: 'key' | 'text' | undefined;
	/** Whether the combobox is disabled. A disabled field never blocks submission. */
	isDisabled: boolean;
	/** Whether the combobox is read-only. A read-only field never blocks submission. */
	isReadOnly: boolean;
	/**
	 * Whether a selection is required to submit. With `allowsCustomValue`, non-empty text also
	 * satisfies the requirement.
	 */
	isRequired: boolean;
	/** The name submitted with the combobox value. */
	name: string | undefined;
	/**
	 * How the combobox reports validation. `'native'` takes part in constraint validation.
	 * `'aria'` reports through ARIA and never blocks submission.
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

/** Root validation props that `ComboBoxStateContext` does not carry. */
export function useComboboxValidation(): ComboboxValidationContextValue {
	return use(ComboboxValidationContext) ?? defaultValidationContextValue;
}

/** Whether the combobox submits text (`allowsCustomValue` or `formValue="text"`). */
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
