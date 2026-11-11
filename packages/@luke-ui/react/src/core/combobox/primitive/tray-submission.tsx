import type { JSX } from 'react';
import { useContext } from 'react';
import { ComboBoxStateContext } from 'react-aria-components/ComboBox';
import { isTextFormValue, useComboboxValidation } from './validation-context.js';

/**
 * Hidden input that submits the combobox text while the tray is closed.
 *
 * In text mode the visible input carries `name`, and that input exists only while the tray is open.
 * Keep this separate from the validation input: that control is `disabled` when constraint
 * validation is off, so it cannot also submit.
 */
export function ComboboxTraySubmission(): JSX.Element | null {
	const validation = useComboboxValidation();
	const { form, isDisabled, name } = validation;
	const state = useContext(ComboBoxStateContext);

	// Key mode already submits through React Aria's named hidden input.
	if (state == null || name == null || isDisabled || !isTextFormValue(validation)) return null;

	return <input form={form} name={name} type="hidden" value={state.inputValue} />;
}
