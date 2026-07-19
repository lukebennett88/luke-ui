import type { JSX, ReactNode } from 'react';
import { createContext, useContext } from 'react';
import type { IconSize } from '../types/token-unions.js';

const IconSizeContext = createContext<IconSize | null>(null);

/** Props for `IconSizeProvider`. */
interface IconSizeProviderProps {
	children: ReactNode;
	size: IconSize;
}

/** Provides a default icon size to nested icon components. */
export function IconSizeProvider({ children, size }: IconSizeProviderProps): JSX.Element {
	return <IconSizeContext.Provider value={size}>{children}</IconSizeContext.Provider>;
}

/** Reads the icon size from context, if provided. */
export function useIconSizeContext(): IconSize | null {
	return useContext(IconSizeContext);
}
