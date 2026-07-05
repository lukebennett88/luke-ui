import type { ButtonProps as RacButtonProps } from 'react-aria-components/Button';
import type { LinkProps as RacLinkProps } from 'react-aria-components/Link';
import type { TextFieldProps as RacTextFieldProps } from 'react-aria-components/TextField';

export interface DocumentedPressProps {
	/**
	 * Whether the button is disabled. Disabled buttons can't be focused or pressed.
	 * @default false
	 */
	isDisabled?: RacButtonProps['isDisabled'];
	/** Press handler. Called on click, Enter, or Space. */
	onPress?: RacButtonProps['onPress'];
	/** HTML button type. */
	type?: RacButtonProps['type'];
}

export interface DocumentedLinkProps {
	/** URL the link points to. */
	href?: RacLinkProps['href'];
	/**
	 * Whether the link is disabled. Disabled links can't be focused or activated.
	 * @default false
	 */
	isDisabled?: RacLinkProps['isDisabled'];
}

export interface DocumentedInputProps {
	/** Initial value (uncontrolled). */
	defaultValue?: RacTextFieldProps['defaultValue'];
	/** Whether the field is disabled. */
	isDisabled?: RacTextFieldProps['isDisabled'];
	/** Whether the field has a validation error. */
	isInvalid?: RacTextFieldProps['isInvalid'];
	/** Whether the field is read-only. */
	isReadOnly?: RacTextFieldProps['isReadOnly'];
	/** Called when the value changes. */
	onChange?: RacTextFieldProps['onChange'];
	/** Controlled input value. */
	value?: RacTextFieldProps['value'];
}
