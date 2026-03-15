import type { JSX, ReactNode } from 'react';
import type { Key } from 'react-aria-components';
import { Icon } from '../../../visuals/icon/primitives/icon.js';
import { Field } from '../../field/composed/field.js';
import type { FieldErrorProps } from '../../field/primitives/field-error.js';
import type { FieldNecessityIndicator } from '../../field/primitives/field-label.js';
import type {
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

/** Props for composed `SelectField` (searchable single-select). */
export interface SelectFieldProps<T extends object> {
	/** Item content for the listbox (render prop or static children). */
	children: SelectListBoxProps<T>['children'];

	/** Items passed to the inner listbox for controlled mode. */
	items?: SelectListBoxProps<T>['items'];

	/** Initial items for uncontrolled mode. */
	defaultItems?: SelectListBoxProps<T>['items'];

	/** Controlled selected key. Pass `null` for no selection. */
	selectedKey?: Key | null;

	/** The initial selected key (uncontrolled). */
	defaultSelectedKey?: Key | null;

	/** Called when the selection changes. */
	onSelectionChange?: (key: Key | null) => void;

	/** Input value (controlled). */
	inputValue?: string;

	/** The initial input value (uncontrolled). */
	defaultInputValue?: string;

	/** Called when the input value changes. */
	onInputChange?: (value: string) => void;

	/** Whether the popover is open (controlled). */
	isOpen?: boolean;

	/** The initial open state (uncontrolled). */
	defaultOpen?: boolean;

	/** Called when the open state changes. */
	onOpenChange?: (isOpen: boolean) => void;

	/** Item keys that are disabled and cannot be selected, focused, or interacted with. */
	disabledKeys?: Iterable<Key>;

	/** Whether the input is disabled. */
	isDisabled?: boolean;

	/** Whether the input is read-only. */
	isReadOnly?: boolean;

	/** Whether user input is required before form submission. */
	isRequired?: boolean;

	/** Whether the input value is invalid. */
	isInvalid?: boolean;

	/** The name of the input, used when submitting an HTML form. */
	name?: string;

	/** Whether the input should receive focus on mount. */
	autoFocus?: boolean;

	/**
	 * Validation mode. Use `'native'` to block submit on invalid fields, or `'aria'` to expose
	 * invalid state to assistive tech without blocking submit.
	 * @default 'native'
	 */
	validationBehavior?: 'native' | 'aria';

	/** Helper text shown below the control. */
	description?: ReactNode;

	/** Error content passed to `FieldError`. */
	errorMessage?: FieldErrorProps['children'];

	/** Label content shown above the control. */
	label?: ReactNode;

	/** Label necessity style. @default 'icon' */
	necessityIndicator?: FieldNecessityIndicator;

	/** Placeholder text shown in the input. */
	placeholder?: string;

	/** Control size. @default 'medium' */
	size?: SelectInputSize;
}

/** Composes `SelectInput` with label, description, and error slots. */
export function SelectField<T extends object>(props: SelectFieldProps<T>): JSX.Element {
	const {
		children,
		defaultItems,
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
		<SelectInput<T> {...selectInputProps} defaultItems={defaultItems} items={items}>
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
