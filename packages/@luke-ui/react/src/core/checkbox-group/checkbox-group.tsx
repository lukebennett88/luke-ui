import type { JSX, ReactNode, Ref } from 'react';
import { Fragment, useState } from 'react';
import type { CheckboxGroupProps as RacCheckboxGroupProps } from 'react-aria-components/CheckboxGroup';
import { CheckboxGroup as RacCheckboxGroup } from 'react-aria-components/CheckboxGroup';
import type { FieldErrorProps } from '../primitives/field/error.js';
import type { FieldAccessibleNameProps } from '../primitives/field/field.js';
import { FieldGroupLayout } from '../primitives/field/group.js';
import {
	isInvalidFromErrorMessage,
	normalizeErrorMessage,
} from '../primitives/field/is-invalid-from-error-message.js';
import type { NecessityIndicator } from '../primitives/field/necessity-context.js';
import { ControlSizeContext, useControlSize } from '../sizing/control-size-context.js';
import type { ControlSize } from '../sizing/control-size.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { Prettify } from '../types/prettify.js';
import type { CheckboxGroupErrorMessages } from './error-message-context.js';
import { CheckboxGroupErrorMessagesContext } from './error-message-context.js';

type _CheckboxGroupOmit = DistributiveOmit<
	RacCheckboxGroupProps,
	| 'aria-label'
	| 'aria-labelledby'
	| 'children'
	| 'className'
	| 'id'
	| 'isInvalid'
	| 'isReadOnly'
	| 'render'
>;

interface _CheckboxGroupBaseProps extends _CheckboxGroupOmit {
	/** Options and their supporting text. */
	children: ReactNode;
	/** Class name for the group element. */
	className?: RacCheckboxGroupProps['className'];
	/** Supporting text shown below the group label. */
	description?: ReactNode;
	/** Validation message for a controlled error. A non-empty message marks the group invalid. */
	errorMessage?: ReactNode;
	/** The form element to associate the group's checkboxes with, by id. */
	form?: RacCheckboxGroupProps['form'];
	/** Element id for the group element. */
	id?: string;
	/** Whether the entire group is disabled. */
	isDisabled?: RacCheckboxGroupProps['isDisabled'];
	/** Whether at least one option must be selected. */
	isRequired?: RacCheckboxGroupProps['isRequired'];
	/** Name submitted with the selected checkbox values. */
	name?: RacCheckboxGroupProps['name'];
	/** Called when the selected options change. */
	onChange?: RacCheckboxGroupProps['onChange'];
	/** Controls whether options stack or wrap in rows. @default 'vertical' */
	orientation?: 'vertical' | 'horizontal';
	/** Ref forwarded to the group element. */
	ref?: Ref<HTMLDivElement>;
	/** Default recipe size for its options. An option's explicit size takes precedence. */
	size?: ControlSize;
	/** Controls how the group label identifies required or optional values. */
	necessityIndicator?: NecessityIndicator;
	/** Selected options (controlled). */
	value?: RacCheckboxGroupProps['value'];
}

type _CheckboxGroupProps = _CheckboxGroupBaseProps & FieldAccessibleNameProps;

/** Props for `CheckboxGroup`. */
export type CheckboxGroupProps = Prettify<_CheckboxGroupProps>;

/** A labelled set of independently selectable checkboxes with shared validation. */
export function CheckboxGroup(props: CheckboxGroupProps): JSX.Element {
	const {
		children,
		className,
		description,
		errorMessage,
		id,
		isDisabled,
		isRequired,
		label,
		necessityIndicator,
		onChange,
		orientation = 'vertical',
		ref,
		size: sizeProp,
		...groupProps
	} = props;
	const size = useControlSize(sizeProp);
	const [childErrorMessages, setChildErrorMessages] = useState<CheckboxGroupErrorMessages>(
		() => new Map(),
	);
	const normalizedErrorMessage = normalizeErrorMessage(errorMessage);
	const authoredMessages = [
		...(normalizedErrorMessage === undefined ? [] : [normalizedErrorMessage]),
		...childErrorMessages.values(),
	];
	const isInvalid =
		isInvalidFromErrorMessage(normalizedErrorMessage) ??
		(childErrorMessages.size > 0 ? true : undefined);
	const renderErrorMessage = createErrorMessage(authoredMessages);

	return (
		<ControlSizeContext value={size}>
			<RacCheckboxGroup
				{...groupProps}
				className={className}
				id={id}
				isDisabled={isDisabled}
				isInvalid={isInvalid}
				isRequired={isRequired}
				onChange={onChange}
				ref={ref}
			>
				<CheckboxGroupErrorMessagesContext value={setChildErrorMessages}>
					<FieldGroupLayout
						description={description}
						errorMessage={renderErrorMessage}
						isRequired={isRequired ?? false}
						label={label}
						necessityIndicator={necessityIndicator}
						orientation={orientation}
					>
						{children}
					</FieldGroupLayout>
				</CheckboxGroupErrorMessagesContext>
			</RacCheckboxGroup>
		</ControlSizeContext>
	);
}

function createErrorMessage(messages: Array<ReactNode>): FieldErrorProps['children'] {
	return ({ defaultChildren, validationErrors }) => {
		const validationMessages = new Set(validationErrors);
		const authoredMessages = messages.filter((message) => {
			return typeof message !== 'string' || !validationMessages.has(message);
		});
		const renderedMessages = authoredMessages.map((message, index) => (
			<Fragment key={index}>
				{index > 0 ? <br /> : null}
				{message}
			</Fragment>
		));

		if (defaultChildren == null) return renderedMessages;
		if (renderedMessages.length === 0) return defaultChildren;

		return (
			<>
				{renderedMessages}
				<br />
				{defaultChildren}
			</>
		);
	};
}
