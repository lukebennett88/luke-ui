import type { JSX, ReactNode, Ref } from 'react';
import type { InputProps as RacInputProps } from 'react-aria-components/Input';
import type { FieldAccessibleNameProps } from '../primitives/field/field.js';
import {
	Field,
	isInvalidFromErrorMessage,
	normalizeErrorMessage,
} from '../primitives/field/field.js';
import type { TextInputSize } from '../primitives/text-input/recipe.css.js';
import type { TextInputRootProps } from '../primitives/text-input/text-input.js';
import {
	TextInput,
	TextInputControl,
	TextInputPrefix,
	TextInputRoot,
	TextInputSuffix,
} from '../primitives/text-input/text-input.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { DocumentedInputProps } from '../types/documented-rac-props.js';
import type { Prettify } from '../types/prettify.js';

type _TextInputFieldOmit = DistributiveOmit<
	TextInputRootProps,
	| 'aria-label'
	| 'aria-labelledby'
	| 'children'
	| 'id'
	| 'inputId'
	| 'isInvalid'
	| 'ref'
	| 'size'
	| keyof DocumentedInputProps
>;

interface _TextInputFieldBaseProps extends _TextInputFieldOmit, DocumentedInputProps {
	/** Validation message for a controlled error. A non-empty message marks the field invalid. */
	errorMessage?: ReactNode;
	/** Element id for the field's root element. Use `inputId` for the input. */
	id?: TextInputRootProps['id'];
	/** Class name forwarded to the inner input element. */
	inputClassName?: RacInputProps['className'];
	/** Element id for the input. The field generates one when omitted. */
	inputId?: TextInputRootProps['inputId'];
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
	/** Control size. @default 'medium' */
	size?: TextInputSize;
	/** Element shown after the input value. */
	suffix?: ReactNode;
}

type _TextInputFieldProps = _TextInputFieldBaseProps & FieldAccessibleNameProps;

/** Props for `TextInputField`. */
export type TextInputFieldProps = Prettify<_TextInputFieldProps>;

/**
 * A single-line text input with a label, description, and validation message.
 *
 * It always renders a `TextInputControl`, so the invalid icon sits inside the control with or
 * without `prefix` and `suffix`.
 */
export function TextInputField(props: TextInputFieldProps): JSX.Element {
	const {
		description,
		errorMessage,
		inputClassName,
		inputRef,
		label,
		necessityIndicator,
		placeholder,
		prefix,
		size = 'medium',
		suffix,
		...rootProps
	} = props;

	const normalizedErrorMessage = normalizeErrorMessage(errorMessage);

	return (
		<TextInputRoot
			{...rootProps}
			isInvalid={isInvalidFromErrorMessage(normalizedErrorMessage)}
			size={size}
		>
			<Field
				description={description}
				errorMessage={normalizedErrorMessage}
				label={label}
				necessityIndicator={necessityIndicator}
			>
				<TextInputControl>
					{prefix != null ? <TextInputPrefix>{prefix}</TextInputPrefix> : null}
					<TextInput className={inputClassName} placeholder={placeholder} ref={inputRef} />
					{suffix != null ? <TextInputSuffix>{suffix}</TextInputSuffix> : null}
				</TextInputControl>
			</Field>
		</TextInputRoot>
	);
}
