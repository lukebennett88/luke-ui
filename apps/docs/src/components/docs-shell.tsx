import type { Root } from 'fumadocs-core/page-tree';
import type { ReactNode } from 'react';
import { DocsNav } from './docs-nav.js';
import * as styles from './docs-shell.css.js';
import { DocsSiteNav } from './docs-site-nav.js';

export function DocsShell({ children, tree }: { children: ReactNode; tree: Root }) {
	return (
		<div className={styles.shell} id="docs-shell">
			<DocsSiteNav tree={tree} />
			<aside className={styles.sidebar}>
				<DocsNav tree={tree} />
			</aside>
			{children}
		</div>
	);
}
