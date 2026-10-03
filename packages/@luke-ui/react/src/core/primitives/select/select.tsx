import type { ComponentProps, JSX, ReactNode, Ref } from 'react';
import { createContext, use } from 'react';
import type {
	ButtonProps as RacButtonProps,
	Key,
	ListBoxProps as RacListBoxProps,
	PopoverProps as RacPopoverProps,
	SelectProps as RacSelectProps,
	SelectValueProps as RacSelectValueProps,
} from 'react-aria-components/Select';
import {
	Button as RacButton,
	ListBox as RacListBox,
	Popover as RacPopover,
	Select as RacSelect,
	SelectStateContext as RacSelectStateContext,
	SelectValue as RacSelectValue,
} from 'react-aria-components/Select';
import { TextContext as RacTextContext } from 'react-aria-components/Text';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import { cx } from '../../../shared/utils/utils.js';
import { rootClassName } from '../../../theme/theme.js';
import { IconSizeProvider } from '../../icon/icon-size-context.js';
import { Icon } from '../../icon/icon.js';
import { FIELD_CONTROL_ICON_SIZE } from '../../sizing/control-size.js';
import type { DistributiveOmit } from '../../types/distributive-omit.js';
import type { Prettify } from '../../types/prettify.js';
import type { ComboboxItemProps } from '../combobox/item.js';
import { ComboboxItem } from '../combobox/item.js';
import { comboboxRecipe } from '../combobox/styles.css.js';
import { rootIdProps } from '../root-id.js';
import type { SelectSize } from './styles.css.js';
import { selectRecipe } from './styles.css.js';

/** Size set by `SelectRoot`, which owns the size of every part inside it. */
const SelectSizeContext = createContext<SelectSize | null>(null);

/** RAC select props redeclared here with useful JSDoc. */
interface SelectRootRedeclaredRACProps {
	/** Describes the type of autocomplete the browser may offer for the hidden form control. */
	autoComplete?: RacSelectProps['autoComplete'];
	/** Whether the select should receive focus on render. */
	autoFocus?: RacSelectProps['autoFocus'];
	/** The `<form>` element to associate the select with, by id. */
	form?: RacSelectProps['form'];
	/** Whether the select is disabled. */
	isDisabled?: RacSelectProps['isDisabled'];
	/** Marks the select invalid, for example after failed validation. */
	isInvalid?: RacSelectProps['isInvalid'];
	/** Whether a selection is required before the form can submit. */
	isRequired?: RacSelectProps['isRequired'];
	/** The name of the select, used when submitting an HTML form. */
	name?: RacSelectProps['name'];
	/** Custom validation function run against the selected key. Return a message, or `true`/`null` when valid. */
	validate?: RacSelectProps['validate'];
	/**
	 * When native HTML form validation runs.
	 * @default 'native'
	 */
	validationBehavior?: RacSelectProps['validationBehavior'];
}

type _SelectRootOmit = DistributiveOmit<
	RacSelectProps,
	| 'defaultSelectedKey'
	| 'defaultValue'
	| 'id'
	| 'onChange'
	| 'onSelectionChange'
	| 'placeholder'
	| 'render'
	| 'selectedKey'
	| 'selectionMode'
	| 'shouldCloseOnSelect'
	| 'value'
	| keyof SelectRootRedeclaredRACProps
>;

interface _SelectRootProps extends _SelectRootOmit, SelectRootRedeclaredRACProps {
	/** The select's parts: a `SelectTrigger` and a `SelectPopover`, plus any `Field` anatomy. */
	children?: RacSelectProps['children'];
	/** The initially selected key (uncontrolled). */
	defaultValue?: Key | null;
	/** Element id for the root element. Use `triggerId` for the trigger button. */
	id?: string;
	/** Called with the new key when the selection changes. */
	onChange?: (value: Key | null) => void;
	/** Called when the open state changes. */
	onOpenChange?: RacSelectProps['onOpenChange'];
	/** Text shown in the `SelectValue` while nothing is selected. */
	placeholder?: string;
	/** Forwarded to the root element. */
	ref?: Ref<HTMLDivElement>;
	/**
	 * Sets the size of the trigger, indicator, and items.
	 * @default 'medium'
	 */
	size?: SelectSize;
	/** Element id for the trigger button. The root generates one when omitted. */
	triggerId?: RacSelectProps['id'];
	/** The selected key (controlled). Pass `null` for no selection. */
	value?: Key | null;
}

/** Props for `SelectRoot`. */
export type SelectRootProps = Prettify<_SelectRootProps>;

type _SelectTriggerOmit = DistributiveOmit<
	RacButtonProps,
	'children' | 'className' | 'id' | 'isDisabled' | 'render' | 'type'
>;

interface _SelectTriggerProps extends _SelectTriggerOmit {
	/** The `SelectValue` and `SelectIndicator`. */
	children: RacButtonProps['children'];
	/** Class name for the trigger button. */
	className?: RacButtonProps['className'];
	/**
	 * Whether the trigger is pending. It keeps focus but can't be pressed or opened, and can't change
	 * the value from the trigger, until pending ends.
	 */
	isPending?: RacButtonProps['isPending'];
	/** Forwarded to the trigger `<button>` element. */
	ref?: Ref<HTMLButtonElement>;
}

/** Props for `SelectTrigger`. */
export type SelectTriggerProps = Prettify<_SelectTriggerProps>;

interface _SelectValueProps<T extends object> extends RacSelectValueProps<T> {
	/** Forwarded to the value element. */
	ref?: Ref<HTMLSpanElement>;
}

/** Props for `SelectValue`. */
export type SelectValueProps<T extends object> = Prettify<_SelectValueProps<T>>;

interface _SelectIndicatorProps extends DistributiveOmit<ComponentProps<'span'>, 'children'> {
	/** Replaces the default chevron. The part keeps its layout and `data-open` attribute. */
	children?: ReactNode;
}

/** Props for `SelectIndicator`. */
export type SelectIndicatorProps = Prettify<_SelectIndicatorProps>;

type _SelectPopoverOmit = DistributiveOmit<RacPopoverProps, 'UNSTABLE_portalContainer'>;

interface _SelectPopoverProps extends _SelectPopoverOmit {
	/**
	 * Distance in pixels between the trigger and the popover.
	 * @default 4
	 */
	offset?: RacPopoverProps['offset'];
	/** Forwarded to the popover's DOM element. */
	ref?: Ref<HTMLElement>;
}

/** Props for `SelectPopover`. */
export type SelectPopoverProps = Prettify<_SelectPopoverProps>;

/** Props for `SelectListBox`. */
export type SelectListBoxProps<T extends object> = Prettify<RacListBoxProps<T>>;

/** Props for `SelectItem`. */
export type SelectItemProps<T extends object> = Prettify<
	DistributiveOmit<ComboboxItemProps<T>, 'size'>
>;

/**
 * Semantic root for a select. It owns the value, state, validation, and size of the parts inside
 * it.
 *
 * `id`, `className`, and `ref` target the root element. `triggerId` targets the trigger.
 */
export function SelectRoot(props: SelectRootProps): JSX.Element {
	const { className, id, size = 'medium', triggerId, ...selectProps } = props;

	return (
		<SelectSizeContext.Provider value={size}>
			<RacSelect
				{...selectProps}
				{...rootIdProps(id, triggerId)}
				className={composeRenderProps(className, (renderedClassName) => {
					return selectRecipe().root({ className: renderedClassName });
				})}
			/>
		</SelectSizeContext.Provider>
	);
}

/**
 * The button that opens the select and draws its control chrome. While the root is invalid it takes
 * the danger border. `FieldError` carries the error icon.
 */
export function SelectTrigger(props: SelectTriggerProps): JSX.Element {
	const { children, className, ...buttonProps } = props;
	const size = use(SelectSizeContext) ?? 'medium';

	// React Aria provides slotted `Text` context for the description and error, so a `Text` without
	// a `slot` throws. The trigger has no slot, so clear the context for everything inside it.
	const triggerChildren = composeRenderProps(children, (resolved) => (
		<RacTextContext.Provider value={null}>{resolved}</RacTextContext.Provider>
	));

	return (
		<IconSizeProvider size={FIELD_CONTROL_ICON_SIZE[size]}>
			<RacButton
				{...buttonProps}
				className={composeRenderProps(className, (renderedClassName) => {
					return selectRecipe({ size }).trigger({ className: renderedClassName });
				})}
			>
				{triggerChildren}
			</RacButton>
		</IconSizeProvider>
	);
}

/** The selected option, or the root's `placeholder` while nothing is selected. */
export function SelectValue<T extends object>(props: SelectValueProps<T>): JSX.Element {
	return (
		<RacSelectValue<T>
			{...props}
			className={composeRenderProps(props.className, (renderedClassName) => {
				return selectRecipe().value({ className: renderedClassName });
			})}
		/>
	);
}

/**
 * The open and closed affordance at the end of the trigger. It shows a chevron by default and sets
 * `data-open` while the popover is open. Pass `children` to replace the chevron.
 */
export function SelectIndicator(props: SelectIndicatorProps): JSX.Element {
	const { children, className, ...spanProps } = props;
	const state = use(RacSelectStateContext);

	return (
		<span
			{...spanProps}
			aria-hidden
			className={selectRecipe().indicator({ className })}
			data-open={state?.isOpen ? true : undefined}
		>
			{children ?? <Icon name="chevronDown" />}
		</span>
	);
}

/** Popover surface for the listbox. */
export function SelectPopover(props: SelectPopoverProps): JSX.Element {
	const { offset = 4, ref, ...popoverProps } = props;

	return (
		<RacPopover
			{...popoverProps}
			className={composeRenderProps(popoverProps.className, (className) => {
				return cx(rootClassName, comboboxRecipe().popover({ className }));
			})}
			offset={offset}
			ref={ref}
		/>
	);
}

/**
 * Styled listbox for the select's options. Pass `items` with a render function, or static
 * `SelectItem` children.
 */
export function SelectListBox<T extends object>(props: SelectListBoxProps<T>): JSX.Element {
	return (
		<RacListBox<T>
			{...props}
			className={composeRenderProps(props.className, (className) => {
				return comboboxRecipe().listBox({ className });
			})}
		/>
	);
}

/**
 * One option in the listbox. It marks the selected option with a check, and takes its size from
 * the surrounding `SelectRoot`.
 */
export function SelectItem<T extends object>(props: SelectItemProps<T>): JSX.Element {
	const size = use(SelectSizeContext) ?? 'medium';

	return <ComboboxItem<T> {...props} size={size} />;
}
