import { Box } from '@luke-ui/react/box';
import type { Root } from 'fumadocs-core/page-tree';
import type { ReactNode } from 'react';
import { DocsNav } from './docs-nav.js';
import * as styles from './docs-shell.css.js';
import { DOCS_SIDEBAR_ID, DocsSiteNav } from './docs-site-nav.js';
import { DocsSearchTrigger } from './search.js';
import { ThemeControls } from './theme-controls.js';

/**
 * The docs page frame: the header and sidebar sit on the page chrome, and the page renders into one
 * content panel beside them. `DocsArticle` places its article in the panel's `main` area and the
 * desktop table of contents in `toc`.
 */
export function DocsShell({ children, tree }: { children: ReactNode; tree: Root }) {
	return (
		<Box backgroundColor="surface.subdued" className={styles.shell} id="docs-shell">
			<DocsSiteNav tree={tree} />
			<aside className={styles.sidebar} id={DOCS_SIDEBAR_ID}>
				<Box paddingInline="space.16">
					<DocsSearchTrigger />
				</Box>
				<Box className={styles.sidebarNav} paddingBlockEnd="space.24" paddingInline="space.16">
					<DocsNav tree={tree} />
				</Box>
				<Box paddingBlock="space.16" paddingInline="space.16">
					<ThemeControls className={styles.sidebarThemeControls} />
				</Box>
			</aside>
			<Box backgroundColor="surface.base" className={styles.panel}>
				{children}
			</Box>
		</Box>
	);
}
