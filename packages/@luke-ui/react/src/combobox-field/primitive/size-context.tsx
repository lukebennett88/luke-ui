import type { JSX, ReactNode } from 'react';
import { createContext, use } from 'react';
import type { ComboboxSize } from './root.js';

const ComboboxSizeContext = createContext<ComboboxSize | null>(null);

export function useComboboxSize(size?: ComboboxSize): ComboboxSize {
	return size ?? use(ComboboxSizeContext) ?? 'medium';
}

export function ComboboxSizeProvider({
	size,
	children,
}: {
	size: ComboboxSize;
	children: ReactNode;
}): JSX.Element {
	return <ComboboxSizeContext.Provider value={size}>{children}</ComboboxSizeContext.Provider>;
}
