import '../styles/app.css';
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
import { RootProvider } from 'fumadocs-ui/provider/tanstack';
import type { ReactNode } from 'react';
import { act } from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, test } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/context';
import {
	getDocsSidebarMinPixels,
	getSiteHeaderDesktopMinPixels,
} from '../lib/docs-container-queries.js';
import { DocsShell } from './docs-shell.js';
import { DocsSearchProvider } from './search.js';
import { DocsThemeRoot } from './theme-controls.js';

const tree: PageTree = {
	name: 'Docs',
	children: [
		{
			type: 'folder',
			name: <span>Documentation</span>,
			root: true,
			children: [
				{ type: 'separator', name: 'Overview' },
				{ type: 'page', name: 'Installation', url: '/docs/installation' },
				{ type: 'separator', name: 'Foundations' },
				{ type: 'page', name: 'Composition', url: '/docs/composition' },
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
					{ type: 'page', name: 'Text', url: '/components/typography/text' },
				],
			},
		],
	},
};

let container: HTMLElement | undefined;
let root: Root | undefined;

afterEach(async () => {
	if (root) act(() => root?.unmount());
	container?.remove();
	localStorage.clear();
	document.documentElement.dir = '';
	delete document.documentElement.dataset.docsSidebar;
	container = undefined;
	root = undefined;
	await page.viewport(1024, 800);
});

for (const pathname of ['/components', '/components/actions/button']) {
	test(`renders only the Components section at ${pathname}`, async () => {
		await page.viewport(1280, 800);
		await renderAt(
			pathname,
			<DocsShell tree={tree}>
				<main>Article</main>
			</DocsShell>,
		);

		const navigation = page.getByRole('navigation', { name: 'Components' });
		const actions = navigation.getByRole('heading', { name: 'Actions', level: 2 });
		await expect.element(actions).toBeVisible();
		await expect
			.element(navigation.getByRole('link', { name: 'Installation' }))
			.not.toBeInTheDocument();
		const actionsList = navigation
			.element()
			.querySelector(`ul[aria-labelledby="${actions.element().id}"]`);
		expect(actionsList).not.toBeNull();
		expect(
			Array.from(actionsList!.querySelectorAll(':scope > li > a'), (link) => link.textContent),
		).toEqual(['Button', 'Text']);
		expect(
			Array.from(navigation.element().querySelectorAll('a'), (link) => link.textContent),
		).toEqual(['All components', 'Button', 'Text']);
		await expect
			.element(
				navigation.getByRole('link', {
					name: pathname === '/components' ? 'All components' : 'Button',
				}),
			)
			.toHaveAttribute('aria-current', 'page');
		expect(
			navigation
				.getByRole('link', { name: 'All components' })
				.element()
				.getAttribute('aria-current'),
		).toBe(pathname === '/components' ? 'page' : null);
	});
}

test('shows no heading over a group that holds a single page, such as Overview', async () => {
	await page.viewport(1280, 800);
	await renderShell('/docs/installation');

	const navigation = page.getByRole('navigation', { name: 'Docs' });
	await expect.element(navigation.getByRole('link', { name: 'Installation' })).toBeVisible();
	await expect
		.element(navigation.getByRole('heading', { name: 'Overview' }))
		.not.toBeInTheDocument();
	await expect.element(navigation.getByRole('link', { name: 'Composition' })).toBeVisible();
});

test('keeps search and theme in the header while the sidebar shows', async () => {
	await page.viewport(1280, 800);
	await renderShell('/docs/installation');

	const sidebar = getSidebar();
	const header = page.getByRole('banner');
	await expect.element(sidebar).toBeVisible();
	const search = header.getByRole('button', { name: 'Open Search' });
	await expect.element(search).toBeVisible();
	expect(sidebar.contains(search.element())).toBe(false);
	await expect.element(header.getByRole('button', { name: 'Theme' })).toBeVisible();
	await expect
		.element(page.getByRole('radiogroup', { name: 'Theme profile' }))
		.not.toBeInTheDocument();
	await expect
		.element(header.getByRole('navigation', { name: 'Site' }).getByRole('link', { name: 'Docs' }))
		.toHaveAttribute('aria-current', 'page');
	await act(async () => {
		search.element().focus();
		await userEvent.keyboard('{Enter}');
	});
	await expect.element(page.getByRole('dialog', { name: 'Search documentation' })).toBeVisible();
	await act(async () => {
		await userEvent.keyboard('{Escape}');
	});
	await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
	await expect.element(search).toHaveFocus();
});

test('the header desktop threshold clears the widest desktop row', async () => {
	await page.viewport(1280, 800);
	await renderShell('/docs/installation');

	// The widest row has the sidebar toggle, so check that it is there.
	await expect
		.element(page.getByRole('banner').getByRole('button', { name: 'Hide sidebar' }))
		.toBeVisible();
	const row = document.querySelector<HTMLElement>('[data-site-header-row]');
	if (!row) throw new Error('Expected the header row.');
	row.style.inlineSize = 'max-content';
	const rowWidth = row.getBoundingClientRect().width;
	row.style.inlineSize = '';

	const threshold = getSiteHeaderDesktopMinPixels();
	// The threshold follows the content, so it must not drop below the row, and it must stay close
	// enough that the compact row is not used while the desktop row has plenty of room.
	expect(threshold).toBeGreaterThanOrEqual(rowWidth);
	expect(threshold - rowWidth).toBeLessThanOrEqual(96);
	// The sidebar toggle and Menu rules rely on a visible sidebar implying the desktop row.
	expect(getDocsSidebarMinPixels()).toBeGreaterThanOrEqual(threshold);
});

function getSidebar() {
	const sidebar = document.getElementById('docs-sidebar');
	if (!sidebar) throw new Error('Expected the docs sidebar.');
	return sidebar;
}

async function renderShell(pathname: string) {
	await renderAt(
		pathname,
		<DocsShell tree={tree}>
			<main>Article</main>
		</DocsShell>,
	);
}

async function renderAt(pathname: string, children: ReactNode) {
	const rootRoute = createRootRoute({
		component: () => (
			<RootProvider search={{ enabled: false }} theme={{ enabled: false }}>
				<Provider spritesheetHref={spriteSheetHref}>
					<DocsSearchProvider>
						<DocsThemeRoot>{children}</DocsThemeRoot>
					</DocsSearchProvider>
				</Provider>
			</RootProvider>
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
