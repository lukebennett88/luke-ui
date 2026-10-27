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
import { DocsSiteNav } from './docs-site-nav.js';
import { NotFound } from './not-found.js';
import { DocsSearchProvider } from './search.js';
import { SiteNav } from './site-nav.js';
import { DocsThemeRoot } from './theme-controls.js';

const tree: PageTree = {
	name: 'Docs',
	children: [
		{
			type: 'folder',
			name: 'Documentation',
			root: true,
			children: [{ type: 'page', name: 'Installation', url: '/docs/installation' }],
		},
	],
};

let container: HTMLElement | undefined;
let root: Root | undefined;

afterEach(async () => {
	if (root) act(() => root?.unmount());
	container?.remove();
	localStorage.clear();
	delete document.documentElement.dataset.docsSidebar;
	container = undefined;
	root = undefined;
	await page.viewport(1024, 800);
});

test('marks only the current destination on desktop and keeps search available', async () => {
	await page.viewport(1024, 800);
	await renderAt('/playground', <SiteNav />);

	await expect
		.element(page.getByRole('link', { name: 'Playground' }))
		.toHaveAttribute('aria-current', 'page');
	expect(getCurrentLinks()).toHaveLength(1);
	await expect.element(page.getByRole('button', { name: /Search/ })).toBeVisible();
});

test('keeps the theme controls in a popover instead of the header row', async () => {
	await page.viewport(1280, 800);
	await renderAt('/', <SiteNav />);

	await expect
		.element(page.getByRole('radiogroup', { name: 'Theme profile' }))
		.not.toBeInTheDocument();
	await act(async () => {
		await userEvent.click(page.getByRole('button', { name: 'Theme' }));
	});
	await expect
		.element(
			page.getByRole('dialog', { name: 'Appearance' }).getByRole('radiogroup', {
				name: 'Theme profile',
			}),
		)
		.toBeVisible();
});

test('offers search and theme controls from the mobile bar with no destination active on the landing page', async () => {
	await page.viewport(390, 800);
	await renderAt('/', <SiteNav />);

	expect(getCurrentLinks()).toHaveLength(0);
	await expect.element(page.getByRole('button', { name: 'Open Search' })).toBeVisible();

	const themeTrigger = page.getByRole('button', { name: 'Theme' });
	await expect.element(themeTrigger).toBeVisible();
	await act(async () => {
		await userEvent.click(themeTrigger);
	});
	await expect.element(page.getByRole('radiogroup', { name: 'Theme profile' })).toBeVisible();
});

test('leaves every destination inactive on the 404 page', async () => {
	await renderAt('/missing', <NotFound />);

	expect(getCurrentLinks()).toHaveLength(0);
});

test('opening search does not also open the docs navigation drawer, and vice versa', async () => {
	await page.viewport(390, 800);
	await renderAt('/docs/installation', <DocsSiteNav tree={tree} />);

	await act(async () => {
		await userEvent.click(page.getByRole('button', { name: 'Open Search' }));
	});
	await expect.element(page.getByRole('dialog', { name: 'Search documentation' })).toBeVisible();
	await expect
		.element(page.getByRole('dialog', { name: 'Docs navigation' }))
		.not.toBeInTheDocument();
	await act(async () => {
		await userEvent.keyboard('{Escape}');
	});
	await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();

	await act(async () => {
		await userEvent.click(page.getByRole('button', { name: 'Menu' }));
	});
	await expect.element(page.getByRole('dialog', { name: 'Docs navigation' })).toBeVisible();
	await expect
		.element(page.getByRole('dialog', { name: 'Search documentation' }))
		.not.toBeInTheDocument();
});

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
	return router;
}

function getCurrentLinks() {
	return page
		.getByRole('link')
		.elements()
		.filter((link) => link.getAttribute('aria-current') === 'page');
}
