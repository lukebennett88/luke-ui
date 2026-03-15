import type { JSX, ReactNode } from 'react';
import type {
	ButtonProps as RacButtonProps,
	ComboBoxProps as RacComboBoxProps,
	GroupProps as RacGroupProps,
	InputProps as RacInputProps,
	ListBoxItemProps as RacListBoxItemProps,
	ListBoxProps as RacListBoxProps,
	ListBoxSectionProps as RacListBoxSectionProps,
	PopoverProps as RacPopoverProps,
	SelectValueProps as RacSelectValueProps,
} from 'react-aria-components';
import {
	composeRenderProps,
	Button as RacButton,
	ComboBox as RacComboBox,
	Group as RacGroup,
	Header as RacHeader,
	Input as RacInput,
	ListBox as RacListBox,
	ListBoxItem as RacListBoxItem,
	ListBoxSection as RacListBoxSection,
	Popover as RacPopover,
	SelectValue as RacSelectValue,
} from 'react-aria-components';
import * as styles from '../../../recipes/select-input.css.js';
import { themeRootClassName } from '../../../theme/theme.js';
import { cx } from '../../../utils.js';

interface SelectInputVariantProps extends NonNullable<styles.SelectInputVariants> {}

interface SelectInputStyleProps {
	/** Control size. */
	size?: SelectInputVariantProps['size'];
}

/** Allowed `size` values for Select primitives. */
export type SelectInputSize = NonNullable<SelectInputVariantProps['size']>;

/** Props for the `SelectInput` combobox root. */
export interface SelectInputProps<T extends object> extends Omit<
	RacComboBoxProps<T, 'single'>,
	'selectionMode'
> {}

/** Spectrum-style combobox root primitive (single-select only). */
export function SelectInput<T extends object>(props: SelectInputProps<T>): JSX.Element {
	return (
		<RacComboBox
			{...props}
			className={composeRenderProps(props.className, (className) => {
				return cx(styles.selectInputRoot, className);
			})}
		/>
	);
}

/** Props for the styled select control group. */
export interface SelectInputGroupProps
	extends Omit<RacGroupProps, 'className' | keyof SelectInputStyleProps>, SelectInputStyleProps {
	className?: RacGroupProps['className'];
}

/** Group wrapper for select input text + trigger content. */
export function SelectInputGroup(props: SelectInputGroupProps): JSX.Element {
	const { size = 'medium', ...groupProps } = props;

	return (
		<RacGroup
			{...groupProps}
			className={composeRenderProps(groupProps.className, (className) => {
				return cx(styles.selectInputGroup({ size }), className);
			})}
		/>
	);
}

/** Props for the styled combobox text input. */
export interface SelectInputTextProps
	extends Omit<RacInputProps, 'className' | keyof SelectInputStyleProps>, SelectInputStyleProps {
	className?: RacInputProps['className'];
}

/** Text input used within `SelectInputGroup` for combobox behavior. */
export function SelectInputText(props: SelectInputTextProps): JSX.Element {
	const { size = 'medium', ...inputProps } = props;

	return (
		<RacInput
			{...inputProps}
			className={composeRenderProps(inputProps.className, (className) => {
				return cx(styles.selectInputText({ size }), className);
			})}
		/>
	);
}

/** Props for the select trigger button. */
export interface SelectTriggerProps
	extends Omit<RacButtonProps, 'className' | keyof SelectInputStyleProps>, SelectInputStyleProps {
	className?: RacButtonProps['className'];
}

/** Trigger button used by both combobox and picker patterns. */
export function SelectTrigger(props: SelectTriggerProps): JSX.Element {
	const { size = 'medium', ...buttonProps } = props;

	return (
		<RacButton
			{...buttonProps}
			className={composeRenderProps(buttonProps.className, (className) => {
				return cx(styles.selectTrigger({ size }), className);
			})}
		/>
	);
}

/** Props for the styled picker value slot. */
export interface SelectValueProps<T extends object>
	extends
		Omit<RacSelectValueProps<T>, 'className' | keyof SelectInputStyleProps>,
		SelectInputStyleProps {
	className?: RacSelectValueProps<T>['className'];
}

/** Styled wrapper for selected value text in picker mode. */
export function SelectValue<T extends object>(props: SelectValueProps<T>): JSX.Element {
	const { size = 'medium', ...valueProps } = props;

	return (
		<RacSelectValue
			{...valueProps}
			className={composeRenderProps(valueProps.className, (className) => {
				return cx(styles.selectValue({ size }), className);
			})}
		/>
	);
}

/** Props for the styled select popover. */
export interface SelectPopoverProps extends RacPopoverProps {}

/** Popover surface used for listbox content. */
export function SelectPopover(props: SelectPopoverProps): JSX.Element {
	return (
		<RacPopover
			{...props}
			className={composeRenderProps(props.className, (className) => {
				return cx(themeRootClassName, styles.selectPopover(), className);
			})}
		/>
	);
}

/** Props for the styled listbox. */
export interface SelectListBoxProps<T extends object> extends RacListBoxProps<T> {}

/** Styled listbox for select options. */
export function SelectListBox<T extends object>(props: SelectListBoxProps<T>): JSX.Element {
	return (
		<RacListBox
			{...props}
			className={composeRenderProps(props.className, (className) => {
				return cx(styles.selectListBox(), className);
			})}
		/>
	);
}

/** Props for a styled select option item. */
export interface SelectItemProps<T extends object>
	extends
		Omit<RacListBoxItemProps<T>, 'className' | keyof SelectInputStyleProps>,
		SelectInputStyleProps {
	className?: RacListBoxItemProps<T>['className'];
}

/** Styled listbox option item. */
export function SelectItem<T extends object>(props: SelectItemProps<T>): JSX.Element {
	const { size = 'medium', ...itemProps } = props;

	return (
		<RacListBoxItem
			{...itemProps}
			className={composeRenderProps(itemProps.className, (className) => {
				return cx(styles.selectItem({ size }), className);
			})}
		/>
	);
}

/** Props for a styled section in the select listbox. */
export interface SelectSectionProps<T extends object> extends Omit<
	RacListBoxSectionProps<T>,
	'className'
> {
	className?: RacListBoxSectionProps<T>['className'];
	/** Optional heading rendered above section items. */
	title?: ReactNode;
}

/** Styled section wrapper for grouped options. */
export function SelectSection<T extends object>(props: SelectSectionProps<T>): JSX.Element {
	const { children, className, title, ...sectionProps } = props;

	if (typeof children === 'function') {
		return (
			<RacListBoxSection {...sectionProps} className={cx(styles.selectSection(), className)}>
				{children}
			</RacListBoxSection>
		);
	}

	return (
		<RacListBoxSection {...sectionProps} className={cx(styles.selectSection(), className)}>
			{title != null ? (
				<RacHeader className={styles.selectSectionHeading}>{title}</RacHeader>
			) : null}
			{children}
		</RacListBoxSection>
	);
}
