import type { JSX, ReactNode } from 'react';
import { createContext, useContext } from 'react';
import type { IconSizeToken } from '../tokens/index.js';

const IconSizeContext = createContext<IconSizeToken | null>(null);

/** Props for `IconSizeProvider`. */
interface IconSizeProviderProps {
	children: ReactNode;
	size: IconSizeToken;
}

/** Provides a default icon size to nested icon components. */
export function IconSizeProvider({ children, size }: IconSizeProviderProps): JSX.Element {
	return <IconSizeContext.Provider value={size}>{children}</IconSizeContext.Provider>;
}

/** Reads the icon size from context, if provided. */
export function useIconSizeContext(): IconSizeToken | null {
	return useContext(IconSizeContext);
}
