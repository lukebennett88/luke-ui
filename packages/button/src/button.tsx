import type { AriaButtonProps } from '@react-aria/button';
import { useButton as useAriaButton } from '@react-aria/button';
import type { ButtonHTMLAttributes, ForwardedRef } from 'react';
import { forwardRef, useRef } from 'react';

////////////////////////////////////////////////////////////////////////////////

/**
 * Button
 *
 * @description Buttons are an interactive element activated by a user with a
 * mouse, keyboard, finger, voice command, or other assistive technology. Once
 * activated, it then performs a programmable action, such as submitting a form
 * or opening a dialog.
 *
 * @see https://luke-ui.vercel.app/package/button
 */

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
	props: ButtonProps,
	forwardedRef: ForwardedRef<HTMLButtonElement>
) {
	const { children, tabIndex, ...useButtonProps } = props;
	const { buttonProps } = useButton(useButtonProps);

	return (
		<button ref={forwardedRef} tabIndex={tabIndex} {...buttonProps}>
			{children}
		</button>
	);
});

type NativeButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;
type ButtonProps = {
	/**
	 * Identifies the element (or elements) whose contents or presence are
	 * controlled by the current element.
	 * @see [MDN](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-controls)
	 */
	'aria-controls'?: NativeButtonProps['aria-controls'];
	/**
	 * Identifies the element (or elements) that labels the current element.
	 * @see [MDN](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-describedby)
	 */
	'aria-describedby'?: NativeButtonProps['aria-describedby'];
	/**
	 * Identifies the element (or elements) that provide a detailed, extended
	 * description for the object.
	 * @see [MDN](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-details)
	 */
	'aria-details'?: NativeButtonProps['aria-details'];
	/**
	 * Indicates whether the element, or another grouping element it controls, is
	 * currently expanded or collapsed.
	 * @see [MDN](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-expanded)
	 */
	'aria-expanded'?: NativeButtonProps['aria-expanded'];
	/**
	 * Indicates the availability and type of interactive popup element, such as
	 * menu or dialog, that can be triggered by an element.
	 * @see [MDN](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-haspopup)
	 */
	'aria-haspopup'?: NativeButtonProps['aria-haspopup'];
	/**
	 * Defines a string value that labels the current element.
	 * @see [MDN](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-label)
	 * */
	'aria-label'?: NativeButtonProps['aria-label'];
	/**
	 * Identifies the element (or elements) that labels the current element.
	 * @see [MDN](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-labelledby)
	 * */
	'aria-labelledby'?: NativeButtonProps['aria-labelledby'];
	/**
	 * Indicates the current "pressed" state of toggle buttons.
	 * @see [MDN](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-pressed)
	 */
	'aria-pressed'?: NativeButtonProps['aria-pressed'];
	/** Whether the element should receive focus on render. */
	'autoFocus'?: NativeButtonProps['autoFocus'];
	/**
	 * The content to display in the button.
	 */
	'children': NativeButtonProps['children'];
	// "data": NativeButtonProps['data']
	/** Whether the button is disabled. */
	'disabled'?: NativeButtonProps['disabled'];
	/**
	 * The element's unique identifier.
	 * @see [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/id).
	 */
	'id'?: NativeButtonProps['id'];
	/**
	 * The name of the button, submitted as a pair with the button's value as part
	 * of the form data, when that button is used to submit the form.
	 */
	'name'?: NativeButtonProps['name'];
	/** Handler that is called when the element loses focus. */
	'onBlur'?: AriaButtonProps['onBlur'];
	/** Handler that is called when the element receives focus. */
	'onFocus'?: AriaButtonProps['onFocus'];
	/** Handler that is called when the press is released over the target. */
	'onPress'?: AriaButtonProps['onPress'];
	/** Handler that is called when a press interaction starts. */
	'onPressStart'?: AriaButtonProps['onPressStart'];
	/**
	 * Handler that is called when a press interaction ends, either
	 * over the target or when the pointer leaves the target.
	 */
	'onPressEnd'?: AriaButtonProps['onPressEnd'];
	/** Handler that is called when the press state changes. */
	'onPressChange'?: AriaButtonProps['onPressChange'];
	/**
	 * Handler that is called when a press is released over the target, regardless of
	 * whether it started on the target or not.
	 */
	'onPressUp'?: AriaButtonProps['onPressUp'];
	/**
	 * Indicates that its element can be focused, and where it participates in
	 * sequential keyboard navigation (usually with the "Tab" key).
	 * @see [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/tabindex)
	 */
	'tabIndex'?: NativeButtonProps['tabIndex'];
	/**
	 * The behavior of the button when used in an HTML form.
	 * @default 'button'
	 */
	'type'?: NativeButtonProps['type'];
	/**
	 * Defines the value associated with the button's name when it's submitted
	 * with the form data.
	 */
	'value'?: NativeButtonProps['value'];

	/** @todo add these props */
	// "loading": NativeButtonProps['loading']
	// "prominence": NativeButtonProps['prominence']
	// "size": NativeButtonProps['size']
	// "tone": NativeButtonProps['tone']
};

////////////////////////////////////////////////////////////////////////////////

/**
 * useButton
 *
 * @description Provides the behavior and accessibility implementation for a
 * button component.
 * Handles mouse, keyboard, and touch interactions, focus behavior, and ARIA
 * props for both native button elements and custom element types.
 */

export function useButton(props: UseButtonProps) {
	const ref = useRef(null);
	return useAriaButton(
		{
			...props,
			isDisabled: props.disabled,
		},
		ref
	);
}

export type UseButtonProps = Omit<ButtonProps, 'children' | 'tabIndex'>;

////////////////////////////////////////////////////////////////////////////////

export { Button };
export type { ButtonProps };
