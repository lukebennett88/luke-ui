import { Box } from '@luke-ui/react/box';
import type { ReactNode } from 'react';
import * as styles from './site-frame.css.js';
import { SiteNav } from './site-nav.js';

/**
 * The frame for pages without the docs sidebar: the header on the page chrome, and the page in one
 * `main` panel inset by the header's gutter, with rounded top corners, running to the bottom.
 */
export function SiteFrame({
	children,
	hideActiveDestination,
}: {
	children: ReactNode;
	hideActiveDestination?: boolean;
}) {
	return (
		<Box backgroundColor="surface.subdued" display="flex" flexDirection="column" flexGrow="1">
			<SiteNav hideActiveDestination={hideActiveDestination} />
			<Box
				backgroundColor="surface.base"
				className={styles.insetPanel}
				elementType="main"
				flexGrow="1"
				marginInline={{
					initial: 'space.16',
					bp768: 'space.24',
				}}
			>
				{children}
			</Box>
		</Box>
	);
}
