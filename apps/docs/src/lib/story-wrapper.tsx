import { Box } from '@luke-ui/react/box';
import type { ReactNode } from 'react';

type Layout = 'flow' | 'centered' | 'full-bleed';

const layoutToBoxProps = {
	centered: {
		alignItems: 'center',
		backgroundColor: 'surface.base',
		display: 'flex',
		justifyContent: 'center',
		minBlockSize: '6rem',
		padding: 'space.32',
	},
	flow: {
		backgroundColor: 'surface.base',
		minBlockSize: '6rem',
		padding: 'space.32',
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
			{children}
		</Box>
	);
}
