import '../styles/app.css';
import '@luke-ui/react/themes/tactile/stylesheet.css';
import { IconSpritesheetProvider } from '@luke-ui/react/icon';
import spriteSheetHref from '@luke-ui/react/spritesheet.svg?url&no-inline';
import {
	createMemoryHistory,
	createRootRoute,
	createRouter,
	RouterProvider,
} from '@tanstack/react-router';
import { RootProvider } from 'fumadocs-ui/provider/tanstack';
import type { ReactNode } from 'react';
import { act } from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, test } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/context';
import { NotFound } from './not-found.js';
import { SiteNav } from './site-nav.js';
import { DocsThemeRoot } from './theme-controls.js';

let container: HTMLElement | undefined;
let root: Root | undefined;

afterEach(async () => {
	if (root) act(() => root?.unmount());
	container?.remove();
	localStorage.clear();
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

test('marks the components destination active on a component page', async () => {
	await page.viewport(1024, 800);
	await renderAt('/components/actions/button', <SiteNav />);

	await expect
		.element(page.getByRole('link', { name: 'Components' }))
		.toHaveAttribute('aria-current', 'page');
	expect(getCurrentLinks()).toHaveLength(1);
});

test('marks the docs destination active on a docs page', async () => {
	await page.viewport(1024, 800);
	await renderAt('/docs/installation', <SiteNav />);

	await expect
		.element(page.getByRole('link', { name: 'Docs' }))
		.toHaveAttribute('aria-current', 'page');
	expect(getCurrentLinks()).toHaveLength(1);
});

test('offers search and theme controls from the mobile bar with no destination active on the landing page', async () => {
	await page.viewport(390, 800);
	await renderAt('/', <SiteNav />);

	expect(getCurrentLinks()).toHaveLength(0);

	const wordmark = page.getByRole('link', { name: 'Luke UI' }).element();
	expect(wordmark.scrollWidth).toBeLessThanOrEqual(wordmark.clientWidth);
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

test('links to the repository with an accessible name', async () => {
	await page.viewport(1024, 800);
	await renderAt('/', <SiteNav />);

	const repositoryLink = page.getByRole('link', { name: 'GitHub repository' });
	await expect.element(repositoryLink).toBeVisible();
	await expect
		.element(repositoryLink)
		.toHaveAttribute('href', 'https://github.com/lukebennett88/luke-ui');
});

async function renderAt(pathname: string, children: ReactNode) {
	const rootRoute = createRootRoute({
		component: () => (
			<RootProvider search={{}} theme={{ defaultTheme: 'light', enableSystem: false }}>
				<IconSpritesheetProvider href={spriteSheetHref}>
					<DocsThemeRoot>{children}</DocsThemeRoot>
				</IconSpritesheetProvider>
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

function getCurrentLinks() {
	return page
		.getByRole('link')
		.elements()
		.filter((link) => link.getAttribute('aria-current') === 'page');
}
