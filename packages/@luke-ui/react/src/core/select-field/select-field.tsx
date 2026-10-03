import type { JSX, ReactNode, Ref } from 'react';
import type { FieldAccessibleNameProps } from '../primitives/field/field.js';
import {
	Field,
	isInvalidFromErrorMessage,
	normalizeErrorMessage,
} from '../primitives/field/field.js';
import type {
	SelectListBoxProps,
	SelectRootProps,
	SelectTriggerProps,
} from '../primitives/select/select.js';
import {
	SelectIndicator,
	SelectListBox,
	SelectPopover,
	SelectRoot,
	SelectTrigger,
	SelectValue,
} from '../primitives/select/select.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { Prettify } from '../types/prettify.js';

type _SelectFieldOmit = DistributiveOmit<
	SelectRootProps,
	'aria-label' | 'aria-labelledby' | 'children' | 'isInvalid'
>;

interface _SelectFieldBaseProps<T extends object> extends _SelectFieldOmit {
	/**
	 * The options. Pass a render function that returns a `SelectItem` for each of `items`, or pass
	 * static `SelectItem` children.
	 */
	children: SelectListBoxProps<T>['children'];
	/** Validation message for a controlled error. A non-empty message marks the field invalid. */
	errorMessage?: ReactNode;
	/**
	 * Whether the field is pending. The trigger keeps focus but can't open the select or change
	 * its value.
	 */
	isPending?: SelectTriggerProps['isPending'];
	/** Options for the render function in `children`. */
	items?: SelectListBoxProps<T>['items'];
	/** Forwarded to the field's root element. Use `triggerRef` for the trigger. */
	ref?: SelectRootProps['ref'];
	/**
	 * Forwarded to the trigger `<button>` element. Accepts a callback ref or a ref object. Use `ref`
	 * for the root element.
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
 * `id`, `className`, and `ref` target the field's root element. `triggerId` and `triggerRef` target
 * the trigger.
 */
export function SelectField<T extends object>(props: SelectFieldProps<T>): JSX.Element {
	const {
		children,
		description,
		errorMessage,
		isPending,
		items,
		label,
		necessityIndicator,
		triggerRef,
		...rootProps
	} = props;

	const normalizedErrorMessage = normalizeErrorMessage(errorMessage);

	return (
		<SelectRoot {...rootProps} isInvalid={isInvalidFromErrorMessage(normalizedErrorMessage)}>
			<Field
				description={description}
				errorMessage={normalizedErrorMessage}
				label={label}
				necessityIndicator={necessityIndicator}
			>
				<SelectTrigger isPending={isPending} ref={triggerRef}>
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
