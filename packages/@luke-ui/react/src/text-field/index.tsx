import type { JSX, ReactNode } from 'react';
import type {
	InputProps as RacInputProps,
	TextFieldProps as RacTextFieldProps,
} from 'react-aria-components/TextField';
import { TextField as RacTextField } from 'react-aria-components/TextField';
import type { FieldErrorProps } from '../field/primitive/error.js';
import { Field } from '../field/primitive/index.js';
import type { FieldNecessityIndicator } from '../field/primitive/label.js';
import type { TextInputSize } from './primitive/index.js';
import { TextInput } from './primitive/index.js';

/** Props for the composed text field. */
export interface TextFieldProps extends Omit<RacTextFieldProps, 'children' | 'size'> {
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
	const {
		adornmentEnd,
		adornmentStart,
		description,
		errorMessage,
		inputClassName,
		label,
		necessityIndicator,
		placeholder,
		size = 'medium',
		...textFieldProps
	} = props;

	return (
		<RacTextField {...textFieldProps}>
			<Field
				description={description}
				errorMessage={errorMessage}
				label={label}
				necessityIndicator={necessityIndicator}
			>
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
