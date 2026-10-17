import type { JSX, ReactNode } from 'react';
import { useContext } from 'react';
import { SelectableCollectionContext } from 'react-aria-components/Autocomplete';
import { ComboBoxStateContext } from 'react-aria-components/ComboBox';
import { InputContext } from 'react-aria-components/Input';
import { LabelContext } from 'react-aria-components/Label';
import { PopoverContext } from 'react-aria-components/Popover';
import { useSlottedContext } from 'react-aria-components/slots';
import { MobileOverlay } from '../../overlays/mobile-overlay.js';
import type { Prettify } from '../../types/prettify.js';
import { useComboboxInputGroupRef } from './input-group-context.js';
import { ComboboxPresentationProvider } from './presentation-context.js';

// The listbox uses virtual focus: DOM focus stays on the search input while
// `aria-activedescendant` tracks the active option.
const trayCollectionContextValue = { shouldUseVirtualFocus: true };

interface _ComboboxTrayProps {
	/** Typically a search `ComboboxControl` followed by a `ComboboxListBox`. */
	children: ReactNode;
}

/** Props for the combobox tray. */
export type ComboboxTrayProps = Prettify<_ComboboxTrayProps>;

/** Full-screen options tray, paired with a `ComboboxTrayTrigger`. */
export function ComboboxTray(props: ComboboxTrayProps): JSX.Element {
	const { children } = props;
	const labelContext = useSlottedContext(LabelContext);
	const inputContext = useSlottedContext(InputContext);
	const popoverContext = useSlottedContext(PopoverContext);
	const state = useContext(ComboBoxStateContext);
	const inputGroupRef = useComboboxInputGroupRef();

	const content = (
		<ComboboxPresentationProvider presentation="tray">
			<SelectableCollectionContext.Provider value={trayCollectionContextValue}>
				{children}
			</SelectableCollectionContext.Provider>
		</ComboboxPresentationProvider>
	);

	// No state yet means React Aria's hidden collection pass. Hideable controls render nothing here.
	if (state == null) return content;

	// A visible label lands on `LabelContext`. `aria-label` / `aria-labelledby` on the combobox root
	// land on `InputContext` instead, so the tray must read both for the dialog's name.
	const ariaLabelledBy = labelContext?.id ?? inputContext?.['aria-labelledby'];
	const ariaLabel =
		ariaLabelledBy != null
			? undefined
			: (labelContext?.['aria-label'] ?? inputContext?.['aria-label']);

	return (
		<MobileOverlay
			aria-label={ariaLabel}
			aria-labelledby={ariaLabelledBy}
			isOpen={state.isOpen}
			onOpenChange={(isOpen) => {
				if (isOpen) return;

				// Clear combobox focus before closing to prevent it from reopening.
				state.setFocused(false);
				state.close();
			}}
			// React Aria uses the popover ref for measurement and dismissal.
			ref={popoverContext?.ref}
			triggerRef={inputGroupRef}
		>
			{content}
		</MobileOverlay>
	);
}
