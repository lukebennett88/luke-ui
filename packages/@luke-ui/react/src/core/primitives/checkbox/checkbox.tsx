import type { ComponentProps, JSX } from 'react';
import type {
	CheckboxButtonProps as RacCheckboxButtonProps,
	CheckboxFieldProps as RacCheckboxFieldProps,
} from 'react-aria-components/Checkbox';
import {
	CheckboxButton as RacCheckboxButton,
	CheckboxField as RacCheckboxField,
} from 'react-aria-components/Checkbox';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import type { XStyleProp } from '../../styles/xstyle.js';
import { resolveXStyleProps } from '../../styles/xstyle.js';
import type { DistributiveOmit } from '../../types/distributive-omit.js';
import type { Prettify } from '../../types/prettify.js';
import type { CheckboxRecipeVariants } from './recipe.js';
import { resolveCheckboxRecipeStyles } from './recipe.js';

type _CheckboxOmit = DistributiveOmit<RacCheckboxFieldProps, 'children'>;

interface CheckboxRecipeProps extends NonNullable<CheckboxRecipeVariants> {}

interface CheckboxStyleProps {
	/**
	 * Visual size of the checkbox control.
	 *
	 * @default 'medium'
	 */
	size?: CheckboxRecipeProps['size'];
	/**
	 * Extra styles as one or more `stylex.create(...)` objects. Applied after every variant prop
	 * above and before `className`. A same-property `xstyle` value wins over a variant such as
	 * `size`. A consumer `className` still beats `xstyle`, and inline `style` beats `className`.
	 */
	xstyle?: XStyleProp;
}

interface _CheckboxProps extends _CheckboxOmit, CheckboxStyleProps {
	/** Checkbox anatomy, including clickable `CheckboxContent`. */
	children: RacCheckboxFieldProps['children'];
	/** Initial selection state for an uncontrolled checkbox. */
	defaultSelected?: RacCheckboxFieldProps['defaultSelected'];
	/** Whether the checkbox is disabled. */
	isDisabled?: RacCheckboxFieldProps['isDisabled'];
	/** Whether the checkbox displays a mixed selection state. */
	isIndeterminate?: RacCheckboxFieldProps['isIndeterminate'];
	/** Whether the checkbox is invalid. */
	isInvalid?: RacCheckboxFieldProps['isInvalid'];
	/** Whether the checkbox can be read but not changed. */
	isReadOnly?: RacCheckboxFieldProps['isReadOnly'];
	/** Whether the checkbox is required before the form can submit. */
	isRequired?: RacCheckboxFieldProps['isRequired'];
	/** Whether the checkbox is selected. */
	isSelected?: RacCheckboxFieldProps['isSelected'];
	/** Called when the selection changes. */
	onChange?: RacCheckboxFieldProps['onChange'];
}

/** Props for the Checkbox primitive root. */
export type CheckboxProps = Prettify<_CheckboxProps>;

type _CheckboxContentOmit = DistributiveOmit<RacCheckboxButtonProps, 'children'>;

interface CheckboxPartStyleProps {
	/**
	 * Extra styles as one or more `stylex.create(...)` objects. Applied after this part's own styles
	 * and before `className`. A same-property `xstyle` value wins over those styles. A consumer
	 * `className` still beats `xstyle`, and inline `style` beats `className`.
	 */
	xstyle?: XStyleProp;
}

interface _CheckboxContentProps extends _CheckboxContentOmit, CheckboxPartStyleProps {
	/** The control, indicator, and visible checkbox label. */
	children: RacCheckboxButtonProps['children'];
}

/** Props for the Checkbox primitive's clickable content. */
export type CheckboxContentProps = Prettify<_CheckboxContentProps>;

interface _CheckboxControlProps extends ComponentProps<'span'>, CheckboxPartStyleProps {}

/** Props for the Checkbox primitive's control wrapper. */
export type CheckboxControlProps = Prettify<_CheckboxControlProps>;

interface _CheckboxIndicatorProps extends ComponentProps<'span'>, CheckboxPartStyleProps {}

/** Props for the Checkbox primitive's visual indicator. */
export type CheckboxIndicatorProps = Prettify<_CheckboxIndicatorProps>;

/** Clickable content that keeps the checkbox input and label associated. */
export function CheckboxContent(props: CheckboxContentProps): JSX.Element {
	const { className, style, xstyle, ...restProps } = props;
	const recipeStyles = resolveCheckboxRecipeStyles().content;

	return (
		<RacCheckboxButton
			{...restProps}
			className={composeRenderProps(className, (resolvedClassName) => {
				return (
					resolveXStyleProps(recipeStyles, xstyle, resolvedClassName, undefined).className ?? ''
				);
			})}
			style={composeRenderProps(style, (resolvedStyle) => {
				return resolveXStyleProps(recipeStyles, xstyle, undefined, resolvedStyle).style;
			})}
		/>
	);
}

/** Line-height-sized wrapper that centres the fixed visual checkbox affordance. */
export function CheckboxControl(props: CheckboxControlProps): JSX.Element {
	const { className, style, xstyle, ...restProps } = props;
	return (
		<span
			{...restProps}
			{...resolveXStyleProps(resolveCheckboxRecipeStyles().control, xstyle, className, style)}
		/>
	);
}

/** Visual square that reflects selected, indeterminate, disabled, and invalid states. */
export function CheckboxIndicator(props: CheckboxIndicatorProps): JSX.Element {
	const { className, style, xstyle, ...restProps } = props;
	return (
		<span
			{...restProps}
			aria-hidden
			{...resolveXStyleProps(resolveCheckboxRecipeStyles().indicator, xstyle, className, style)}
		/>
	);
}

/** Checkbox field primitive for custom composition. */
export function Checkbox(props: CheckboxProps): JSX.Element {
	const { className, size, style, xstyle, ...restProps } = props;
	const recipeStyles = resolveCheckboxRecipeStyles({ size }).root;

	return (
		<RacCheckboxField
			{...restProps}
			className={composeRenderProps(className, (resolvedClassName) => {
				return (
					resolveXStyleProps(recipeStyles, xstyle, resolvedClassName, undefined).className ?? ''
				);
			})}
			style={composeRenderProps(style, (resolvedStyle) => {
				return resolveXStyleProps(recipeStyles, xstyle, undefined, resolvedStyle).style;
			})}
		/>
	);
}
