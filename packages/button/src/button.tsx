import type { ButtonHTMLAttributes, ForwardedRef } from 'react';
import { forwardRef } from 'react';

////////////////////////////////////////////////////////////////////////////////

/**
 * Button
 *
 * Buttons are an interactive element activated by a user with a
 * mouse, keyboard, finger, voice command, or other assistive technology. Once
 * activated, it then performs a programmable action, such as submitting a form
 * or opening a dialog.
 *
 * @see https://example.com/package/button
 */

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
	props: ButtonProps,
	forwardedRef: ForwardedRef<HTMLButtonElement>
) {
	return <button {...props} ref={forwardedRef} />;
});

type NativeButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;
type ButtonProps = {
	/**
	 * Identifies the element (or elements) whose contents or presence are
	 * controlled by the element on which this attribute is set.
	 *
	 * @see https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-controls
	 */
	'aria-controls'?: NativeButtonProps['aria-controls'];
	/**
	 * Identifies the element (or elements) that describes the element on which
	 * the attribute is set.
	 *
	 * @see https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-describedby
	 */
	'aria-describedby'?: NativeButtonProps['aria-describedby'];
	/**
	 * Indicates if a control is expanded or collapsed, and whether or not its
	 * child elements are displayed or hidden.
	 *
	 * @see https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-expanded
	 */
	'aria-expanded'?: NativeButtonProps['aria-expanded'];
	/**
	 * Indicates the availability and type of interactive popup element that can
	 * be triggered by the element on which the attribute is set.
	 *
	 * @see https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-haspopup
	 */
	'aria-haspopup'?: NativeButtonProps['aria-haspopup'];
	/**
	 * Defines a string value that labels an interactive element.
	 *
	 * @see https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-label
	 */
	'aria-label'?: NativeButtonProps['aria-label'];
	'children': NativeButtonProps['children'];
	// "data": NativeButtonProps['data']
	/**
	 * When disabled, prevents the user from interacting with the button
	 * (it cannot be pressed or focused).
	 */
	'disabled'?: NativeButtonProps['disabled'];
	/**
	 * Defines an identifier (ID) which must be unique in the whole document.
	 * Its purpose is to identify the element when linking (using a
	 * [fragment identifier](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Identifying_resources_on_the_Web#fragment)),
	 * scripting, or styling (with CSS).
	 */
	'id'?: NativeButtonProps['id'];
	// "loading": NativeButtonProps['loading']
	/**
	 * The name of the button, submitted as a pair with the button's value as part
	 * of the form data, when that button is used to submit the form.
	 */
	'name'?: NativeButtonProps['name'];
	'onClick'?: NativeButtonProps['onClick'];
	'onKeyDown'?: NativeButtonProps['onKeyDown'];
	'onKeyUp'?: NativeButtonProps['onKeyUp'];
	// "prominence": NativeButtonProps['prominence']
	// "size": NativeButtonProps['size']
	/** Represents the tab order of the current element. */
	'tabIndex'?: NativeButtonProps['tabIndex'];
	// "tone": NativeButtonProps['tone']
	/** The default behavior of the button. */
	'type'?: NativeButtonProps['type'];
	/**
	 * Defines the value associated with the button's name when it's submitted
	 * with the form data.
	 */
	'value'?: NativeButtonProps['value'];
};

////////////////////////////////////////////////////////////////////////////////

export { Button };
export type { ButtonProps };
