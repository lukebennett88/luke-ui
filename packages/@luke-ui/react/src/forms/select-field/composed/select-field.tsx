import type { JSX, ReactNode } from 'react';
import { Icon } from '../../../visuals/icon/primitives/icon.js';
import { Field } from '../../field/composed/field.js';
import type { FieldErrorProps } from '../../field/primitives/field-error.js';
import type { FieldNecessityIndicator } from '../../field/primitives/field-label.js';
import type {
	SelectInputProps,
	SelectInputSize,
	SelectListBoxProps,
} from '../../select-input/primitives/select-input.js';
import {
	SelectInput,
	SelectInputGroup,
	SelectInputText,
	SelectListBox,
	SelectPopover,
	SelectTrigger,
} from '../../select-input/primitives/select-input.js';

/** Props for composed `SelectField` (combobox pattern). */
export interface SelectFieldProps<T extends object> extends Omit<
	SelectInputProps<T>,
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
	/** Placeholder text shown in the input. */
	placeholder?: string;
	/** Control size. Defaults to `'medium'`. */
	size?: SelectInputSize;
}

/** Composed field for searchable single-select combobox usage. */
export function SelectField<T extends object>(props: SelectFieldProps<T>): JSX.Element {
	const {
		children,
		description,
		errorMessage,
		items,
		label,
		necessityIndicator,
		placeholder,
		size = 'medium',
		...selectInputProps
	} = props;
	const iconSize = size === 'small' ? 'xsmall' : 'small';

	return (
		<SelectInput<T> {...selectInputProps}>
			<Field
				description={description}
				errorMessage={errorMessage}
				label={label}
				necessityIndicator={necessityIndicator}
			>
				<SelectInputGroup size={size}>
					<SelectInputText placeholder={placeholder} size={size} />
					<SelectTrigger aria-label="Toggle options" size={size}>
						<Icon aria-hidden name="chevronDown" size={iconSize} />
					</SelectTrigger>
				</SelectInputGroup>
				<SelectPopover offset={4}>
					<SelectListBox<T> items={items}>{children}</SelectListBox>
				</SelectPopover>
			</Field>
		</SelectInput>
	);
}
