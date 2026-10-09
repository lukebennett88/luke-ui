import { Box } from '@luke-ui/react/box';
import { Provider } from '@luke-ui/react/provider';
import spriteSheetHref from '@luke-ui/react/spritesheet.svg?url&no-inline';
import { vars } from '@luke-ui/react/theme';
import type { ReactNode } from 'react';

type Layout = 'flow' | 'centered' | 'full-bleed';

const layoutToBoxProps = {
	centered: {
		alignItems: 'center',
		display: 'flex',
		justifyContent: 'center',
		minBlockSize: '6rem',
		padding: 'sp32',
		style: {
			backgroundColor: vars.color.surface.base,
			color: vars.color.text.primary,
		},
	},
	flow: {
		minBlockSize: '6rem',
		padding: 'sp32',
		style: {
			backgroundColor: vars.color.surface.base,
			color: vars.color.text.primary,
		},
	},
	'full-bleed': {},
} as const satisfies Record<Layout, React.ComponentProps<typeof Box>>;

type StoryWrapperProps = {
	children: ReactNode;
	layout?: Layout;
};

export function StoryWrapper({ children, layout = 'flow' }: StoryWrapperProps) {
	const boxProps = layoutToBoxProps[layout];
	return (
		<Box overflow="auto" {...boxProps}>
			<Provider spritesheetHref={spriteSheetHref}>{children}</Provider>
		</Box>
	);
}
