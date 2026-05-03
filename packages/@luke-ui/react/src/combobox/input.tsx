import type { JSX } from 'react';
import { useContext } from 'react';
import type { InputProps as RacInputProps } from 'react-aria-components/ComboBox';
import { ComboBoxStateContext, Input as RacInput } from 'react-aria-components/ComboBox';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import * as styles from '../recipes/combobox.css.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import { cx } from '../utils/index.js';

interface ComboboxVariantProps extends NonNullable<styles.ComboboxVariants> {}

interface ComboboxStyleProps {
	size?: ComboboxVariantProps['size'];
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

	const handleClick = (event: React.MouseEvent<HTMLInputElement>) => {
		onClick?.(event);
		if (!state?.isOpen) {
			state?.open();
		}
	};

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
