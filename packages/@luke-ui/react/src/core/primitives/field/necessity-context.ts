import { createContext } from 'react';

/** How a field shows whether its control is required or optional. */
export type NecessityIndicator = 'required-asterisk' | 'required-label' | 'optional-label';

/**
 * Necessity indicator from the nearest configured `Form`. `undefined` means no Form has set one in
 * this subtree.
 */
export const FormNecessityContext = createContext<NecessityIndicator | undefined>(undefined);
