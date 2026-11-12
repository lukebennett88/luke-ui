import { Box } from '@luke-ui/react/box';
import type { PropsWithChildren } from 'react';
import { sidebar } from './responsive-size.css';

export function Sidebar({ children }: PropsWithChildren) {
	return (
		<Box className={sidebar} flexShrink="0">
			{children}
		</Box>
	);
}
