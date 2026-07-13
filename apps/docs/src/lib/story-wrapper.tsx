import { IconSpritesheetProvider } from '@luke-ui/react/icon';
import spriteSheetHref from '@luke-ui/react/spritesheet.svg?url&no-inline';
import type { ReactNode } from 'react';

type StoryWrapperProps = { children: ReactNode };

export function StoryWrapper({ children }: StoryWrapperProps) {
	return (
		<div
			style={{
				alignItems: 'center',
				// Interim plain values; docs theming is rewired against the new theme contract in #96.
				backgroundColor: '#fff',
				color: '#212121',
				display: 'flex',
				justifyContent: 'center',
				minBlockSize: '6rem',
				padding: '2rem',
			}}
		>
			<IconSpritesheetProvider href={spriteSheetHref}>{children}</IconSpritesheetProvider>
		</div>
	);
}
