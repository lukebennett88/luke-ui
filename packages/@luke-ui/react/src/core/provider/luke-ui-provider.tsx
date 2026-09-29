import type { JSX, ReactNode } from 'react';
import { IconSpritesheetProvider } from '../icon/icon.js';

/** Props for the application-level `LukeUIProvider`. */
export interface LukeUIProviderProps {
	children: ReactNode;
	/**
	 * URL to `@luke-ui/react/spritesheet.svg`.
	 * Bundlers must emit a fetchable URL, not an inlined `data:` URL.
	 */
	spritesheetHref: string;
}

/**
 * Thin application provider for runtime context Luke UI needs at the app root.
 * Starts with icon spritesheet delivery; theme identity stays build-time / static CSS.
 */
export function LukeUIProvider({ children, spritesheetHref }: LukeUIProviderProps): JSX.Element {
	return <IconSpritesheetProvider href={spritesheetHref}>{children}</IconSpritesheetProvider>;
}
