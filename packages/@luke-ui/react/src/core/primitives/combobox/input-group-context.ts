import type { RefObject } from 'react';
import { createContext, use } from 'react';

/**
 * The combobox's input group: the `ComboboxControl` outside any tray. A tray reads the colour-mode
 * scope from it, because the group inside an open tray sits in the tray's own portal.
 */
export const ComboboxInputGroupContext = createContext<RefObject<HTMLDivElement | null> | null>(
	null,
);

/** Returns the ref to the combobox's input group, or `null` outside a `ComboboxRoot`. */
export function useComboboxInputGroupRef(): RefObject<HTMLDivElement | null> | null {
	return use(ComboboxInputGroupContext);
}
