import type { JSX, ReactNode } from 'react';
import type {
	InputProps as RacInputProps,
	TextFieldProps as RacTextFieldProps,
} from 'react-aria-components/TextField';
import { TextField as RacTextField } from 'react-aria-components/TextField';
import type { FieldSlotProps } from '../field/compose-field.js';
import { composeField } from '../field/compose-field.js';
import { Field } from '../field/primitive/index.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { DocumentedInputProps } from '../types/documented-rac-props.js';
import type { Prettify } from '../types/prettify.js';
import type { TextInputSize } from './primitive/index.js';
import { TextInput } from './primitive/index.js';

type _TextFieldOmit = DistributiveOmit<RacTextFieldProps, 'children' | keyof DocumentedInputProps>;

interface _TextFieldProps extends _TextFieldOmit, DocumentedInputProps, FieldSlotProps {
	/** Element shown after the input value. */
	adornmentEnd?: ReactNode;
	/** Element shown before the input value. */
	adornmentStart?: ReactNode;
	/** Class name forwarded to the inner input element. */
	inputClassName?: RacInputProps['className'];
	/** Placeholder text for the input. */
	placeholder?: string;
	/** Control size. Defaults to `'medium'`. */
	size?: TextInputSize;
}

/**
 * Props for the composed text field.
 *
 * @tier composed
 */
export type TextFieldProps = Prettify<_TextFieldProps>;

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
