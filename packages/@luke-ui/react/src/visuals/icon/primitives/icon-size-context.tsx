import type { JSX, ReactNode } from 'react';
import { createContext, useContext } from 'react';
import type { IconSizeToken } from '../../../tokens.js';

const IconSizeContext = createContext<IconSizeToken | null>(null);

interface IconSizeProviderProps {
	children: ReactNode;
	size: IconSizeToken;
}

export function IconSizeProvider({
	children,
	size,
}: IconSizeProviderProps): JSX.Element {
	return (
		<IconSizeContext.Provider value={size}>{children}</IconSizeContext.Provider>
	);
}

export function useIconSizeContext(): IconSizeToken | null {
	return useContext(IconSizeContext);
}
