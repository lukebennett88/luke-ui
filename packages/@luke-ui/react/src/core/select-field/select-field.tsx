import type { JSX, ReactNode, Ref } from 'react';
import type { Key } from 'react-aria-components/Select';
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

/**
 * The key type `SelectField` infers from item data: `key`, then `id`. Items with neither fall back
 * to `Key`.
 */
type ItemKey<T> = T extends { key: infer K extends Key }
	? K
	: T extends { id: infer K extends Key }
		? K
		: Key;

type SelectRootValidate = NonNullable<SelectRootProps['validate']>;

type _SelectFieldOmit = DistributiveOmit<
	SelectRootProps,
	| 'allowsEmptyCollection'
	| 'aria-label'
	| 'aria-labelledby'
	| 'children'
	| 'defaultOpen'
	| 'defaultValue'
	| 'disabledKeys'
	| 'isInvalid'
	| 'isOpen'
	| 'onChange'
	| 'onOpenChange'
	| 'slot'
	| 'validate'
	| 'value'
>;

interface _SelectFieldBaseProps<T extends object> extends _SelectFieldOmit {
	/**
	 * The options. Pass a render function that returns a `SelectItem` for each of `items`, or pass
	 * static `SelectItem` children.
	 */
	children: SelectListBoxProps<T>['children'];
	/**
	 * The initially selected key (uncontrolled). The key type follows the `id` or `key` of the items
	 * in `items`.
	 */
	defaultValue?: NoInfer<ItemKey<T>> | null;
	/** Validation message for a controlled error. A non-empty message marks the field invalid. */
	errorMessage?: ReactNode;
	/**
	 * Whether the field is pending. The trigger keeps focus but can't be pressed or opened, and can't
	 * change the value from the trigger, until pending ends.
	 */
	isPending?: SelectTriggerProps['isPending'];
	/** Options for the render function in `children`. */
	items?: SelectListBoxProps<T>['items'];
	/** Called with the new key when the selection changes. */
	onChange?: (value: NoInfer<ItemKey<T>> | null) => void;
	/** Forwarded to the field's root element. Use `triggerRef` for the trigger. */
	ref?: SelectRootProps['ref'];
	/**
	 * Forwarded to the trigger `<button>` element. Accepts a callback ref or a ref object. Use `ref`
	 * for the root element.
	 */
	triggerRef?: Ref<HTMLButtonElement>;
	/**
	 * Custom validation function run against the selected key. Return a message, or `true`/`null`
	 * when valid. The key type follows the `id` or `key` of the items in `items`.
	 */
	validate?: (value: NoInfer<ItemKey<T>>) => ReturnType<SelectRootValidate>;
	/** The selected key (controlled). Pass `null` for no selection. */
	value?: NoInfer<ItemKey<T>> | null;
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
		onChange,
		triggerRef,
		validate,
		...rootProps
	} = props;

	const normalizedErrorMessage = normalizeErrorMessage(errorMessage);

	return (
		<SelectRoot
			{...rootProps}
			isInvalid={isInvalidFromErrorMessage(normalizedErrorMessage)}
			// `SelectRoot` works with any `Key`.
			// `SelectField` narrows the key type from item data for its own API.
			onChange={onChange as SelectRootProps['onChange']}
			validate={validate as SelectRootProps['validate']}
		>
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
