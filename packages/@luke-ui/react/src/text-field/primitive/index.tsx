import type { JSX, ReactNode } from 'react';
import type { GroupProps as RacGroupProps } from 'react-aria-components/Group';
import { Group as RacGroup } from 'react-aria-components/Group';
import type { InputProps as RacInputProps } from 'react-aria-components/Input';
import { Input as RacInput } from 'react-aria-components/Input';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import * as styles from '../../recipes/text-input.css.js';
import type { DistributiveOmit } from '../../types/distributive-omit.js';
import type { Prettify } from '../../types/prettify.js';

/** Allowed `size` values for `TextInput`. */
export type TextInputSize = styles.TextInputSize;

interface TextInputStyleProps {
	/**
	 * Sets the input size.
	 * @default 'medium'
	 */
	size?: TextInputSize;
}

type _TextInputOmit = DistributiveOmit<RacInputProps, 'className' | keyof TextInputStyleProps>;
interface _TextInputProps extends _TextInputOmit, TextInputStyleProps {
	/** Element shown at the end of the control. */
	adornmentEnd?: ReactNode;
	/** Element shown at the start of the control. */
	adornmentStart?: ReactNode;
	/** Class name for the outer group wrapper. */
	className?: RacGroupProps['className'];
	/** Class name for the inner input element. */
	inputClassName?: RacInputProps['className'];
}

/**
 * Props for the primitive text input.
 *
 * @tier primitive
 */
export type TextInputProps = Prettify<_TextInputProps>;

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

	const slots = styles.textInput({ size });

	return (
		<RacGroup
			className={composeRenderProps(className, (value) => {
				return slots.group(value);
			})}
		>
			{adornmentStart != null ? (
				<span className={slots.adornmentStart()}>{adornmentStart}</span>
			) : null}
			<RacInput
				{...inputProps}
				className={composeRenderProps(inputClassName, (value) => {
					return slots.control(value);
				})}
			/>
			{adornmentEnd != null ? <span className={slots.adornmentEnd()}>{adornmentEnd}</span> : null}
		</RacGroup>
	);
}
