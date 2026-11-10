import { Provider as LukeProvider } from '@luke-ui/react/provider';
import spritesheetHref from '@luke-ui/react/spritesheet.svg?url';
import type { ReactNode } from 'react';

/** Luke UI's Icon reads its spritesheet URL from the Provider. */
export function Provider({ children }: { children: ReactNode }) {
	return <LukeProvider spritesheetHref={spritesheetHref}>{children}</LukeProvider>;
}
