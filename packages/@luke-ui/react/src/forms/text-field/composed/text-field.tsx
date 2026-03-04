import type { JSX, ReactNode } from 'react';
import type {
	InputProps as RacInputProps,
	TextFieldProps as RacTextFieldProps,
} from 'react-aria-components';
import { TextField as RacTextField } from 'react-aria-components';
import { Field } from '../../field/composed/field.js';
import type { FieldErrorProps } from '../../field/primitives/field-error.js';
import type { FieldNecessityIndicator } from '../../field/primitives/field-label.js';
import type { TextInputSize } from '../../text-input/primitives/text-input.js';
import { TextInput } from '../../text-input/primitives/text-input.js';

export interface TextFieldProps extends Omit<RacTextFieldProps, 'children' | 'size'> {
	adornmentEnd?: ReactNode;
	adornmentStart?: ReactNode;
	description?: ReactNode;
	errorMessage?: FieldErrorProps['children'];
	inputClassName?: RacInputProps['className'];
	label?: ReactNode;
	necessityIndicator?: FieldNecessityIndicator;
	placeholder?: string;
	size?: TextInputSize;
}

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
