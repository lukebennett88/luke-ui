import '../styles/app.css';
import '@luke-ui/theme-tactile/stylesheet.css';
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

let container: HTMLElement | undefined;
let root: Root | undefined;

afterEach(async () => {
	if (root) act(() => root?.unmount());
	container?.remove();
	localStorage.clear();
	delete document.documentElement.dataset.docsSidebar;
	document.documentElement.style.removeProperty('font-size');
	container = undefined;
	root = undefined;
	await page.viewport(1024, 800);
});

test('holds only search, Theme and Menu in the banner at 390px', async () => {
	await page.viewport(390, 800);
	await renderAt('/docs/installation', <SiteHeader tree={tree} />);

	const banner = page.getByRole('banner');
	await expect.element(banner.getByRole('button', { name: 'Open Search' })).toBeVisible();
	await expect.element(banner.getByRole('button', { name: 'Theme' })).toBeVisible();
	await expect.element(banner.getByRole('button', { name: 'Menu' })).toBeVisible();
	await expect.element(banner.getByRole('navigation')).not.toBeInTheDocument();
	// The wordmark is the only link: no tab links and no GitHub.
	expect(
		banner
			.getByRole('link')
			.elements()
			.map((link) => link.textContent),
	).toEqual(['Luke UI']);
});

test('opens the simple drawer on a page with no tree', async () => {
	await page.viewport(390, 800);
	await renderAt('/playground', <SiteHeader />);
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

test('opens the switcher drawer with the current section marked', async () => {
	await page.viewport(390, 800);
	await renderAt('/docs/installation', <SiteHeader tree={tree} />);
	await openMenu();

	const dialog = page.getByRole('dialog', { name: 'Menu' });
	const sections = dialog.getByRole('navigation', { name: 'Sections' });
	await expect
		.element(sections.getByRole('link', { name: 'Docs' }))
		.toHaveAttribute('aria-current', 'page');
	expect(sections.getByRole('link').elements()).toHaveLength(3);
	await expect.element(dialog.getByRole('navigation', { name: 'Docs', exact: true })).toBeVisible();
	await expect.element(dialog.getByRole('navigation', { name: 'Site' })).not.toBeInTheDocument();
	await expect.element(dialog.getByRole('link', { name: 'GitHub' })).toBeVisible();
	await expect.element(dialog.getByRole('link', { name: 'Luke UI' })).not.toBeInTheDocument();
});

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

test('shows only the header Site navigation at 640px', async () => {
	await page.viewport(640, 800);
	await renderAt('/playground', <SiteHeader />);

	expect(getVisibleSiteNavigations()).toHaveLength(1);
	await expect.element(page.getByRole('button', { name: 'Menu' })).not.toBeInTheDocument();
});

test('shows only the drawer Site navigation at 639px', async () => {
	await page.viewport(639, 800);
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

test('closes the drawer when the header becomes desktop and the page has no tree', async () => {
	await page.viewport(390, 800);
	await renderAt('/', <SiteHeader />);
	await openMenu();

	await page.viewport(1024, 800);

	await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
});

test('closes the drawer when an external link is clicked', async () => {
	await page.viewport(390, 800);
	await renderAt('/', <SiteHeader />);
	await openMenu();
	// The link opens a new tab; stop that after React has handled the click.
	const preventNavigation = (event: Event) => event.preventDefault();
	document.addEventListener('click', preventNavigation);

	try {
		await act(async () => {
			await userEvent.click(
				page.getByRole('dialog', { name: 'Menu' }).getByRole('link', { name: 'GitHub' }),
			);
		});
	} finally {
		document.removeEventListener('click', preventNavigation);
	}

	await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
});

test('follows a root font size change that resizes no container', async () => {
	await page.viewport(700, 800);
	await renderAt('/playground', <SiteHeader />);
	await expect.element(page.getByRole('button', { name: 'Menu' })).not.toBeInTheDocument();

	// 40rem is now 960px, wider than the viewport, so the header turns compact with no resize.
	document.documentElement.style.fontSize = '24px';

	await expect.element(page.getByRole('button', { name: 'Menu' })).toBeVisible();
	await openMenu();
	await expect
		.element(page.getByRole('dialog').getByRole('navigation', { name: 'Site' }))
		.toBeVisible();
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
				<DocsSearchProvider>
					<DocsThemeRoot>{children}</DocsThemeRoot>
				</DocsSearchProvider>
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
