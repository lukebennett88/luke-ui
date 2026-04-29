import type { JSX, ReactNode } from 'react';
import { useCallback, useContext } from 'react';
import type {
	ButtonProps as RacButtonProps,
	ComboBoxProps as RacComboBoxProps,
	GroupProps as RacGroupProps,
	InputProps as RacInputProps,
	Key,
	ListBoxItemProps as RacListBoxItemProps,
	ListBoxLoadMoreItemProps as RacListBoxLoadMoreItemProps,
	ListBoxProps as RacListBoxProps,
	ListBoxSectionProps as RacListBoxSectionProps,
	PopoverProps as RacPopoverProps,
} from 'react-aria-components';
import {
	Collection,
	ComboBoxStateContext,
	composeRenderProps,
	Button as RacButton,
	ComboBox as RacComboBox,
	Group as RacGroup,
	Header as RacHeader,
	Input as RacInput,
	ListBox as RacListBox,
	ListBoxContext,
	ListBoxItem as RacListBoxItem,
	ListBoxLoadMoreItem as RacListBoxLoadMoreItem,
	ListBoxSection as RacListBoxSection,
	Popover as RacPopover,
	useSlottedContext,
} from 'react-aria-components';
import * as styles from '../recipes/combobox.css.js';
import { themeRootClassName } from '../theme/index.js';
import type { DistributiveOmit } from '../types/index.js';
import { cx } from '../utils/index.js';

interface ComboboxVariantProps extends NonNullable<styles.ComboboxVariants> {}

interface ComboboxStyleProps {
	/** Control size. */
	size?: ComboboxVariantProps['size'];
}

/** Allowed `size` values for Combobox primitives. */
export type ComboboxSize = NonNullable<ComboboxVariantProps['size']>;

/** Props for the `ComboboxInput` combobox root. */
export interface ComboboxInputProps<T extends object> extends DistributiveOmit<
	RacComboBoxProps<T, 'single'>,
	| 'defaultSelectedKey'
	| 'defaultValue'
	| 'onChange'
	| 'onOpenChange'
	| 'onSelectionChange'
	| 'selectedKey'
	| 'selectionMode'
	| 'value'
> {
	/** The currently selected key (controlled). Pass `null` for no selection. */
	value?: Key | null;

	/** The initially selected key (uncontrolled). */
	defaultValue?: Key | null;

	/** Called when the selected value changes. */
	onChange?: (value: Key | null) => void;

	/** Called when the open state changes. */
	onOpenChange?: (isOpen: boolean) => void;

	/**
	 * The interaction required to display the ComboBox menu.
	 * @default 'focus'
	 */
	menuTrigger?: 'focus' | 'input' | 'manual';
}

/** Spectrum-style combobox root primitive (single-select only). */
export function ComboboxInput<T extends object>(props: ComboboxInputProps<T>): JSX.Element {
	const { className, menuTrigger = 'focus', ...comboboxProps } = props;

	return (
		<RacComboBox
			{...comboboxProps}
			menuTrigger={menuTrigger}
			className={composeRenderProps(className, (renderedClassName) => {
				return cx(styles.comboboxRoot, renderedClassName);
			})}
		/>
	);
}

/** Props for the styled combobox control group. */
export interface ComboboxControlProps
	extends DistributiveOmit<RacGroupProps, 'className'>, ComboboxStyleProps {
	className?: RacGroupProps['className'];
}

/** Control wrapper for combobox text input + trigger content. */
export function ComboboxControl(props: ComboboxControlProps): JSX.Element {
	const { size = 'medium', ...groupProps } = props;

	return (
		<RacGroup
			{...groupProps}
			className={composeRenderProps(groupProps.className, (className) => {
				return cx(styles.comboboxControl({ size }), className);
			})}
		/>
	);
}

/** Props for the styled combobox text input. */
export interface ComboboxTextInputProps
	extends
		DistributiveOmit<RacInputProps, 'className' | keyof ComboboxStyleProps>,
		ComboboxStyleProps {
	className?: RacInputProps['className'];
}

/** Text input used within `ComboboxControl` for combobox behavior. */
export function ComboboxTextInput(props: ComboboxTextInputProps): JSX.Element {
	const { onClick, size = 'medium', ...inputProps } = props;
	const state = useContext(ComboBoxStateContext);

	const handleClick = useCallback(
		(event: React.MouseEvent<HTMLInputElement>) => {
			onClick?.(event);
			if (!state?.isOpen) {
				state?.open();
			}
		},
		[onClick, state],
	);

	return (
		<RacInput
			{...inputProps}
			onClick={handleClick}
			className={composeRenderProps(inputProps.className, (className) => {
				return cx(styles.comboboxTextInput({ size }), className);
			})}
		/>
	);
}

/** Props for the combobox trigger button. */
export interface ComboboxTriggerProps
	extends DistributiveOmit<RacButtonProps, 'className'>, ComboboxStyleProps {
	className?: RacButtonProps['className'];
}

/** Trigger button used by combobox pattern. */
export function ComboboxTrigger(props: ComboboxTriggerProps): JSX.Element {
	const { size = 'medium', ...buttonProps } = props;

	return (
		<RacButton
			{...buttonProps}
			className={composeRenderProps(buttonProps.className, (className) => {
				return cx(styles.comboboxTrigger({ size }), className);
			})}
		/>
	);
}

/** Props for the styled combobox popover. */
export interface ComboboxPopoverProps extends DistributiveOmit<
	RacPopoverProps,
	'UNSTABLE_portalContainer'
> {}

/** Popover surface used for listbox content. */
export function ComboboxPopover(props: ComboboxPopoverProps): JSX.Element {
	return (
		<RacPopover
			{...props}
			className={composeRenderProps(props.className, (className) => {
				return cx(themeRootClassName, styles.comboboxPopover(), className);
			})}
		/>
	);
}

/** Props for the styled listbox. */
export interface ComboboxListBoxProps<T extends object> extends DistributiveOmit<
	RacListBoxProps<T>,
	'dependencies' | 'items'
> {
	/** Item content for the listbox (render prop or static children). */
	children?: RacListBoxProps<T>['children'];
	/** Values that should invalidate the dynamic item cache. */
	dependencies?: ReadonlyArray<unknown>;
	/** Dynamic items rendered by the `children` render prop. */
	items?: Iterable<T>;
	/** Optional content appended after the main collection, e.g. a load-more sentinel. */
	loadMoreItem?: ReactNode;
}

/** Styled listbox for combobox options. */
export function ComboboxListBox<T extends object>(props: ComboboxListBoxProps<T>): JSX.Element {
	const { children, dependencies, items, loadMoreItem, ...listBoxProps } = props;
	const listBoxContext = useSlottedContext(ListBoxContext);
	const collectionItems = items ?? listBoxContext?.items;
	const listBoxChildren =
		typeof children === 'function' ? (
			<Collection<T> dependencies={dependencies} items={collectionItems}>
				{children}
			</Collection>
		) : (
			children
		);

	return (
		<RacListBox
			className={composeRenderProps(listBoxProps.className, (className) => {
				return cx(styles.comboboxListBox(), className);
			})}
			{...listBoxProps}
		>
			{listBoxChildren}
			{loadMoreItem}
		</RacListBox>
	);
}

/** Props for the combobox load-more sentinel row. */
export interface ComboboxLoadMoreItemProps
	extends DistributiveOmit<RacListBoxLoadMoreItemProps, 'className'>, ComboboxStyleProps {
	className?: RacListBoxLoadMoreItemProps['className'];
}

/** Styled load-more sentinel for async combobox collections. */
export function ComboboxLoadMoreItem(props: ComboboxLoadMoreItemProps): JSX.Element {
	const { size = 'medium', ...loadMoreItemProps } = props;

	return (
		<RacListBoxLoadMoreItem
			{...loadMoreItemProps}
			className={cx(styles.comboboxLoadMoreItem({ size }), loadMoreItemProps.className)}
		/>
	);
}

/** Props for a styled combobox option item. */
export interface ComboboxItemProps<T extends object>
	extends DistributiveOmit<RacListBoxItemProps<T>, 'className'>, ComboboxStyleProps {
	className?: RacListBoxItemProps<T>['className'];
}

/** Styled listbox option item. */
export function ComboboxItem<T extends object>(props: ComboboxItemProps<T>): JSX.Element {
	const { size = 'medium', ...itemProps } = props;

	return (
		<RacListBoxItem
			{...itemProps}
			className={composeRenderProps(itemProps.className, (className) => {
				return cx(styles.comboboxItem({ size }), className);
			})}
		/>
	);
}

/** Props for a styled section in the combobox listbox. */
export interface ComboboxSectionProps<T extends object> extends DistributiveOmit<
	RacListBoxSectionProps<T>,
	'className'
> {
	className?: RacListBoxSectionProps<T>['className'];
	/** Optional heading rendered above section items. */
	title?: ReactNode;
}

/** Styled section wrapper for grouped options. */
export function ComboboxSection<T extends object>(props: ComboboxSectionProps<T>): JSX.Element {
	const { children, className, title, ...sectionProps } = props;

	const sectionClassName = cx(styles.comboboxSection(), className);

	if (typeof children === 'function') {
		return (
			<RacListBoxSection {...sectionProps} className={sectionClassName}>
				{children}
			</RacListBoxSection>
		);
	}

	return (
		<RacListBoxSection {...sectionProps} className={sectionClassName}>
			{title != null ? (
				<RacHeader className={styles.comboboxSectionHeading}>{title}</RacHeader>
			) : null}
			{children}
		</RacListBoxSection>
	);
}

/** Props for the combobox empty state container. */
export interface ComboboxEmptyStateProps {
	/** Content rendered inside the empty state container. */
	children: ReactNode;
	/** Additional CSS class name. */
	className?: string;
}

/** Styled container for combobox empty and loading states. */
export function ComboboxEmptyState(props: ComboboxEmptyStateProps): JSX.Element {
	const { children, className } = props;

	return <div className={cx(styles.comboboxEmptyState(), className)}>{children}</div>;
}
