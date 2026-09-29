import { LukeUIProvider } from '@luke-ui/react/provider';
import type { PropsWithChildren } from 'react';

export function AppRoot({ children }: PropsWithChildren) {
	return <LukeUIProvider spritesheetHref="/assets/spritesheet.svg">{children}</LukeUIProvider>;
}
