import type { JSX, ReactNode } from 'react';
import { createContext, use } from 'react';
import type { ComboboxPresentation } from './styles.css.js';

export type { ComboboxPresentation };

const ComboboxPresentationContext = createContext<ComboboxPresentation | null>(null);

/** Returns the current combobox presentation. */
export function useComboboxPresentation(): ComboboxPresentation {
	return use(ComboboxPresentationContext) ?? 'popover';
}

/** Provides a combobox presentation to its descendants. */
export function ComboboxPresentationProvider({
	children,
	presentation,
}: {
	children: ReactNode;
	presentation: ComboboxPresentation;
}): JSX.Element {
	return (
		<ComboboxPresentationContext.Provider value={presentation}>
			{children}
		</ComboboxPresentationContext.Provider>
	);
}
