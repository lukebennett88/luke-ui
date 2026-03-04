import type { JSX, ReactNode } from 'react';
import type {
	GroupProps as RacGroupProps,
	InputProps as RacInputProps,
} from 'react-aria-components';
import { composeRenderProps, Group as RacGroup, Input as RacInput } from 'react-aria-components';
import * as styles from '../../../recipes/text-input.css.js';
import { cx } from '../../../utils.js';

interface TextInputVariantProps extends NonNullable<styles.TextInputVariants> {}

/** Allowed `size` values for `TextInput`. */
export type TextInputSize = NonNullable<TextInputVariantProps['size']>;

/** Props for the primitive text input. */
export interface TextInputProps
	extends Omit<RacInputProps, 'className' | 'size'>, TextInputVariantProps {
	/** Element shown at the end of the control. */
	adornmentEnd?: ReactNode;
	/** Element shown at the start of the control. */
	adornmentStart?: ReactNode;
	/** Class name for the outer group wrapper. */
	className?: RacGroupProps['className'];
	/** Class name for the inner input element. */
	inputClassName?: RacInputProps['className'];
}

/** Styled text input with optional start/end adornments. */
export function TextInput(props: TextInputProps): JSX.Element {
	const {
		adornmentEnd,
		adornmentStart,
		className,
		inputClassName,
		size = 'medium',
		...inputProps
	} = props;

	return (
		<RacGroup
			className={composeRenderProps(className, (value) => {
				return cx(styles.textInputGroup({ size }), value);
			})}
		>
			{adornmentStart != null ? (
				<span className={styles.textInputAdornmentStart({ size })}>{adornmentStart}</span>
			) : null}
			<RacInput
				{...inputProps}
				className={composeRenderProps(inputClassName, (value) => {
					return cx(styles.textInputControl({ size }), value);
				})}
			/>
			{adornmentEnd != null ? (
				<span className={styles.textInputAdornmentEnd({ size })}>{adornmentEnd}</span>
			) : null}
		</RacGroup>
	);
}
