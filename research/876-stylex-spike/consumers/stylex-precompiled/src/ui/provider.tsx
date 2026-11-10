import type { ReactNode } from 'react';

/** The prototype inlines its three SVG icons, so it needs no spritesheet provider. */
export function Provider({ children }: { children: ReactNode }) {
	return children;
}
