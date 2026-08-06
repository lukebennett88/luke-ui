import { useObjectRef } from '@react-aria/utils';
import type { JSX, ReactNode, Ref } from 'react';
import type { CheckboxFieldProps as RacCheckboxFieldProps } from 'react-aria-components/Checkbox';
import { FieldDescription, FieldError } from '../field/primitive/index.js';
import type { FieldErrorProps } from '../field/primitive/index.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { Prettify } from '../types/prettify.js';
import {
	Checkbox as PrimitiveCheckbox,
	CheckboxContent,
	CheckboxControl,
	CheckboxIndicator,
} from './primitive/index.js';
import type { CheckboxProps as PrimitiveCheckboxProps } from './primitive/index.js';

type _CheckboxOmit = DistributiveOmit<RacCheckboxFieldProps, 'children' | 'inputRef'>;

interface _CheckboxProps extends _CheckboxOmit {
	/** Checkbox label content. */
	children: ReactNode;
	/**
	 * Forwarded to the underlying `<input type="checkbox">` element.
	 *
	 * Composed fields take no plain `ref`: `inputRef` is the only way to reach the
	 * control, so a ref can never silently resolve to a wrapper element instead.
	 *
	 * Widened from React Aria's own `inputRef`, which only takes a ref object, so a
	 * callback ref (what form libraries hand out) is accepted too.
	 */
	inputRef?: Ref<HTMLInputElement>;
	/**
	 * Visual size of the checkbox control.
	 *
	 * @default 'medium'
	 */
	size?: PrimitiveCheckboxProps['size'];
	/** Supporting text shown beneath the checkbox label. */
	description?: ReactNode;
	/** Validation message shown when the checkbox is invalid. */
	errorMessage?: FieldErrorProps['children'];
	/** Whether the checkbox is selected. */
	isSelected?: PrimitiveCheckboxProps['isSelected'];
	/** Initial selection state for an uncontrolled checkbox. */
	defaultSelected?: PrimitiveCheckboxProps['defaultSelected'];
	/** Whether the checkbox displays a mixed selection state. */
	isIndeterminate?: PrimitiveCheckboxProps['isIndeterminate'];
	/** Whether the checkbox is unavailable. */
	isDisabled?: PrimitiveCheckboxProps['isDisabled'];
	/** Whether the checkbox is invalid. */
	isInvalid?: PrimitiveCheckboxProps['isInvalid'];
	/** Whether the checkbox can be read but not changed. */
	isReadOnly?: PrimitiveCheckboxProps['isReadOnly'];
	/** Whether the checkbox is required before the form can submit. */
	isRequired?: PrimitiveCheckboxProps['isRequired'];
	/** Called when the selection changes. */
	onChange?: PrimitiveCheckboxProps['onChange'];
}

/**
 * Props for the composed Checkbox.
 *
 * @tier composed
 */
export type CheckboxProps = Prettify<_CheckboxProps>;

/** A labelled checkbox with optional description and validation message. */
export function Checkbox(props: CheckboxProps): JSX.Element {
	const { children, description, errorMessage, inputRef, ...checkboxProps } = props;
	// React Aria reads `inputRef.current`, so a callback ref cannot be handed to it
	// directly; `useObjectRef` gives it the object ref it wants while still calling
	// the caller's callback.
	const objectInputRef = useObjectRef(inputRef);

	return (
		<PrimitiveCheckbox {...checkboxProps} inputRef={objectInputRef}>
			<CheckboxContent>
				<CheckboxControl>
					<CheckboxIndicator />
				</CheckboxControl>
				{children}
			</CheckboxContent>
			{description != null ? <FieldDescription>{description}</FieldDescription> : null}
			<FieldError>{errorMessage}</FieldError>
		</PrimitiveCheckbox>
	);
}
