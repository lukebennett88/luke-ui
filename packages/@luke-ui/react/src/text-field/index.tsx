import type { JSX, ReactNode } from 'react';
import type {
	InputProps as RacInputProps,
	TextFieldProps as RacTextFieldProps,
} from 'react-aria-components/TextField';
import { TextField as RacTextField } from 'react-aria-components/TextField';
import { composeField } from '../field/compose-field.js';
import type { FieldErrorProps } from '../field/primitive/error.js';
import { Field } from '../field/primitive/index.js';
import type { FieldNecessityIndicator } from '../field/primitive/label.js';
import type { TextInputSize } from './primitive/index.js';
import { TextInput } from './primitive/index.js';

interface TextFieldRedeclaredRACProps {
	/** Initial value (uncontrolled). */
	defaultValue?: RacTextFieldProps['defaultValue'];
	/** Whether the field is disabled. */
	isDisabled?: RacTextFieldProps['isDisabled'];
	/** Whether the field has a validation error. */
	isInvalid?: RacTextFieldProps['isInvalid'];
	/** Whether the field is read-only. */
	isReadOnly?: RacTextFieldProps['isReadOnly'];
	/** Called when the value changes. */
	onChange?: RacTextFieldProps['onChange'];
	/** Controlled input value. */
	value?: RacTextFieldProps['value'];
}

/**
 * Props for the composed text field.
 *
 * @tier composed
 */
export interface TextFieldProps
	extends
		Omit<RacTextFieldProps, 'children' | 'size' | keyof TextFieldRedeclaredRACProps>,
		TextFieldRedeclaredRACProps {
	/** Element shown after the input value. */
	adornmentEnd?: ReactNode;
	/** Element shown before the input value. */
	adornmentStart?: ReactNode;
	/** Helper text shown below the control. */
	description?: ReactNode;
	/** Error content passed to `FieldError`. */
	errorMessage?: FieldErrorProps['children'];
	/** Class name forwarded to the inner input element. */
	inputClassName?: RacInputProps['className'];
	/** Label content shown above the input. */
	label?: ReactNode;
	/** Label necessity style. */
	necessityIndicator?: FieldNecessityIndicator;
	/** Placeholder text for the input. */
	placeholder?: string;
	/** Control size. Defaults to `'medium'`. */
	size?: TextInputSize;
}

/** Composes `TextInput` with label, description, and error slots. */
export function TextField(props: TextFieldProps): JSX.Element {
	const [fieldSlotProps, restProps] = composeField(props);
	const {
		adornmentEnd,
		adornmentStart,
		inputClassName,
		placeholder,
		size = 'medium',
		...textFieldProps
	} = restProps;

	return (
		<RacTextField {...textFieldProps}>
			<Field {...fieldSlotProps}>
				<TextInput
					adornmentEnd={adornmentEnd}
					adornmentStart={adornmentStart}
					inputClassName={inputClassName}
					placeholder={placeholder}
					size={size}
				/>
			</Field>
		</RacTextField>
	);
}
