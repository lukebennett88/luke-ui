import { useObjectRef } from '@react-aria/utils';
import type { JSX, ReactNode, Ref } from 'react';
import type { CheckboxRootProps } from '../primitives/checkbox/checkbox.js';
import {
	CheckboxContentBase,
	CheckboxControl,
	CheckboxIndicator,
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
	'aria-label' | 'aria-labelledby' | 'children' | 'inputRef' | 'isInvalid'
>;

interface _CheckboxBaseProps extends _CheckboxOmit {
	/** Supporting text shown beneath the checkbox label. */
	description?: ReactNode;
	/** Validation message for a controlled error. A non-empty message marks the field invalid. */
	errorMessage?: ReactNode;
	/**
	 * Forwarded to the underlying `<input type="checkbox">` element. A plain `ref` reaches the root
	 * element instead.
	 *
	 * Widened from React Aria's own `inputRef`, which only takes a ref object, so a
	 * callback ref (what form libraries hand out) is accepted too.
	 */
	inputRef?: Ref<HTMLInputElement>;
}

type _CheckboxProps = _CheckboxBaseProps & FieldAccessibleNameProps;

/** Props for `Checkbox`. */
export type CheckboxProps = Prettify<_CheckboxProps>;

/**
 * A labelled checkbox with optional description and validation message.
 *
 * The control renders before the label. The label sits inside a native `<label>`, so pass textual,
 * non-interactive content. Name a checkbox that has no visible label with `aria-label` or
 * `aria-labelledby`, which renders the control alone and no required marker.
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
				<CheckboxContentBase hasLabelText={label != null} necessityIndicator={necessityIndicator}>
					<CheckboxControl>
						<CheckboxIndicator />
					</CheckboxControl>
					{label != null ? <span>{label}</span> : null}
				</CheckboxContentBase>
			</InlineField>
		</CheckboxRoot>
	);
}
