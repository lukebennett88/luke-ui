import { Box } from '@luke-ui/react/box';
import type { BoxProps } from '@luke-ui/react/box';
import { IconSpritesheetProvider } from '@luke-ui/react/icon';
import spriteSheetHref from '@luke-ui/react/spritesheet.svg?url&no-inline';
import { vars } from '@luke-ui/react/theme';
import type { ReactNode } from 'react';

type Mode = 'inset' | 'full-bleed';

const modeToBoxProps = {
	'full-bleed': {},
	inset: {
		alignItems: 'center',
		display: 'flex',
		justifyContent: 'center',
		minBlockSize: '6rem',
		padding: '800',
		style: {
			backgroundColor: vars.color.surface.canvas,
			color: vars.color.text.primary,
		},
	},
} as const satisfies Record<Mode, React.ComponentProps<typeof Box>>;

type StoryWrapperProps = {
	children: ReactNode;
	mode?: Mode;
	overflow?: BoxProps['overflow'];
};

export function StoryWrapper({ children, mode = 'inset', overflow = 'auto' }: StoryWrapperProps) {
	const boxProps = modeToBoxProps[mode];
	return (
		<Box overflow={overflow} {...boxProps}>
			<IconSpritesheetProvider href={spriteSheetHref}>{children}</IconSpritesheetProvider>
		</Box>
	);
}
