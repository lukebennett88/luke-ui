import { Box } from '@luke-ui/react/box';
import type { Root } from 'fumadocs-core/page-tree';
import type { ReactNode } from 'react';
import { useSyncExternalStore } from 'react';
import { DOCS_SHELL_ID } from './docs-container-queries.js';
import { DocsNav } from './docs-nav.js';
import * as styles from './docs-shell.css.js';
import {
	getIsSidebarCollapsedSnapshot,
	getServerIsSidebarCollapsedSnapshot,
	subscribeToSidebarPref,
} from './sidebar-prefs.js';
import { DOCS_SIDEBAR_ID, SiteHeader } from './site-header.js';

/**
 * The docs page frame and the `docs-shell` container. `DocsArticle` places its article in the
 * panel's `main` area and the desktop table of contents in `toc`.
 */
export function DocsShell({ children, tree }: { children: ReactNode; tree: Root }) {
	const isCollapsed = useSyncExternalStore(
		subscribeToSidebarPref,
		getIsSidebarCollapsedSnapshot,
		getServerIsSidebarCollapsedSnapshot,
	);

	return (
		<Box backgroundColor="surface.subdued" className={styles.shellContainer} id={DOCS_SHELL_ID}>
			<div className={styles.shell}>
				<SiteHeader className={styles.header} tree={tree} />
				<aside className={styles.sidebar} id={DOCS_SIDEBAR_ID} inert={isCollapsed}>
					<Box className={styles.sidebarNav} paddingBlockEnd="space.24" paddingInline="space.16">
						<DocsNav tree={tree} />
					</Box>
				</aside>
				<Box backgroundColor="surface.base" className={styles.panel}>
					{children}
				</Box>
			</div>
		</Box>
	);
}
