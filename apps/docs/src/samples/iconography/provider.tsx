import { Provider } from '@luke-ui/react/provider';
import spriteSheetHref from '@luke-ui/react/spritesheet.svg?url&no-inline';
import type { PropsWithChildren } from 'react';

export function AppRoot({ children }: PropsWithChildren) {
	return <Provider spritesheetHref={spriteSheetHref}>{children}</Provider>;
}
