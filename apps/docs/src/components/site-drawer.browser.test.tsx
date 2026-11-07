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
import { DocsShell } from './docs-shell.js';
import { NotFound } from './not-found.js';
import { DocsSearchProvider } from './search.js';
import { SiteHeader } from './site-header.js';
import { DocsThemeRoot } from './theme-controls.js';

const tree: PageTree = {
	name: 'Docs',
	children: [
		{
			type: 'folder',
			name: 'Documentation',
			root: true,
			children: [
				{ type: 'separator', name: 'Overview' },
				{ type: 'page', name: 'Installation', url: '/docs/installation' },
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
				],
			},
		],
	},
};

const narrowPages = [
	{ pathname: '/', tree: undefined },
	{ pathname: '/playground', tree: undefined },
	{ pathname: '/docs/installation', tree },
	{ pathname: '/components', tree },
] as const;

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

for (const { pathname, tree: pageTree } of narrowPages) {
	test(`holds only search, Theme and Menu in the banner at 390px on ${pathname}`, async () => {
		await page.viewport(390, 800);
		await renderAt(pathname, <SiteHeader tree={pageTree} />);

		const banner = page.getByRole('banner');
		await expect.element(banner.getByRole('button', { name: 'Open Search' })).toBeVisible();
		await expect.element(banner.getByRole('button', { name: 'Theme' })).toBeVisible();
		await expect.element(banner.getByRole('button', { name: 'Menu' })).toBeVisible();
		await expect.element(banner.getByRole('link', { name: /GitHub/ })).not.toBeInTheDocument();
		await expect.element(banner.getByRole('navigation')).not.toBeInTheDocument();
		// The wordmark is the only link: no tab links and no GitHub.
		expect(
			banner
				.getByRole('link')
				.elements()
				.map((link) => link.textContent),
		).toEqual(['Luke UI']);
	});
}

for (const { pathname, tree: pageTree } of narrowPages) {
	test(`keeps the header at 3.5rem on ${pathname}`, async () => {
		await page.viewport(390, 800);
		await renderAt(pathname, <SiteHeader tree={pageTree} />);

		await expect.element(page.getByRole('banner')).toBeVisible();
		const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
		expect(page.getByRole('banner').element().getBoundingClientRect().height).toBe(3.5 * rem);
	});
}

for (const pathname of ['/', '/playground']) {
	test(`opens the simple drawer on ${pathname}`, async () => {
		await page.viewport(390, 800);
		await renderAt(pathname, <SiteHeader />);
		await openMenu();

		const dialog = page.getByRole('dialog', { name: 'Menu' });
		const site = dialog.getByRole('navigation', { name: 'Site' });
		await expect.element(site).toBeVisible();
		expect(
			site
				.getByRole('link')
				.elements()
				.map((link) => link.textContent),
		).toEqual(['Docs', 'Components', 'Playground', 'GitHub']);
		await expect
			.element(dialog.getByRole('navigation', { name: 'Sections' }))
			.not.toBeInTheDocument();
		await expect
			.element(site.getByRole('link', { name: 'GitHub' }))
			.toHaveAttribute('target', '_blank');
	});
}

test('opens the simple drawer on the 404 page with no destination current', async () => {
	await page.viewport(390, 800);
	await renderAt('/missing', <NotFound />);
	await openMenu();

	const site = page.getByRole('dialog', { name: 'Menu' }).getByRole('navigation', { name: 'Site' });
	await expect.element(site.getByRole('link', { name: 'Docs' })).toBeVisible();
	expect(
		site
			.getByRole('link')
			.elements()
			.filter((link) => link.getAttribute('aria-current') === 'page'),
	).toHaveLength(0);
});

for (const { pathname, label } of [
	{ pathname: '/docs/installation', label: 'Docs' },
	{ pathname: '/components', label: 'Components' },
]) {
	test(`opens the switcher drawer on ${pathname} with ${label} current`, async () => {
		await page.viewport(390, 800);
		await renderAt(pathname, <SiteHeader tree={tree} />);
		await openMenu();

		const dialog = page.getByRole('dialog', { name: 'Menu' });
		const sections = dialog.getByRole('navigation', { name: 'Sections' });
		await expect
			.element(sections.getByRole('link', { name: label }))
			.toHaveAttribute('aria-current', 'page');
		expect(sections.getByRole('link').elements()).toHaveLength(3);
		await expect
			.element(dialog.getByRole('navigation', { name: label, exact: true }))
			.toBeVisible();
		await expect.element(dialog.getByRole('navigation', { name: 'Site' })).not.toBeInTheDocument();
		await expect.element(dialog.getByRole('link', { name: 'GitHub' })).toBeVisible();
		await expect.element(dialog.getByRole('link', { name: 'Luke UI' })).not.toBeInTheDocument();
	});
}

test('opens the tree-only drawer when the header has room and the sidebar does not', async () => {
	await page.viewport(800, 800);
	await renderAt(
		'/docs/installation',
		<DocsShell tree={tree}>
			<main>Article</main>
		</DocsShell>,
	);
	await expect
		.element(page.getByRole('banner').getByRole('navigation', { name: 'Site' }))
		.toBeVisible();
	await openMenu();

	const dialog = page.getByRole('dialog', { name: 'Menu' });
	await expect.element(dialog.getByRole('navigation', { name: 'Docs' })).toBeVisible();
	await expect
		.element(dialog.getByRole('navigation', { name: 'Sections' }))
		.not.toBeInTheDocument();
	await expect.element(dialog.getByRole('navigation', { name: 'Site' })).not.toBeInTheDocument();
	await expect.element(dialog.getByRole('link', { name: 'GitHub' })).not.toBeInTheDocument();
});

test('names the dialog from its visible title', async () => {
	await page.viewport(390, 800);
	await renderAt('/', <SiteHeader />);
	await openMenu();

	const dialog = page.getByRole('dialog', { name: 'Menu' });
	const labelledBy = dialog.element().getAttribute('aria-labelledby');
	expect(labelledBy).toBeTruthy();
	expect(document.getElementById(labelledBy ?? '')?.textContent).toBe('Menu');
	await expect.element(dialog.getByRole('button', { name: 'Close menu' })).toBeVisible();
});

test('closes the drawer when a link is clicked and returns focus to Menu', async () => {
	await page.viewport(390, 800);
	await renderAt('/docs/installation', <SiteHeader tree={tree} />);
	await openMenu();

	await act(async () => {
		await userEvent.click(
			page
				.getByRole('dialog', { name: 'Menu' })
				.getByRole('navigation', { name: 'Sections' })
				.getByRole('link', { name: 'Playground' }),
		);
	});

	await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
	await expect.element(page.getByRole('button', { name: 'Menu' })).toHaveFocus();
});

for (const width of [640, 768, 1024, 1280]) {
	test(`shows only the header's Site navigation at ${width}px`, async () => {
		await page.viewport(width, 800);
		await renderAt('/playground', <SiteHeader />);

		expect(getVisibleSiteNavigations()).toHaveLength(1);
		await expect.element(page.getByRole('button', { name: 'Menu' })).not.toBeInTheDocument();
	});
}

for (const width of [390, 639]) {
	test(`shows only the drawer's Site navigation at ${width}px`, async () => {
		await page.viewport(width, 800);
		await renderAt('/playground', <SiteHeader />);
		expect(getVisibleSiteNavigations()).toHaveLength(0);

		await openMenu();

		expect(getVisibleSiteNavigations()).toHaveLength(1);
		expect(
			page
				.getByRole('dialog')
				.element()
				.contains(getVisibleSiteNavigations()[0] ?? null),
		).toBe(true);
	});
}

test('closes the drawer when the header becomes desktop and the page has no tree', async () => {
	await page.viewport(390, 800);
	await renderAt('/', <SiteHeader />);
	await openMenu();

	await page.viewport(1024, 800);

	await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
});

test('closes the drawer when the layout reaches the sidebar', async () => {
	await page.viewport(800, 800);
	await renderAt(
		'/docs/installation',
		<DocsShell tree={tree}>
			<main>Article</main>
		</DocsShell>,
	);
	await openMenu();

	await page.viewport(1280, 800);

	await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
});

test('switches a drawer that is open from the switcher to the tree when the header becomes desktop', async () => {
	await page.viewport(390, 800);
	await renderAt(
		'/docs/installation',
		<DocsShell tree={tree}>
			<main>Article</main>
		</DocsShell>,
	);
	await openMenu();
	const dialog = page.getByRole('dialog', { name: 'Menu' });
	await expect.element(dialog.getByRole('navigation', { name: 'Sections' })).toBeVisible();

	await page.viewport(800, 800);

	await expect.element(dialog.getByRole('navigation', { name: 'Docs' })).toBeVisible();
	await expect
		.element(dialog.getByRole('navigation', { name: 'Sections' }))
		.not.toBeInTheDocument();
});

test('gives drawer links a 2.75rem minimum block size', async () => {
	await page.viewport(390, 800);
	await renderAt('/docs/installation', <SiteHeader tree={tree} />);
	await openMenu();

	const link = page
		.getByRole('dialog', { name: 'Menu' })
		.getByRole('link', { name: 'Installation' });
	await expect.element(link).toBeVisible();
	const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
	expect(link.element().getBoundingClientRect().height).toBeGreaterThanOrEqual(2.75 * rem);
});

async function openMenu() {
	await act(async () => {
		await userEvent.click(page.getByRole('button', { name: 'Menu' }));
	});
	await expect.element(page.getByRole('dialog', { name: 'Menu' })).toBeVisible();
}

function getVisibleSiteNavigations() {
	return page
		.getByRole('navigation', { name: 'Site' })
		.elements()
		.filter((element) => element.checkVisibility());
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
