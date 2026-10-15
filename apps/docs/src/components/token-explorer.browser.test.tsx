import '../styles/app.css';
import '@luke-ui/theme-tactile/stylesheet.css';
import { Provider } from '@luke-ui/react/provider';
import spriteSheetHref from '@luke-ui/react/spritesheet.svg?url&no-inline';
import {
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
	Outlet,
	RouterProvider,
} from '@tanstack/react-router';
import { act } from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import { afterEach, assert, expect, test } from 'vite-plus/test';
import { page } from 'vite-plus/test/context';
import { DocsThemeRoot } from './theme-controls.js';
import { TokenExplorer } from './token-explorer.js';

let container: HTMLElement | undefined;
let root: Root | undefined;

afterEach(() => {
	if (root) act(() => root?.unmount());
	container?.remove();
	container = undefined;
	root = undefined;
});

test('exposes a native token table with sample cells kept in the accessibility tree', async () => {
	await renderExplorer();

	const table = page.getByRole('table').first();
	await expect.element(table).toBeVisible();
	await expect.element(page.getByRole('columnheader', { name: 'Sample' }).first()).toBeVisible();
	await expect.element(page.getByRole('columnheader', { name: /vars path/ }).first()).toBeVisible();

	assert(container, 'expected a container');
	const sampleCell = container.querySelector('td');
	assert(sampleCell instanceof HTMLTableCellElement, 'expected a sample cell');
	expect(sampleCell.getAttribute('aria-hidden')).toBeNull();
	expect(sampleCell.querySelector('[aria-hidden]')).not.toBeNull();
});

test('aligns every column header to the start of its column', async () => {
	await renderExplorer();

	assert(container, 'expected a container');
	const headers = container.querySelectorAll('th');
	expect(headers.length).toBeGreaterThan(0);
	for (const header of headers) {
		expect(getComputedStyle(header).textAlign).toBe('start');
	}
});

test('links related guides to their docs pages', async () => {
	await renderExplorer();

	await expect
		.element(page.getByRole('link', { name: 'Colour' }).first())
		.toHaveAttribute('href', '/docs/color');
	await expect
		.element(page.getByRole('link', { name: 'Typography' }).first())
		.toHaveAttribute('href', '/docs/typography');
});

async function renderExplorer() {
	const rootRoute = createRootRoute({
		component: () => (
			<Provider spritesheetHref={spriteSheetHref}>
				<DocsThemeRoot>
					<TokenExplorer />
					<Outlet />
				</DocsThemeRoot>
			</Provider>
		),
	});
	// DocsLink targets `/$`; register it so createLink can resolve related guide hrefs.
	const splatRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: '/$',
	});
	const router = createRouter({
		history: createMemoryHistory({ initialEntries: ['/'] }),
		routeTree: rootRoute.addChildren([splatRoute]),
	});

	container = document.body.appendChild(document.createElement('div'));
	container.style.inlineSize = '1100px';
	root = createRoot(container);
	await act(async () => {
		root?.render(<RouterProvider router={router} />);
		await router.load();
	});
}
