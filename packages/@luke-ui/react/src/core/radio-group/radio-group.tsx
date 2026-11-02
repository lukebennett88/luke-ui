import type { JSX, ReactNode } from 'react';
import { FieldDescription } from '../primitives/field/description.js';
import type { FieldAccessibleNameProps } from '../primitives/field/field.js';
import { FieldGroupLayout } from '../primitives/field/group.js';
import {
	isInvalidFromErrorMessage,
	normalizeErrorMessage,
} from '../primitives/field/is-invalid-from-error-message.js';
import { fieldRecipe } from '../primitives/field/recipe.css.js';
import type { RadioGroupRootProps, RadioRootProps } from '../primitives/radio/radio.js';
import {
	RadioControl,
	RadioGroupRoot,
	RadioIndicator,
	RadioLabel,
	RadioRoot,
} from '../primitives/radio/radio.js';
import { radioRecipe } from '../primitives/radio/styles.css.js';
import type { ControlSize } from '../sizing/control-size.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { Prettify } from '../types/prettify.js';

type _RadioGroupOmit = DistributiveOmit<
	RadioGroupRootProps,
	| 'aria-label'
	| 'aria-labelledby'
	| 'children'
	| 'className'
	| 'isInvalid'
	| 'orientation'
	| 'size'
	| 'slot'
>;

interface _RadioGroupBaseProps extends _RadioGroupOmit {
	/** Radio options. */
	children: ReactNode;
	/** Validation message for a controlled error. A non-empty message marks the group invalid. */
	errorMessage?: ReactNode;
	/** Class name for the group root. */
	className?: RadioGroupRootProps['className'];
	/** The group layout and keyboard-navigation direction. */
	orientation?: RadioGroupRootProps['orientation'];
	/**
	 * Visual size supplied to options that do not set their own size.
	 * @default 'medium'
	 */
	size?: ControlSize;
}

/** Props for `RadioGroup`. */
export type RadioGroupProps = Prettify<_RadioGroupBaseProps & FieldAccessibleNameProps>;

/**
 * A single-choice group with a shared label, optional description, validation message, and radio
 * options.
 */
export function RadioGroup(props: RadioGroupProps): JSX.Element {
	const {
		children,
		className,
		description,
		errorMessage,
		isRequired,
		label,
		necessityIndicator,
		orientation = 'vertical',
		size,
		...rootProps
	} = props;
	const normalizedErrorMessage = normalizeErrorMessage(errorMessage);

	return (
		<RadioGroupRoot
			{...rootProps}
			className={className}
			isInvalid={isInvalidFromErrorMessage(normalizedErrorMessage)}
			isRequired={isRequired}
			orientation={orientation}
			size={size}
		>
			<FieldGroupLayout
				description={description}
				errorMessage={normalizedErrorMessage}
				isRequired={isRequired ?? false}
				label={label}
				necessityIndicator={necessityIndicator}
				orientation={orientation}
			>
				{children}
			</FieldGroupLayout>
		</RadioGroupRoot>
	);
}

type _RadioFieldOmit = DistributiveOmit<
	RadioRootProps,
	'aria-label' | 'aria-labelledby' | 'children' | 'slot'
>;

interface _RadioFieldProps extends _RadioFieldOmit {
	/** Supporting text shown beneath the option label. */
	description?: ReactNode;
	/**
	 * Visible option label. Pass non-empty, textual, non-interactive content. Place links and buttons
	 * outside the label.
	 */
	label: Exclude<ReactNode, boolean | null | undefined>;
}

/** Props for `RadioField`. */
export type RadioFieldProps = Prettify<_RadioFieldProps>;

/** A labelled option within a `RadioGroup`, with optional supporting text. */
export function RadioField(props: RadioFieldProps): JSX.Element {
	const { description, label, size, ...rootProps } = props;

	return (
		<RadioRoot {...rootProps} size={size}>
			<RadioLabel>
				<RadioControl>
					<RadioIndicator />
				</RadioControl>
				<span className={fieldRecipe().inlineLabelText()}>{label}</span>
			</RadioLabel>
			{description != null ? (
				<FieldDescription
					className={radioRecipe().description({ className: fieldRecipe().message() })}
				>
					{description}
				</FieldDescription>
			) : null}
		</RadioRoot>
	);
}
