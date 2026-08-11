import { searchPath } from 'fumadocs-core/breadcrumb';
import type { Node, Root } from 'fumadocs-core/page-tree';
import { loader } from 'fumadocs-core/source';
import { expect, test } from 'vite-plus/test';
import { docs } from '../../.source/server.js';
import { getDocsTreePathname } from './component-page-navigation.js';

const source = loader({
	baseUrl: '/',
	source: docs.toFumadocsSource(),
});

/** `Components` is a root folder, so Fumadocs puts it on `tree.fallback`, not `tree.children`. */
function allNodes(tree: Root): ReadonlyArray<Node> {
	return tree.fallback ? [...tree.children, ...tree.fallback.children] : tree.children;
}

/** The root folder in a `searchPath` result, per `getBreadcrumbItemsFromPath` in `fumadocs-core/breadcrumb`. */
function findRootFolder(path: ReadonlyArray<Node>) {
	return path.find((node) => node.type === 'folder' && node.root);
}

test('a Props URL is hidden from the tree, so Fumadocs cannot match it directly', () => {
	const tree = source.getPageTree();
	const nodes = [...allNodes(tree)];
	const propsUrl = '/components/actions/button/props';

	expect(searchPath(nodes, propsUrl)).toBeNull();
});

test('remapping a Props URL to its Guide URL keeps tree matching under the Components root', () => {
	const tree = source.getPageTree();
	const nodes = [...allNodes(tree)];
	const guideUrl = '/components/actions/button';
	const propsUrl = `${guideUrl}/props`;

	const guidePath = searchPath(nodes, guideUrl);
	const remappedPath = searchPath(nodes, getDocsTreePathname(propsUrl));

	expect(guidePath).not.toBeNull();
	expect(remappedPath).not.toBeNull();
	expect(findRootFolder(remappedPath ?? [])?.name).toBe('Components');
	expect(findRootFolder(remappedPath ?? [])?.name).toBe(findRootFolder(guidePath ?? [])?.name);
});
