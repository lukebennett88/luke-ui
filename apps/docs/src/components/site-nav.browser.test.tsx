import '../styles/app.css';
import '@luke-ui/theme-tactile/stylesheet.css';
import { Provider } from '@luke-ui/react/provider';
import spriteSheetHref from '@luke-ui/react/spritesheet.svg?url&no-inline';
import {
	createMemoryHistory,
	createRootRoute,
	createRouter,
	RouterProvider,
	useRouterState,
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

test('keeps the global header sticky on the landing page', async () => {
	await page.viewport(1024, 800);
	await renderAt('/', <SiteNav />);

	const headerStyle = getComputedStyle(page.getByRole('banner').element());
	expect(headerStyle.position).toBe('sticky');
	expect(headerStyle.insetBlockStart).toBe('0px');
});

for (const pathname of ['/docs/installation', '/components', '/playground']) {
	test(`keeps destination widths and positions stable when ${pathname} is active`, async () => {
		await page.viewport(1280, 800);
		const router = await renderAt('/', <SiteNav />);
		const nav = page.getByRole('navigation', { name: 'Site' });
		const inactiveRects = nav
			.getByRole('link')
			.elements()
			.map((link) => {
				return link.getBoundingClientRect();
			});
		await act(async () => {
			await router.navigate({ to: pathname });
		});

		expect(getCurrentLinks()).toHaveLength(1);
		for (const [index, link] of nav.getByRole('link').elements().entries()) {
			const inactiveRect = inactiveRects[index];
			const activeRect = link.getBoundingClientRect();
			expect(activeRect.width).toBeCloseTo(inactiveRect?.width ?? 0, 1);
			expect(activeRect.left).toBeCloseTo(inactiveRect?.left ?? 0, 1);
		}
	});
}

for (const width of [768, 800, 1100]) {
	test(`keeps the landing page header on one row at ${width}px`, async () => {
		await page.viewport(width, 800);
		await renderAt('/', <SiteNav />);

		const siteNav = page.getByRole('navigation', { name: 'Site' });
		const search = page.getByRole('button', { name: /Search/ });
		const theme = page.getByRole('button', { name: 'Theme' });
		const repository = page.getByRole('link', { name: 'GitHub repository' });

		await expect.element(siteNav).toBeVisible();
		await expect.element(search).toBeVisible();
		await expect.element(theme).toBeVisible();

		// Everything sharing a centre line proves the header did not wrap onto a second row.
		const centres = [siteNav, search, theme, repository].map((locator) => {
			const rect = locator.element().getBoundingClientRect();
			return rect.top + rect.height / 2;
		});
		for (const centre of centres) {
			expect(Math.abs(centre - (centres[0] ?? 0))).toBeLessThanOrEqual(2);
		}
	});
}

for (const width of [1024, 1280, 1440]) {
	test(`keeps header destinations and actions in place across page and sidebar changes at ${width}px`, async () => {
		await page.viewport(width, 800);
		const router = await renderAt('/', <HeaderFixture />);
		const homeRects = getHeaderControlRects();
		expect(page.getByRole('banner').element().getBoundingClientRect().height).toBe(56);
		const pathname: string = '/docs/installation';
		await act(async () => {
			await router.navigate({ to: pathname });
		});
		expect(getHeaderControlRects()).toEqual(homeRects);
		expect(page.getByRole('banner').element().getBoundingClientRect().height).toBe(56);
		await act(async () => {
			await userEvent.click(page.getByRole('button', { name: 'Hide sidebar' }));
		});
		await expect.element(page.getByRole('button', { name: 'Open Search' })).toBeVisible();
		expect(getHeaderControlRects()).toEqual(homeRects);
	});
}

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

function HeaderFixture() {
	const pathname = useRouterState({ select: (state) => state.location.pathname });
	return pathname === '/' ? <SiteNav /> : <DocsSiteNav tree={tree} />;
}

function getHeaderControlRects() {
	const header = page.getByRole('banner');
	return [
		header.getByRole('link', { name: 'Docs', exact: true }),
		header.getByRole('link', { name: 'Components', exact: true }),
		header.getByRole('link', { name: 'Playground', exact: true }),
		header.getByRole('button', { name: 'Theme' }),
		header.getByRole('link', { name: 'GitHub repository' }),
	].map((locator) => {
		const rect = locator.element().getBoundingClientRect();
		return { left: rect.left, width: rect.width, top: rect.top, height: rect.height };
	});
}
