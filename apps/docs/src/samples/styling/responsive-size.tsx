import { Box } from '@luke-ui/react/box';
import { breakpoints } from '@luke-ui/react/theme';
import { style } from '@vanilla-extract/css';
import type { PropsWithChildren } from 'react';

// The unnamed query measures the nearest size container, like responsive Box values.
const sidebar = style({
	inlineSize: '100%',
	'@container': {
		[`(inline-size >= ${breakpoints.bp768}px)`]: {
			inlineSize: '15.25rem',
		},
	},
});

export function Sidebar({ children }: PropsWithChildren) {
	return (
		<Box className={sidebar} flexShrink="0">
			{children}
		</Box>
	);
}
