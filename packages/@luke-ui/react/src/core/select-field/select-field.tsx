import type { JSX, ReactNode, Ref } from 'react';
import type { FieldAccessibleNameProps } from '../primitives/field/field.js';
import {
	Field,
	isInvalidFromErrorMessage,
	normalizeErrorMessage,
} from '../primitives/field/field.js';
import type { SelectListBoxProps, SelectRootProps } from '../primitives/select/select.js';
import {
	SelectIndicator,
	SelectListBox,
	SelectPopover,
	SelectRoot,
	SelectTrigger,
	SelectValue,
} from '../primitives/select/select.js';
import type { SelectSize } from '../primitives/select/styles.css.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { Prettify } from '../types/prettify.js';

type _SelectFieldOmit = DistributiveOmit<
	SelectRootProps,
	'aria-label' | 'aria-labelledby' | 'children' | 'isInvalid' | 'ref' | 'size'
>;

interface _SelectFieldBaseProps<T extends object> extends _SelectFieldOmit {
	/**
	 * The options. Pass a render function that returns a `SelectItem` for each of `items`, or pass
	 * static `SelectItem` children.
	 */
	children: SelectListBoxProps<T>['children'];
	/** Validation message for a controlled error. A non-empty message marks the field invalid. */
	errorMessage?: ReactNode;
	/** Options for the render function in `children`. */
	items?: SelectListBoxProps<T>['items'];
	/** Placeholder text shown while nothing is selected. */
	placeholder?: string;
	/** Control size. @default 'medium' */
	size?: SelectSize;
	/**
	 * Forwarded to the trigger `<button>` element.
	 *
	 * This field takes no plain `ref`: `triggerRef` is the only way to reach the control, so a ref
	 * can never silently resolve to a wrapper element instead.
	 */
	triggerRef?: Ref<HTMLButtonElement>;
}

type _SelectFieldProps<T extends object> = _SelectFieldBaseProps<T> & FieldAccessibleNameProps;

/** Props for `SelectField`. */
export type SelectFieldProps<T extends object> = Prettify<_SelectFieldProps<T>>;

/**
 * A single-selection field with a label, description, validation message, and a popover list of
 * options.
 *
 * It composes `SelectRoot`, `Field`, `SelectTrigger`, `SelectPopover`, and `SelectListBox`. Pass
 * `value` and `onChange` for a controlled field, or `defaultValue` for an uncontrolled one.
 */
export function SelectField<T extends object>(props: SelectFieldProps<T>): JSX.Element {
	const {
		children,
		description,
		errorMessage,
		items,
		label,
		necessityIndicator,
		placeholder,
		size = 'medium',
		triggerRef,
		...rootProps
	} = props;

	const normalizedErrorMessage = normalizeErrorMessage(errorMessage);

	return (
		<SelectRoot
			{...rootProps}
			isInvalid={isInvalidFromErrorMessage(normalizedErrorMessage)}
			placeholder={placeholder}
			size={size}
		>
			<Field
				description={description}
				errorMessage={normalizedErrorMessage}
				label={label}
				necessityIndicator={necessityIndicator}
			>
				<SelectTrigger ref={triggerRef}>
					<SelectValue />
					<SelectIndicator />
				</SelectTrigger>
				<SelectPopover>
					<SelectListBox<T> items={items}>{children}</SelectListBox>
				</SelectPopover>
			</Field>
		</SelectRoot>
	);
}
