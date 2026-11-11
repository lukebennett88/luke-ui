import type { JSX, ReactNode } from 'react';
import { createContext, use } from 'react';
import { useControlSize } from '../../sizing/control-size-context.js';
import type { ComboboxSize } from './root.js';

const ComboboxSizeContext = createContext<ComboboxSize | null>(null);

export function useComboboxSize(size?: ComboboxSize): ComboboxSize {
	return useControlSize(size ?? use(ComboboxSizeContext) ?? undefined);
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
