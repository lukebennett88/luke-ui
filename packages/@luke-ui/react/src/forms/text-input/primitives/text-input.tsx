import type { JSX, ReactNode } from 'react';
import type { GroupProps as RacGroupProps } from 'react-aria-components/Group';
import { Group as RacGroup } from 'react-aria-components/Group';
import type { InputProps as RacInputProps } from 'react-aria-components/Input';
import { Input as RacInput } from 'react-aria-components/Input';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import * as styles from '../../../recipes/text-input.css.js';
import { cx } from '../../../utils.js';

interface TextInputVariantProps extends NonNullable<styles.TextInputVariants> {}

interface TextInputStyleProps {
	/** Sets the input size. */
	size?: TextInputVariantProps['size'];
}

/** Allowed `size` values for `TextInput`. */
export type TextInputSize = NonNullable<TextInputVariantProps['size']>;

/** Props for the primitive text input. */
export interface TextInputProps
	extends Omit<RacInputProps, 'className' | keyof TextInputStyleProps>, TextInputStyleProps {
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
