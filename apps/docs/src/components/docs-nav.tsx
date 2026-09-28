import { Link } from '@luke-ui/react/link';
import { useRouterState } from '@tanstack/react-router';
import type { Folder, Node, Root } from 'fumadocs-core/page-tree';
import { DocsLink } from './docs-link.js';
import * as styles from './docs-shell.css.js';

interface DocsNavProps {
	onNavigate?: () => void;
	tree: Root;
}

export function DocsNav({ onNavigate, tree }: DocsNavProps) {
	const pathname = useRouterState({ select: (state) => state.location.pathname });
	const roots = collectRootFolders(tree);
	const activeRoot = findActiveRoot(roots, pathname);
	const nodes = (() => {
		if (!activeRoot) return tree.children;
		if (activeRoot.index) return [activeRoot.index, ...activeRoot.children];
		return activeRoot.children;
	})();

	return (
		<nav aria-label="Docs" className={styles.nav}>
			<ul className={styles.navList}>
				{nodes.map((node, index) => (
					<NavNode key={node.$id ?? index} node={node} onNavigate={onNavigate} />
				))}
			</ul>
		</nav>
	);
}

interface NavNodeProps {
	node: Node;
	onNavigate?: () => void;
}

function NavNode({ node, onNavigate }: NavNodeProps) {
	if (node.type === 'separator') return <li className={styles.separator}>{node.name}</li>;
	if (node.type === 'folder') return <NavFolder folder={node} onNavigate={onNavigate} />;
	return (
		<li>
			{node.external ? (
				<Link className={styles.navLink} href={node.url} rel="noopener noreferrer" target="_blank">
					{node.icon}
					{node.name}
				</Link>
			) : (
				<DocsLink
					activeOptions={{ exact: true }}
					className={styles.navLink}
					onClick={onNavigate}
					to={node.url}
				>
					{node.icon}
					{node.name}
				</DocsLink>
			)}
		</li>
	);
}

function NavFolder({ folder, onNavigate }: { folder: Folder; onNavigate?: () => void }) {
	return (
		<li>
			<div className={styles.folderLabel}>
				{folder.icon}
				{folder.name}
			</div>
			<ul className={styles.nestedList}>
				{folder.index && <NavNode node={folder.index} onNavigate={onNavigate} />}
				{folder.children.map((node, index) => (
					<NavNode key={node.$id ?? index} node={node} onNavigate={onNavigate} />
				))}
			</ul>
		</li>
	);
}

function collectRootFolders(tree: Root): Array<Folder> {
	const roots: Array<Folder> = [];
	for (let current: Root | undefined = tree; current; current = current.fallback) {
		for (const node of current.children) {
			if (node.type === 'folder' && node.root) roots.push(node);
		}
	}
	return roots;
}

/** First path segment for a page URL, used as the site section key (`/docs`, `/components`). */
function sectionKey(url: string) {
	return `/${url.split('/')[1]}`;
}

function findActiveRoot(roots: Array<Folder>, pathname: string): Folder | undefined {
	const pathnameSection = sectionKey(pathname);
	for (const root of roots) {
		const url = root.index?.url ?? root.children.find((node) => node.type === 'page')?.url;
		if (!url) continue;
		if (sectionKey(url) === pathnameSection) return root;
	}
	return roots[0];
}
