import { Box } from '@luke-ui/react/box';
import { cx } from '@luke-ui/react/utils';
import type { ReactNode } from 'react';
import * as styles from './contents.css.js';

export const SIDEBAR_ID = 'review-sidebar';

/** Contains the report index beside the captures or inside its drawer. */
export function Sidebar({ children, isOverlay }: { children: ReactNode; isOverlay: boolean }) {
	return (
		<Box
			backgroundColor={isOverlay ? 'surface.raised' : 'surface.subdued'}
			className={cx(styles.sidebar, isOverlay && styles.sidebarInOverlay)}
			id={SIDEBAR_ID}
		>
			{children}
		</Box>
	);
}
