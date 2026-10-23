import type { Folder, Node, Root } from 'fumadocs-core/page-tree';
import { findPath } from 'fumadocs-core/page-tree';

const TRAILING_SLASH_PATTERN = /\/+$/;

/** A section named Overview tells the reader nothing, so the root folder names its pages. */
const OVERVIEW_SECTION_NAME = 'Overview';

export function normalisePathname(pathname: string) {
	return pathname.replace(TRAILING_SLASH_PATTERN, '') || '/';
}

/**
 * Names the sidebar section a page belongs to: the separator it sits under in its root folder, or
 * that folder's title when the separator is Overview or there is none. Reads the server page tree,
 * whose names are still the plain strings from `meta.json` and frontmatter. Returns `null` for a
 * page outside the tree.
 */
export function findPageSectionName(tree: Root, url: string): string | null {
	const pageUrl = normalisePathname(url);
	const isPage = (node: Node) => node.type === 'page' && normalisePathname(node.url) === pageUrl;

	for (let current: Root | undefined = tree; current; current = current.fallback) {
		// The path lists the separator before each node it passes through, so the node after the
		// root folder is the page's section separator when it has one.
		const path = findPath(current.children, isPage);
		if (!path) continue;

		const rootIndex = path.findLastIndex(
			(node): node is Folder => node.type === 'folder' && node.root === true,
		);
		const sectionNode = path[rootIndex + 1];
		if (sectionNode?.type === 'separator' && sectionNode.name !== OVERVIEW_SECTION_NAME) {
			return textName(sectionNode.name);
		}
		const rootFolder = path[rootIndex];
		return rootFolder ? textName(rootFolder.name) : null;
	}
	return null;
}

function textName(name: Node['name']) {
	return typeof name === 'string' ? name : null;
}
