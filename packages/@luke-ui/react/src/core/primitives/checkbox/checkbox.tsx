import { useMemo } from 'react';
import type { ComponentProps, JSX, ReactNode } from 'react';
import type {
	CheckboxButtonProps as RacCheckboxButtonProps,
	CheckboxFieldProps as RacCheckboxFieldProps,
} from 'react-aria-components/Checkbox';
import {
	CheckboxButton as RacCheckboxButton,
	CheckboxField as RacCheckboxField,
} from 'react-aria-components/Checkbox';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import { mergeStyleProps } from '../../../shared/utils/utils.js';
import { resolveRecipeSlotProps } from '../../styles/recipe-authoring.js';
import type { XStyleProps } from '../../styles/xstyle.js';
import { composeRacRecipeProps, composeRecipeProps } from '../../styles/xstyle.js';
import type { DistributiveOmit } from '../../types/distributive-omit.js';
import type { Prettify } from '../../types/prettify.js';
import type { CheckboxState } from './context.js';
import { CheckboxStateContext, useCheckboxState } from './context.js';
import type { CheckboxRecipeVariants } from './recipe.js';
import { checkboxStateRecipe } from './recipe.js';

type _CheckboxOmit = DistributiveOmit<RacCheckboxFieldProps, 'children'>;

interface CheckboxStateProviderProps extends CheckboxState {
	children: ReactNode;
}

function CheckboxStateProvider({
	children,
	isDisabled,
	isFocusVisible,
	isHovered,
	isIndeterminate,
	isInvalid,
	isPressed,
	isReadOnly,
	isSelected,
}: CheckboxStateProviderProps): JSX.Element {
	const value = useMemo(
		() => ({
			isDisabled,
			isFocusVisible,
			isHovered,
			isIndeterminate,
			isInvalid,
			isPressed,
			isReadOnly,
			isSelected,
		}),
		[
			isDisabled,
			isFocusVisible,
			isHovered,
			isIndeterminate,
			isInvalid,
			isPressed,
			isReadOnly,
			isSelected,
		],
	);
	return <CheckboxStateContext.Provider value={value}>{children}</CheckboxStateContext.Provider>;
}

type CheckboxRecipeProps = NonNullable<CheckboxRecipeVariants>;

interface CheckboxStyleProps extends XStyleProps {
	/**
	 * Visual size of the checkbox control.
	 *
	 * @default 'medium'
	 */
	size?: CheckboxRecipeProps['size'];
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

interface _CheckboxContentProps extends _CheckboxContentOmit, XStyleProps {
	/** The control, indicator, and visible checkbox label. */
	children: RacCheckboxButtonProps['children'];
}

/** Props for the Checkbox primitive's clickable content. */
export type CheckboxContentProps = Prettify<_CheckboxContentProps>;

interface _CheckboxControlProps extends ComponentProps<'span'>, XStyleProps {}

/** Props for the Checkbox primitive's control wrapper. */
export type CheckboxControlProps = Prettify<_CheckboxControlProps>;

interface _CheckboxIndicatorProps extends ComponentProps<'span'>, XStyleProps {}

/** Props for the Checkbox primitive's visual indicator. */
export type CheckboxIndicatorProps = Prettify<_CheckboxIndicatorProps>;

/** Clickable content that keeps the checkbox input and label associated. */
export function CheckboxContent(props: CheckboxContentProps): JSX.Element {
	const { className, render, style, xstyle, ...restProps } = props;

	return (
		<RacCheckboxButton
			{...restProps}
			className={className}
			style={style}
			render={(domProps, renderProps) => {
				const recipeProps = resolveRecipeSlotProps(
					checkboxStateRecipe,
					'content',
					{
						isDisabled: renderProps.isDisabled,
						isFocusVisible: renderProps.isFocusVisible,
						isHovered: renderProps.isHovered,
						isIndeterminate: renderProps.isIndeterminate,
						isInvalid: renderProps.isInvalid,
						isPressed: renderProps.isPressed,
						isReadOnly: renderProps.isReadOnly,
						isSelected: renderProps.isSelected,
					},
					xstyle,
				);
				// `domProps` is RAC's full prop bag, not a `{ className, style }` literal, so
				// `composeRecipeProps` (which expects that narrower shape) doesn't fit here.
				// `mergeStyleProps` still applies: className concatenates, style shallow-merges,
				// and every other RAC-supplied key (event handlers, aria-*, the hidden input)
				// passes through unchanged rather than chaining.
				const mergedProps = mergeStyleProps(recipeProps, domProps) as typeof domProps;
				// The hidden input is part of the children in domProps.
				// oxlint-disable-next-line jsx-a11y/label-has-associated-control
				return render ? render(mergedProps, renderProps) : <label {...mergedProps} />;
			}}
		>
			{composeRenderProps(restProps.children, (children, renderProps) => {
				const state = {
					isDisabled: renderProps.isDisabled,
					isFocusVisible: renderProps.isFocusVisible,
					isHovered: renderProps.isHovered,
					isIndeterminate: renderProps.isIndeterminate,
					isInvalid: renderProps.isInvalid,
					isPressed: renderProps.isPressed,
					isReadOnly: renderProps.isReadOnly,
					isSelected: renderProps.isSelected,
				};
				return <CheckboxStateProvider {...state}>{children}</CheckboxStateProvider>;
			})}
		</RacCheckboxButton>
	);
}

/** Line-height-sized wrapper that centres the fixed visual checkbox affordance. */
export function CheckboxControl(props: CheckboxControlProps): JSX.Element {
	const { className, style, xstyle, ...restProps } = props;
	return (
		<span
			{...restProps}
			{...composeRecipeProps(
				resolveRecipeSlotProps(checkboxStateRecipe, 'control', undefined, xstyle),
				{
					className,
					style,
				},
			)}
		/>
	);
}

/** Visual square that reflects selected, indeterminate, disabled, and invalid states. */
export function CheckboxIndicator(props: CheckboxIndicatorProps): JSX.Element {
	const { className, style, xstyle, ...restProps } = props;
	const state = useCheckboxState();
	const recipeProps = resolveRecipeSlotProps(
		checkboxStateRecipe,
		'indicator',
		{
			isDisabled: state.isDisabled,
			isFocusVisible: state.isFocusVisible,
			isHovered: state.isHovered,
			isIndeterminate: state.isIndeterminate,
			isInvalid: state.isInvalid,
			isPressed: state.isPressed,
			isReadOnly: state.isReadOnly,
			isSelected: state.isSelected,
		},
		xstyle,
	);
	return (
		<span {...restProps} aria-hidden {...composeRecipeProps(recipeProps, { className, style })} />
	);
}

/** Checkbox field primitive for custom composition. */
export function Checkbox(props: CheckboxProps): JSX.Element {
	const { className, size, style, xstyle, ...restProps } = props;
	const recipeProps = resolveRecipeSlotProps(checkboxStateRecipe, 'root', { size }, xstyle);

	return (
		<RacCheckboxField {...restProps} {...composeRacRecipeProps(recipeProps, className, style)}>
			{composeRenderProps(restProps.children, (children, renderProps) => {
				const state = {
					isDisabled: renderProps.isDisabled,
					isFocusVisible: false,
					isHovered: false,
					isIndeterminate: renderProps.isIndeterminate,
					isInvalid: renderProps.isInvalid,
					isPressed: false,
					isReadOnly: renderProps.isReadOnly,
					isSelected: renderProps.isSelected,
				};
				return <CheckboxStateProvider {...state}>{children}</CheckboxStateProvider>;
			})}
		</RacCheckboxField>
	);
}
