import type { JSX, ReactNode } from 'react';
import type { FieldNecessityIndicator } from '../primitives/field/field.js';
import {
	InlineField,
	isInvalidFromErrorMessage,
	normalizeErrorMessage,
} from '../primitives/field/field.js';
import { InlineLabelText } from '../primitives/field/inline-label-text.js';
import type { SwitchRootProps } from '../primitives/switch/switch.js';
import {
	SwitchControl,
	SwitchLabel,
	SwitchRoot,
	SwitchThumb,
} from '../primitives/switch/switch.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { Prettify } from '../types/prettify.js';

type _SwitchFieldOmit = DistributiveOmit<
	SwitchRootProps,
	'aria-label' | 'aria-labelledby' | 'children' | 'isInvalid' | 'slot'
>;

interface _SwitchFieldProps extends _SwitchFieldOmit {
	/** Supporting text shown beneath the switch label. */
	description?: ReactNode;
	/** Validation message for a controlled error. A non-empty message marks the field invalid. */
	errorMessage?: ReactNode;
	/**
	 * Visible label. Pass non-empty, textual, non-interactive content. Place links and buttons
	 * outside the switch.
	 */
	label: Exclude<ReactNode, boolean | null | undefined>;
	/**
	 * How a required switch is marked.
	 * @default 'icon'
	 */
	necessityIndicator?: FieldNecessityIndicator;
}

/** Props for `SwitchField`. */
export type SwitchFieldProps = Prettify<_SwitchFieldProps>;

/**
 * A labelled switch that turns a setting on or off, with optional description and validation
 * message.
 *
 * `id`, `className`, and `ref` target the root element. `inputId` and `inputRef` target the input.
 */
export function SwitchField(props: SwitchFieldProps): JSX.Element {
	const { description, errorMessage, label, necessityIndicator, ...rootProps } = props;
	const normalizedErrorMessage = normalizeErrorMessage(errorMessage);

	return (
		<SwitchRoot {...rootProps} isInvalid={isInvalidFromErrorMessage(normalizedErrorMessage)}>
			<InlineField description={description} errorMessage={normalizedErrorMessage}>
				<SwitchLabel>
					<SwitchControl>
						<SwitchThumb />
					</SwitchControl>
					<InlineLabelText necessityIndicator={necessityIndicator}>{label}</InlineLabelText>
				</SwitchLabel>
			</InlineField>
		</SwitchRoot>
	);
}
