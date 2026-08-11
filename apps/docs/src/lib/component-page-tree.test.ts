import { searchPath } from 'fumadocs-core/breadcrumb';
import type { Item, Node, Root } from 'fumadocs-core/page-tree';
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

/** Find a clickable node by URL. Display names repeat across groups (Actions Button vs Primitives Button). */
function findClickableNode(nodes: ReadonlyArray<Node>, url: string): Item | undefined {
	for (const node of nodes) {
		if (node.type === 'page' && node.url === url) return node;
		if (node.type === 'folder') {
			if (node.index?.url === url) return node.index;
			const found = findClickableNode(node.children, url);
			if (found !== undefined) return found;
		}
	}
	return undefined;
}

function findAnyNodeWithUrl(nodes: ReadonlyArray<Node>, url: string): Node | undefined {
	for (const node of nodes) {
		if (node.type === 'page' && node.url === url) return node;
		if (node.type === 'folder') {
			if (node.index?.url === url) return node;
			const found = findAnyNodeWithUrl(node.children, url);
			if (found !== undefined) return found;
		}
	}
	return undefined;
}

test('guides live under /docs, not the docs content root', () => {
	const tree = source.getPageTree();
	const nodes = allNodes(tree);

	expect(findClickableNode(nodes, '/docs/installation')?.url).toBe('/docs/installation');
	expect(findAnyNodeWithUrl(nodes, '/installation')).toBeUndefined();
	expect(source.getPage(['docs', 'installation'])).toBeDefined();
	expect(source.getPage(['installation'])).toBeUndefined();
});

const components: ReadonlyArray<{ group: string; name: string }> = [
	{ group: 'actions', name: 'button' },
	{ group: 'actions', name: 'icon-button' },
	{ group: 'forms', name: 'text-field' },
	{ group: 'layout', name: 'box' },
	{ group: 'typography', name: 'heading' },
	{ group: 'primitives', name: 'visually-hidden' },
];

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

for (const { group, name } of components) {
	test(`the sidebar entry for /components/${group}/${name} is clickable and hides its Props page`, () => {
		const tree = source.getPageTree();
		const nodes = allNodes(tree);
		const guideUrl = `/components/${group}/${name}`;
		const propsUrl = `${guideUrl}/props`;

		const clickable = findClickableNode(nodes, guideUrl);
		expect(clickable, `expected a clickable node for ${guideUrl}`).toBeDefined();
		expect(clickable?.url).toBe(guideUrl);

		expect(
			findAnyNodeWithUrl(nodes, propsUrl),
			`${propsUrl} should not appear in the page tree`,
		).toBeUndefined();

		expect(source.getPage(['components', group, name])).toBeDefined();
		expect(source.getPage(['components', group, name, 'props'])).toBeDefined();
	});
}
