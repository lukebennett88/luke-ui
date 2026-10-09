import '../../styles/app.css';
import '@luke-ui/react/themes/tactile/stylesheet.css';
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

test('links to the previous and next page in sidebar order', async () => {
	await renderArticle({ pathname: '/docs/styling', toc });

	const pager = page.getByRole('navigation', { name: 'Pagination' });
	await expect
		.element(pager.getByRole('link', { name: /Previous/ }))
		.toHaveAttribute('href', '/docs/installation');
	await expect
		.element(pager.getByRole('link', { name: /Next/ }))
		.toHaveAttribute('href', '/docs/layout');
});

test('omits the link for a missing neighbour on the first page of a section', async () => {
	await renderArticle({ pathname: '/docs/installation', toc });

	expect(page.getByRole('link', { name: /Previous/ })).not.toBeInTheDocument();
	await expect
		.element(page.getByRole('link', { name: /Next/ }))
		.toHaveAttribute('href', '/docs/styling');
});

test('orders a root section from its index page and keeps its neighbours inside it', async () => {
	await renderArticle({ pathname: '/components/actions/button', toc });

	const pager = page.getByRole('navigation', { name: 'Pagination' });
	await expect
		.element(pager.getByRole('link', { name: /Previous/ }))
		.toHaveAttribute('href', '/components');
	await expect
		.element(pager.getByRole('link', { name: /Next/ }))
		.toHaveAttribute('href', '/components/actions/icon-button');
});

test('skips external pages and ends the section at its last internal page', async () => {
	await renderArticle({ pathname: '/components/actions/icon-button', toc });

	expect(page.getByRole('link', { name: /Next/ })).not.toBeInTheDocument();
	await expect
		.element(page.getByRole('link', { name: /Previous/ }))
		.toHaveAttribute('href', '/components/actions/button');
});

test('matches the current page when the pathname has a trailing slash', async () => {
	await renderArticle({ pathname: '/components/', toc });

	const pager = page.getByRole('navigation', { name: 'Pagination' });
	expect(page.getByRole('link', { name: /Previous/ })).not.toBeInTheDocument();
	await expect
		.element(pager.getByRole('link', { name: /Next/ }))
		.toHaveAttribute('href', '/components/actions/button');
});

test('renders no footer when the page has no neighbours', async () => {
	await renderArticle({ pathname: '/docs/unlisted', toc });

	expect(page.getByRole('navigation', { name: 'Pagination' })).not.toBeInTheDocument();
	expect(page.getByRole('contentinfo')).not.toBeInTheDocument();
	expect(page.getByRole('article').element().querySelector('footer')).toBeNull();
});

test('mirrors the pager chevrons in a right-to-left document', async () => {
	document.documentElement.dir = 'rtl';
	await renderArticle({ pathname: '/docs/styling', toc });

	const icon = page.getByRole('link', { name: /Next/ }).element().querySelector('svg');
	if (icon === null) throw new Error('Expected a chevron in the Next link.');
	expect(getComputedStyle(icon).transform).not.toBe('none');
});

test('lists nested headings in the table of contents beside the article', async () => {
	await page.viewport(1400, 900);
	await renderArticle({ pathname: '/docs/styling', toc });

	const navigation = page.getByRole('navigation', { name: 'On this page' });
	await expect.element(navigation).toBeVisible();
	expect(
		Array.from(navigation.element().querySelectorAll('a'), (link) => link.getAttribute('href')),
	).toEqual(['#usage', '#sizes', '#api']);
	const indent = (name: string) =>
		Number.parseFloat(
			getComputedStyle(navigation.getByRole('link', { name }).element()).paddingInlineStart,
		);
	expect(indent('Sizes')).toBeGreaterThan(indent('Usage'));
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

test('renders no table of contents when the page has no headings', async () => {
	await page.viewport(1400, 900);
	await renderArticle({ pathname: '/docs/styling', toc: [] });

	expect(page.getByRole('navigation', { name: 'On this page' })).not.toBeInTheDocument();
	expect(page.getByText('On this page')).not.toBeInTheDocument();
});

async function renderArticle({ pathname, toc }: { pathname: string; toc: Array<TOCItemType> }) {
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
								title="Styling"
								toc={toc}
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
