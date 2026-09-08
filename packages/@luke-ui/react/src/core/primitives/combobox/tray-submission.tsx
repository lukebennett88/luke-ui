import type { JSX } from 'react';
import { useContext } from 'react';
import { ComboBoxStateContext } from 'react-aria-components/ComboBox';
import { isTextFormValue, useComboboxValidation } from './validation-context.js';

/**
 * Submits the combobox value while the tray (and its text input) is closed.
 *
 * React Aria only renders a hidden input of its own when the key is submitted. In text mode it
 * names the visible text input instead, and a tray composition has that input only while the tray
 * is open, so a closed tray would otherwise submit nothing. Rendered by `ComboboxTrayTrigger`,
 * since that is the part that exists exactly while the tray is closed.
 *
 * Separate from the hidden validation input on purpose: that control is `disabled` whenever the
 * field is exempt from constraint validation, and a disabled control is excluded from the form
 * entry list, so it can never also carry the submitted value.
 */
export function ComboboxTraySubmission(): JSX.Element | null {
	const validation = useComboboxValidation();
	const { form, isDisabled, name } = validation;
	const state = useContext(ComboBoxStateContext);

	// Key mode stays entirely React Aria's: it renders its own named hidden input, so a second one
	// here would submit the field twice.
	if (state == null || name == null || isDisabled || !isTextFormValue(validation)) return null;

	return <input form={form} name={name} type="hidden" value={state.inputValue} />;
}
