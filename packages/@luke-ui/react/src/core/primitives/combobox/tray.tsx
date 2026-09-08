import type { JSX, ReactNode } from 'react';
import { useContext } from 'react';
import { SelectableCollectionContext } from 'react-aria-components/Autocomplete';
import { ComboBoxStateContext } from 'react-aria-components/ComboBox';
import { LabelContext } from 'react-aria-components/Label';
import { PopoverContext } from 'react-aria-components/Popover';
import { useSlottedContext } from 'react-aria-components/slots';
import { MobileOverlay } from '../../overlays/mobile-overlay.js';
import type { Prettify } from '../../types/prettify.js';
import { ComboboxPresentationProvider } from './presentation-context.js';

// The listbox uses virtual focus: DOM focus stays on the search input while
// `aria-activedescendant` tracks the active option.
const trayCollectionContextValue = { shouldUseVirtualFocus: true };

interface _ComboboxTrayProps {
	/** Typically a search `ComboboxInputGroup` followed by a `ComboboxListBox`. */
	children: ReactNode;
}

/** Props for the combobox tray. */
export type ComboboxTrayProps = Prettify<_ComboboxTrayProps>;

/** Full-screen options tray, paired with a `ComboboxTrayTrigger`. */
export function ComboboxTray(props: ComboboxTrayProps): JSX.Element {
	const { children } = props;
	const labelContext = useSlottedContext(LabelContext);
	const popoverContext = useSlottedContext(PopoverContext);
	const state = useContext(ComboBoxStateContext);

	const content = (
		<ComboboxPresentationProvider presentation="tray">
			<SelectableCollectionContext.Provider value={trayCollectionContextValue}>
				{children}
			</SelectableCollectionContext.Provider>
		</ComboboxPresentationProvider>
	);

	// No state yet means React Aria's hidden collection pass. Hideable controls render nothing here.
	if (state == null) return content;

	return (
		<MobileOverlay
			aria-label={labelContext?.['aria-label']}
			aria-labelledby={labelContext?.id}
			isOpen={state.isOpen}
			onOpenChange={(isOpen) => {
				if (isOpen) return;

				// Clear combobox focus before closing to prevent it from reopening.
				state.setFocused(false);
				state.close();
			}}
			// React Aria uses the popover ref for measurement and dismissal.
			ref={popoverContext?.ref}
		>
			{content}
		</MobileOverlay>
	);
}
