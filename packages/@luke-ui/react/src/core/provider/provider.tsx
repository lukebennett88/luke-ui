import type { JSX, ReactNode } from 'react';
import { IconSpritesheetProvider } from '../icon/icon.js';

/** Props for `Provider`. */
export interface ProviderProps {
	children: ReactNode;
	/**
	 * URL for `@luke-ui/react/spritesheet.svg`.
	 * Do not inline it as a `data:` URL.
	 */
	spritesheetHref: string;
}

/** Provides the icon spritesheet URL to Luke UI components. */
export function Provider({ children, spritesheetHref }: ProviderProps): JSX.Element {
	return <IconSpritesheetProvider href={spritesheetHref}>{children}</IconSpritesheetProvider>;
}
