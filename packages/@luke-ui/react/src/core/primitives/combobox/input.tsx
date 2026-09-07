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
	const inputContext = useSlottedContext(InputContext);

	const handleClick = (event: React.MouseEvent<HTMLInputElement>) => {
		onClick?.(event);
		// `menuTrigger="focus"` cannot reopen the menu when Escape closes it
		// without moving focus, so handle a subsequent click explicitly.
		// The tray search input never opens the combobox; its trigger owns that.
		if (isTraySearch || state?.isOpen) return;
		state?.open();
	};

	useEffect(() => {
		if (!isTraySearch) return;

		inputRef.current?.focus({ preventScroll: true });
	}, [inputRef, isTraySearch]);

	// The tray input searches the listbox; the trigger opens the dialog.
	const trayInputProps = isTraySearch
		? ({ 'aria-haspopup': 'listbox', role: 'searchbox' } as const)
		: undefined;

	// `RacInput` merges React Aria's `InputContext` underneath its props. Inside a tray that
	// context is the combobox's full `inputProps`, so filter out the trigger-only members before
	// re-providing it: `aria-expanded` is not valid on `role="searchbox"`, and `onTouchEnd` is the
	// combobox touch-to-toggle handler. List state such as `aria-controls`, `aria-autocomplete`,
	// and `aria-activedescendant` passes through for virtual focus.
	const {
		'aria-expanded': _ariaExpanded,
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

	// The React Compiler memoizes this value.
	// oxlint-disable-next-line react/jsx-no-constructed-context-values
	return <InputContext.Provider value={trayContext}>{input}</InputContext.Provider>;
}
