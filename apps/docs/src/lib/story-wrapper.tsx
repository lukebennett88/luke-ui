import { IconSpritesheetProvider } from '@luke-ui/react/icon';
import spriteSheetHref from '@luke-ui/react/spritesheet.svg?url&no-inline';
import { vars } from '@luke-ui/react/theme';
import type { ReactNode } from 'react';

type StoryWrapperProps = { children: ReactNode };

export function StoryWrapper({ children }: StoryWrapperProps) {
	return (
		<div
			style={{
				alignItems: 'center',
				backgroundColor: vars.backgroundColor.default,
				color: vars.foregroundColor.primary,
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
