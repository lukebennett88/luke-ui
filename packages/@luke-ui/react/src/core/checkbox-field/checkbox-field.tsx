import type { JSX, ReactNode } from 'react';
import type { CheckboxRootProps } from '../primitives/checkbox/checkbox.js';
import {
	CheckboxControl,
	CheckboxIndicator,
	CheckboxLabel,
	CheckboxRoot,
} from '../primitives/checkbox/checkbox.js';
import type { FieldNecessityIndicator } from '../primitives/field/field.js';
import {
	InlineField,
	isInvalidFromErrorMessage,
	normalizeErrorMessage,
} from '../primitives/field/field.js';
import { InlineLabelText } from '../primitives/field/inline-label-text.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { Prettify } from '../types/prettify.js';

type _CheckboxFieldOmit = DistributiveOmit<
	CheckboxRootProps,
	'aria-label' | 'aria-labelledby' | 'children' | 'isInvalid' | 'slot'
>;

interface _CheckboxFieldProps extends _CheckboxFieldOmit {
	/** Supporting text shown beneath the checkbox label. */
	description?: ReactNode;
	/** Validation message for a controlled error. A non-empty message marks the field invalid. */
	errorMessage?: ReactNode;
	/**
	 * Visible label. Pass non-empty, textual, non-interactive content. Place links and buttons
	 * outside the checkbox.
	 */
	label: Exclude<ReactNode, boolean | null | undefined>;
	/**
	 * How a required checkbox is marked.
	 * @default 'icon'
	 */
	necessityIndicator?: FieldNecessityIndicator;
}

/** Props for `CheckboxField`. */
export type CheckboxFieldProps = Prettify<_CheckboxFieldProps>;

/**
 * A labelled checkbox with optional description and validation message.
 *
 * `id`, `className`, and `ref` target the root element. `inputId` and `inputRef` target the input.
 */
export function CheckboxField(props: CheckboxFieldProps): JSX.Element {
	const { description, errorMessage, label, necessityIndicator, ...rootProps } = props;
	const normalizedErrorMessage = normalizeErrorMessage(errorMessage);

	return (
		<CheckboxRoot {...rootProps} isInvalid={isInvalidFromErrorMessage(normalizedErrorMessage)}>
			<InlineField description={description} errorMessage={normalizedErrorMessage}>
				<CheckboxLabel>
					<CheckboxControl>
						<CheckboxIndicator />
					</CheckboxControl>
					<InlineLabelText necessityIndicator={necessityIndicator}>{label}</InlineLabelText>
				</CheckboxLabel>
			</InlineField>
		</CheckboxRoot>
	);
}
