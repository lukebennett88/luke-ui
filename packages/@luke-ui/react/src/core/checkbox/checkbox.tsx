import { useObjectRef } from '@react-aria/utils';
import type { JSX, ReactNode, Ref } from 'react';
import type { CheckboxRootProps } from '../primitives/checkbox/checkbox.js';
import {
	CheckboxContent,
	CheckboxControl,
	CheckboxIndicator,
	CheckboxLabel,
	CheckboxRoot,
} from '../primitives/checkbox/checkbox.js';
import type { FieldAccessibleNameProps } from '../primitives/field/field.js';
import {
	InlineField,
	isInvalidFromErrorMessage,
	normalizeErrorMessage,
} from '../primitives/field/field.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { Prettify } from '../types/prettify.js';

type _CheckboxOmit = DistributiveOmit<
	CheckboxRootProps,
	'aria-label' | 'aria-labelledby' | 'children' | 'inputRef' | 'isInvalid' | 'slot'
>;

interface _CheckboxBaseProps extends _CheckboxOmit {
	/** Supporting text shown beneath the checkbox label. */
	description?: ReactNode;
	/** Validation message for a controlled error. A non-empty message marks the field invalid. */
	errorMessage?: ReactNode;
	/**
	 * Forwarded to the `<input type="checkbox">` element. Accepts a callback ref or a ref object. Use
	 * `ref` for the root element.
	 */
	inputRef?: Ref<HTMLInputElement>;
}

type _CheckboxProps = _CheckboxBaseProps & FieldAccessibleNameProps;

/** Props for `Checkbox`. */
export type CheckboxProps = Prettify<_CheckboxProps>;

/**
 * A labelled checkbox with optional description and validation message.
 *
 * `id`, `className`, and `ref` target the root element. `inputId` and `inputRef` target the input.
 */
export function Checkbox(props: CheckboxProps): JSX.Element {
	const { description, errorMessage, inputRef, label, necessityIndicator, ...rootProps } = props;
	// React Aria types its own `inputRef` as a ref object, so a callback ref is a type
	// error even though it would work: RAC merges the ref itself. `useObjectRef` gives
	// the declared type what it asks for rather than leaning on that internal detail.
	const objectInputRef = useObjectRef(inputRef);
	const normalizedErrorMessage = normalizeErrorMessage(errorMessage);

	return (
		<CheckboxRoot
			{...rootProps}
			inputRef={objectInputRef}
			isInvalid={isInvalidFromErrorMessage(normalizedErrorMessage)}
		>
			<InlineField description={description} errorMessage={normalizedErrorMessage}>
				<CheckboxContent>
					<CheckboxControl>
						<CheckboxIndicator />
					</CheckboxControl>
					{label != null ? (
						<CheckboxLabel necessityIndicator={necessityIndicator}>{label}</CheckboxLabel>
					) : null}
				</CheckboxContent>
			</InlineField>
		</CheckboxRoot>
	);
}
