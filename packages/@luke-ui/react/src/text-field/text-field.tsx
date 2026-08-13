import type { JSX, ReactNode, Ref } from 'react';
import type {
	InputProps as RacInputProps,
	TextFieldProps as RacTextFieldProps,
} from 'react-aria-components/TextField';
import { TextField as RacTextField } from 'react-aria-components/TextField';
import type { FieldSlotProps } from '../field/compose-field.js';
import { composeField } from '../field/compose-field.js';
import { Field } from '../primitives/field/field.js';
import {
	InputGroup,
	InputGroupInput,
	InputGroupPrefix,
	InputGroupSuffix,
} from '../primitives/input-group/input-group.js';
import type { InputGroupSize } from '../primitives/input-group/recipe.css.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { DocumentedInputProps } from '../types/documented-rac-props.js';
import type { Prettify } from '../types/prettify.js';

type _TextFieldOmit = DistributiveOmit<RacTextFieldProps, 'children' | keyof DocumentedInputProps>;

interface _TextFieldProps extends _TextFieldOmit, DocumentedInputProps, FieldSlotProps {
	/** Class name forwarded to the inner input element. */
	inputClassName?: RacInputProps['className'];
	/**
	 * Forwarded to the inner `<input>` element.
	 *
	 * This field takes no plain `ref`: `inputRef` is the only way to reach the
	 * control, so a ref can never silently resolve to a wrapper element instead.
	 */
	inputRef?: Ref<HTMLInputElement>;
	/** Placeholder text for the input. */
	placeholder?: string;
	/** Element shown before the input value. */
	prefix?: ReactNode;
	/** Control size. Defaults to `'medium'`. */
	size?: InputGroupSize;
	/** Element shown after the input value. */
	suffix?: ReactNode;
}

/** Props for `TextField`. */
export type TextFieldProps = Prettify<_TextFieldProps>;

/**
 * Composes the input group primitive with label, description, and error slots.
 *
 * `prefix` / `suffix` map onto the primitive's `InputGroupPrefix` /
 * `InputGroupSuffix` children below.
 */
export function TextField(props: TextFieldProps): JSX.Element {
	const [fieldSlotProps, restProps] = composeField(props);
	const {
		inputClassName,
		inputRef,
		placeholder,
		prefix,
		size = 'medium',
		suffix,
		...textFieldProps
	} = restProps;

	return (
		<RacTextField {...textFieldProps}>
			<Field {...fieldSlotProps}>
				<InputGroup size={size}>
					{prefix != null ? <InputGroupPrefix>{prefix}</InputGroupPrefix> : null}
					<InputGroupInput className={inputClassName} placeholder={placeholder} ref={inputRef} />
					{suffix != null ? <InputGroupSuffix>{suffix}</InputGroupSuffix> : null}
				</InputGroup>
			</Field>
		</RacTextField>
	);
}
