import { useObjectRef } from '@react-aria/utils';
import type { JSX, Ref } from 'react';
import { useContext, useEffect } from 'react';
import type { InputProps as RacInputProps } from 'react-aria-components/ComboBox';
import { ComboBoxStateContext, Input as RacInput } from 'react-aria-components/ComboBox';
import { InputContext } from 'react-aria-components/Input';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import { useSlottedContext } from 'react-aria-components/slots';
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
 * Text input for a combobox. Inside a `ComboboxTray`, this is the search field: it takes focus when
 * the tray opens and does not submit a form value. `ComboboxTrayTrigger` owns submission while the
 * tray is closed.
 */
export function ComboboxInput(props: ComboboxInputProps): JSX.Element {
	const { onClick, ref, size: sizeProp, ...inputProps } = props;
	const presentation = useComboboxPresentation();
	const size = useComboboxSize(sizeProp);
	const state = useContext(ComboBoxStateContext);
	const inputRef = useObjectRef(ref);
	const isTraySearch = presentation === 'tray';
	const inputContext = useSlottedContext(InputContext);

	const handleClick = (event: React.MouseEvent<HTMLInputElement>) => {
		onClick?.(event);
		// Escape leaves focus here, so `menuTrigger="focus"` will not reopen. The tray search never opens.
		if (isTraySearch || state?.isOpen) return;
		state?.open();
	};

	useEffect(() => {
		if (!isTraySearch) return;

		inputRef.current?.focus({ preventScroll: true });
	}, [inputRef, isTraySearch]);

	const trayInputProps = isTraySearch
		? ({ 'aria-haspopup': 'listbox', role: 'searchbox' } as const)
		: undefined;

	// Strip trigger-only props from the tray `InputContext`: `aria-expanded`, `onTouchEnd` (popover
	// toggle), and `name` (would double-submit in text mode). Keep listbox virtual-focus attributes.
	const {
		'aria-expanded': _ariaExpanded,
		name: _name,
		onTouchEnd: _onTouchEnd,
		...trayContext
	} = inputContext ?? {};
	const input = (
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

	if (!isTraySearch) return input;

	// oxlint-disable-next-line react/jsx-no-constructed-context-values
	return <InputContext.Provider value={trayContext}>{input}</InputContext.Provider>;
}
