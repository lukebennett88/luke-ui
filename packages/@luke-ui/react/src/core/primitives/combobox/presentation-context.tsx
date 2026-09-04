import type { JSX, ReactNode } from 'react';
import { createContext, use } from 'react';

/**
 * Which composition a combobox part renders inside: the desktop popover (the default) or the
 * mobile tray. Unlike `useComboboxSize`, there is no local prop override — a primitive cannot be
 * told to render tray styling while composed inside a popover, which would expose an incoherent
 * combination no consumer should reach for.
 */
export type ComboboxPresentation = 'popover' | 'tray';

const ComboboxPresentationContext = createContext<ComboboxPresentation>('popover');

export function useComboboxPresentation(): ComboboxPresentation {
	return use(ComboboxPresentationContext);
}

export function ComboboxPresentationProvider({
	presentation,
	children,
}: {
	presentation: ComboboxPresentation;
	children: ReactNode;
}): JSX.Element {
	return (
		<ComboboxPresentationContext.Provider value={presentation}>
			{children}
		</ComboboxPresentationContext.Provider>
	);
}
