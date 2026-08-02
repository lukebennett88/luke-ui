import { IconSpritesheetProvider } from '@luke-ui/react/icon';
import type { PropsWithChildren } from 'react';

export function AppSpritesheetProvider({ children }: PropsWithChildren) {
	return (
		<IconSpritesheetProvider href="/assets/spritesheet.svg">{children}</IconSpritesheetProvider>
	);
}
