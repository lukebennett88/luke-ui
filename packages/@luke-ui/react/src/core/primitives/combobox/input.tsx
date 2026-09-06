import { useObjectRef } from '@react-aria/utils';
import type { JSX, Ref } from 'react';
import { useContext, useEffect } from 'react';
import type { InputProps as RacInputProps } from 'react-aria-components/ComboBox';
import { ComboBoxStateContext, Input as RacInput } from 'react-aria-components/ComboBox';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import type { DistributiveOmit } from '../../types/distributive-omit.js';
import type { Prettify } from '../../types/prettify.js';
import { useComboboxPresentation } from './presentation-context.js';
import type { ComboboxSize } from './root.js';
import { useComboboxSize } from './size-context.js';
import { comboboxRecipe } from './styles.css.js';

type _ComboboxInputOmit = DistributiveOmit<RacInputProps, 'className' | 'size'>;
interface _ComboboxInputProps extends _ComboboxInputOmit {
	className?: RacInputProps['className'];
	/**
	 * Forwarded to the underlying `<input>` element. Accepts a callback ref or a ref
	 * object, so form libraries that hand out callback refs work without a bridge.
	 */
	ref?: Ref<HTMLInputElement>;
	size?: ComboboxSize;
}

/** Props for the styled combobox text input. */
export type ComboboxInputProps = Prettify<_ComboboxInputProps>;

/**
 * Text input for a combobox. Inside a `ComboboxTray`, acts as the search field and takes focus when
 * the tray opens.
 */
export function ComboboxInput(props: ComboboxInputProps): JSX.Element {
	const { onClick, ref, size: sizeProp, ...inputProps } = props;
	const presentation = useComboboxPresentation();
	const size = useComboboxSize(sizeProp);
	const state = useContext(ComboBoxStateContext);
	const inputRef = useObjectRef(ref);
	const isTraySearch = presentation === 'tray';

	const handleClick = (event: React.MouseEvent<HTMLInputElement>) => {
		onClick?.(event);
		if (!state?.isOpen) {
			state?.open();
		}
	};

	useEffect(() => {
		if (!isTraySearch) return;

		inputRef.current?.focus({ preventScroll: true });
	}, [inputRef, isTraySearch]);

	// The tray input searches the listbox; the trigger opens the dialog.
	const trayInputProps = isTraySearch
		? ({ 'aria-haspopup': 'listbox', role: 'searchbox' } as const)
		: undefined;

	return (
		<RacInput
			{...inputProps}
			{...trayInputProps}
			className={composeRenderProps(inputProps.className, (className) => {
				return comboboxRecipe({ size }).textInput({ className });
			})}
			onClick={handleClick}
			ref={inputRef}
		/>
	);
}
