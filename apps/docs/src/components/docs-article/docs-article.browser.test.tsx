import '../../styles/app.css';
import '@luke-ui/theme-tactile/stylesheet.css';
import { Provider } from '@luke-ui/react/provider';
import spriteSheetHref from '@luke-ui/react/spritesheet.svg?url&no-inline';
import {
	createMemoryHistory,
	createRootRoute,
	createRouter,
	RouterProvider,
} from '@tanstack/react-router';
import type { Root as PageTree } from 'fumadocs-core/page-tree';
import type { TOCItemType } from 'fumadocs-core/toc';
import { act } from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, test } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/context';
import { DocsShell } from '../docs-shell.js';
import { DocsSearchProvider } from '../search.js';
import { DocsThemeRoot } from '../theme-controls.js';
import { DocsArticle } from './docs-article.js';

const tree: PageTree = {
	name: 'Docs',
	children: [
		{
			type: 'folder',
			name: 'Documentation',
			root: true,
			children: [
				{ type: 'page', name: 'Installation', url: '/docs/installation' },
				{ type: 'page', name: 'Styling', url: '/docs/styling' },
				{ type: 'page', name: 'Layout', url: '/docs/layout' },
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
				index: { type: 'page', name: 'All components', url: '/components' },
				children: [
					{ type: 'separator', name: 'Actions' },
					{ type: 'page', name: 'Button', url: '/components/actions/button' },
					{ type: 'page', name: 'Icon Button', url: '/components/actions/icon-button' },
					{ type: 'page', name: 'Source', url: 'https://example.com/source', external: true },
				],
			},
		],
	},
};

const toc: Array<TOCItemType> = [
	{ depth: 2, title: 'Usage', url: '#usage' },
	{ depth: 3, title: 'Sizes', url: '#sizes' },
	{ depth: 2, title: 'API', url: '#api' },
];

let container: HTMLElement | undefined;
let root: Root | undefined;

afterEach(async () => {
	if (root) act(() => root?.unmount());
	container?.remove();
	container = undefined;
	root = undefined;
	document.documentElement.dir = '';
	await page.viewport(1024, 800);
});

test('renders the title, description, and actions inside one main landmark with an article', async () => {
	await renderArticle({ pathname: '/docs/styling', toc });

	const article = page.getByRole('article');
	await expect.element(article.getByRole('heading', { level: 1, name: 'Styling' })).toBeVisible();
	await expect.element(article.getByText('How styling works.')).toBeVisible();
	await expect.element(article.getByRole('button', { name: 'Action' })).toBeVisible();
	expect(page.getByRole('main').element().contains(article.element())).toBe(true);
});

test('shows a keyboard-operable disclosure instead of the column below the wide breakpoint', async () => {
	await page.viewport(800, 900);
	await renderArticle({ pathname: '/docs/styling', toc });

	const summary = page.getByText('On this page', { exact: true }).first();
	const details = summary.element().closest('details');
	if (details === null) throw new Error('Expected a details element.');
	expect(details.open).toBe(false);

	summary.element().focus();
	await userEvent.keyboard('{Enter}');
	expect(details.open).toBe(true);
	await expect.element(page.getByRole('link', { name: 'Usage' })).toBeVisible();

	const mobileTocList = details.querySelector('ul');
	expect(mobileTocList).not.toBeNull();
	expect(getComputedStyle(mobileTocList as HTMLElement).listStyleType).toBe('none');
	expect(getComputedStyle(mobileTocList as HTMLElement).paddingInlineStart).toBe('0px');

	await userEvent.keyboard('{Escape}');
	expect(details.open).toBe(false);
	await expect.element(summary).toHaveFocus();

	await userEvent.keyboard('{Enter}');
	await userEvent.click(page.getByRole('link', { name: 'API' }));
	expect(details.open).toBe(false);

	summary.element().focus();
	await userEvent.keyboard('{Enter}');
	expect(details.open).toBe(true);
	await userEvent.click(page.getByRole('heading', { name: 'Usage' }));
	expect(details.open).toBe(false);
});

async function renderArticle({
	pathname,
	sectionName = null,
	toc: tocItems,
}: {
	pathname: string;
	sectionName?: string | null;
	toc: Array<TOCItemType>;
}) {
	if (root) act(() => root?.unmount());
	container?.remove();
	const rootRoute = createRootRoute({
		component: () => (
			<DocsSearchProvider>
				<Provider spritesheetHref={spriteSheetHref}>
					<DocsThemeRoot>
						<DocsShell tree={tree}>
							<DocsArticle
								actions={<button type="button">Action</button>}
								description="How styling works."
								sectionName={sectionName}
								title="Styling"
								toc={tocItems}
								tree={tree}
							>
								<h2 id="usage">Usage</h2>
							</DocsArticle>
						</DocsShell>
					</DocsThemeRoot>
				</Provider>
			</DocsSearchProvider>
		),
	});
	const router = createRouter({
		history: createMemoryHistory({ initialEntries: [pathname] }),
		routeTree: rootRoute,
	});
	container = document.body.appendChild(document.createElement('div'));
	root = createRoot(container);
	await act(async () => {
		root?.render(<RouterProvider router={router} />);
		await router.load();
	});
}
