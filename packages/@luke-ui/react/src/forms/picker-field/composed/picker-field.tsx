import type { JSX, ReactNode } from 'react';
import { Icon } from '../../../visuals/icon/primitives/icon.js';
import { Field } from '../../field/composed/field.js';
import type { FieldErrorProps } from '../../field/primitives/field-error.js';
import type { FieldNecessityIndicator } from '../../field/primitives/field-label.js';
import type { PickerInputProps } from '../../picker-input/primitives/picker-input.js';
import { PickerInput } from '../../picker-input/primitives/picker-input.js';
import type {
	SelectInputSize,
	SelectListBoxProps,
} from '../../select-input/primitives/select-input.js';
import {
	SelectInputGroup,
	SelectListBox,
	SelectPopover,
	SelectTrigger,
	SelectValue,
} from '../../select-input/primitives/select-input.js';

/** Props for composed `PickerField` (picker pattern). */
export interface PickerFieldProps<T extends object> extends Omit<
	PickerInputProps<T>,
	'children' | 'items'
> {
	/** Helper text shown below the control. */
	description?: ReactNode;
	/** Error content passed to `FieldError`. */
	errorMessage?: FieldErrorProps['children'];
	/** Items passed to the inner listbox. */
	items?: SelectListBoxProps<T>['items'];
	/** Label content shown above the control. */
	label?: ReactNode;
	/** Item content for the listbox. */
	children: SelectListBoxProps<T>['children'];
	/** Label necessity style. */
	necessityIndicator?: FieldNecessityIndicator;
	/** Placeholder text shown when no value is selected. */
	placeholder?: string;
	/** Control size. Defaults to `'medium'`. */
	size?: SelectInputSize;
}

/** Composed field for non-searchable single-select picker usage. */
export function PickerField<T extends object>(props: PickerFieldProps<T>): JSX.Element {
	const {
		children,
		description,
		errorMessage,
		items,
		label,
		necessityIndicator,
		placeholder,
		size = 'medium',
		...pickerInputProps
	} = props;
	const iconSize = size === 'small' ? 'xsmall' : 'small';

	return (
		<PickerInput {...pickerInputProps} placeholder={placeholder}>
			<Field
				description={description}
				errorMessage={errorMessage}
				label={label}
				necessityIndicator={necessityIndicator}
			>
				<SelectInputGroup size={size}>
					<SelectTrigger size={size}>
						<SelectValue size={size} />
						<Icon aria-hidden name="chevronDown" size={iconSize} />
					</SelectTrigger>
				</SelectInputGroup>
				<SelectPopover>
					<SelectListBox items={items}>{children}</SelectListBox>
				</SelectPopover>
			</Field>
		</PickerInput>
	);
}
