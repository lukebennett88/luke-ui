import type { Root } from 'fumadocs-core/page-tree';
import { expect, test } from 'vite-plus/test';
import { findPageSectionName } from './page-section.js';

const tree: Root = {
	name: 'Docs',
	children: [
		{
			type: 'folder',
			name: 'Documentation',
			root: true,
			children: [
				{ type: 'separator', name: 'Overview' },
				{ type: 'page', name: 'Installation', url: '/docs/installation' },
				{ type: 'separator', name: 'Theming' },
				{ type: 'page', name: 'Applying a theme', url: '/docs/applying-a-theme' },
				{
					type: 'folder',
					name: 'Recipes',
					children: [{ type: 'page', name: 'Dark mode', url: '/docs/recipes/dark-mode' }],
				},
			],
		},
	],
	fallback: {
		name: 'Components',
		children: [
			{
				type: 'folder',
				name: 'Components',
				root: true,
				index: { type: 'page', name: 'Components', url: '/components' },
				children: [
					{ type: 'page', name: 'Unsorted', url: '/components/unsorted' },
					{ type: 'separator', name: 'Actions' },
					{ type: 'page', name: 'Button', url: '/components/actions/button' },
				],
			},
		],
	},
};

const cases = [
	{ url: '/docs/applying-a-theme', expected: 'Theming' },
	{ url: '/docs/recipes/dark-mode', expected: 'Theming' },
	{ url: '/docs/installation', expected: 'Documentation' },
	{ url: '/components/actions/button/', expected: 'Actions' },
	{ url: '/components', expected: 'Components' },
	{ url: '/components/unsorted', expected: 'Components' },
	{ url: '/docs/missing', expected: null },
];

for (const { expected, url } of cases) {
	test(`names the section of ${url} as ${String(expected)}`, () => {
		expect(findPageSectionName(tree, url)).toBe(expected);
	});
}
