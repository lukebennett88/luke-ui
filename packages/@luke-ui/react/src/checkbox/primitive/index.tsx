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
import type { CheckboxVariants } from '../../recipes/checkbox.css.js';
import * as styles from '../../recipes/checkbox.css.js';
import type { DistributiveOmit } from '../../types/distributive-omit.js';
import type { Prettify } from '../../types/prettify.js';

type _CheckboxOmit = DistributiveOmit<RacCheckboxFieldProps, 'children'>;

interface _CheckboxProps extends _CheckboxOmit {
	/** Checkbox anatomy, including clickable `CheckboxContent`. */
	children: RacCheckboxFieldProps['children'];
	/** Initial selection state for an uncontrolled checkbox. */
	defaultSelected?: RacCheckboxFieldProps['defaultSelected'];
	/** Whether the checkbox is unavailable. */
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
	/**
	 * Visual size of the checkbox control.
	 *
	 * @default 'medium'
	 */
	size?: CheckboxVariants['size'];
}

/**
 * Props for the Checkbox primitive root.
 *
 * @tier primitive
 */
export type CheckboxProps = Prettify<_CheckboxProps>;

type _CheckboxContentOmit = DistributiveOmit<RacCheckboxButtonProps, 'children'>;

interface _CheckboxContentProps extends _CheckboxContentOmit {
	/** The control, indicator, and visible checkbox label. */
	children: RacCheckboxButtonProps['children'];
}

/**
 * Props for the Checkbox primitive's clickable content.
 *
 * @tier primitive
 */
export type CheckboxContentProps = Prettify<_CheckboxContentProps>;

type _CheckboxControlOmit = DistributiveOmit<ComponentProps<'span'>, never>;

interface _CheckboxControlProps extends _CheckboxControlOmit {}

/**
 * Props for the Checkbox primitive's control wrapper.
 *
 * @tier primitive
 */
export type CheckboxControlProps = Prettify<_CheckboxControlProps>;

type _CheckboxIndicatorOmit = DistributiveOmit<ComponentProps<'span'>, never>;

interface _CheckboxIndicatorProps extends _CheckboxIndicatorOmit {}

/**
 * Props for the Checkbox primitive's visual indicator.
 *
 * @tier primitive
 */
export type CheckboxIndicatorProps = Prettify<_CheckboxIndicatorProps>;

/** Clickable content that keeps the checkbox input and label associated. */
export function CheckboxContent(props: CheckboxContentProps): JSX.Element {
	return (
		<RacCheckboxButton
			{...props}
			className={composeRenderProps(props.className, (className) => {
				return styles.checkbox().content(className);
			})}
		/>
	);
}

/** Line-height-sized wrapper that centres the fixed visual checkbox affordance. */
export function CheckboxControl(props: CheckboxControlProps): JSX.Element {
	const { className, ...restProps } = props;
	return <span {...restProps} className={styles.checkbox().control(className)} />;
}

/** Visual square that reflects selected, indeterminate, disabled, and invalid states. */
export function CheckboxIndicator(props: CheckboxIndicatorProps): JSX.Element {
	const { className, ...restProps } = props;
	return <span {...restProps} aria-hidden className={styles.checkbox().indicator(className)} />;
}

/**
 * Checkbox field primitive for custom composition.
 *
 * @tier primitive
 */
export function Checkbox(props: CheckboxProps): JSX.Element {
	const { className, size, ...restProps } = props;

	return (
		<RacCheckboxField
			{...restProps}
			className={composeRenderProps(className, (className) => {
				return styles.checkbox({ size }).root(className);
			})}
		/>
	);
}
