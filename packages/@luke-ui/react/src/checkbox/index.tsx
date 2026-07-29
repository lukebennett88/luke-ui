import type { JSX, ReactNode } from 'react';
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

type _CheckboxOmit = DistributiveOmit<RacCheckboxFieldProps, 'children'>;

interface _CheckboxProps extends _CheckboxOmit {
	/** Checkbox label content. */
	children: ReactNode;
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
	const { children, description, errorMessage, ...checkboxProps } = props;

	return (
		<PrimitiveCheckbox {...checkboxProps}>
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
