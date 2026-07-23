import type { JSX } from 'react';
import { useContext } from 'react';
import type { InputProps as RacInputProps } from 'react-aria-components/ComboBox';
import { ComboBoxStateContext, Input as RacInput } from 'react-aria-components/ComboBox';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import * as styles from '../../recipes/combobox.css.js';
import type { DistributiveOmit } from '../../types/distributive-omit.js';
import type { Prettify } from '../../types/prettify.js';
import type { ComboboxSize } from './root.js';
import { useComboboxSize } from './size-context.js';

type _ComboboxTextInputOmit = DistributiveOmit<RacInputProps, 'className' | 'size'>;
interface _ComboboxTextInputProps extends _ComboboxTextInputOmit {
	className?: RacInputProps['className'];
	size?: ComboboxSize;
}

/**
 * Props for the styled combobox text input.
 *
 * @tier primitive
 */
export type ComboboxTextInputProps = Prettify<_ComboboxTextInputProps>;

/** Text input used within `ComboboxControl` for combobox behavior. */
export function ComboboxTextInput(props: ComboboxTextInputProps): JSX.Element {
	const { onClick, size: sizeProp, ...inputProps } = props;
	const size = useComboboxSize(sizeProp);
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
			className={composeRenderProps(inputProps.className, (className) => {
				return styles.combobox({ size }).textInput(className);
			})}
			onClick={handleClick}
		/>
	);
}
