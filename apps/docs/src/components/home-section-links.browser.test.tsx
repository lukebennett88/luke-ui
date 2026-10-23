import '../styles/app.css';
import '@luke-ui/theme-tactile/stylesheet.css';
import { HeadingLevels } from '@luke-ui/react/heading';
import {
	createMemoryHistory,
	createRootRoute,
	createRouter,
	RouterProvider,
} from '@tanstack/react-router';
import { act } from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, test } from 'vite-plus/test';
import { page } from 'vite-plus/test/context';
import { HOME_SECTIONS } from '../lib/home-content.js';
import { HomeSectionLinks } from './home-section-links.js';

let container: HTMLElement | undefined;
let root: Root | undefined;

afterEach(async () => {
	if (root) act(() => root?.unmount());
	container?.remove();
	container = undefined;
	root = undefined;
	await page.viewport(1024, 800);
});

test('links each section card as one link named by its h2 title and description', async () => {
	await renderLinks();

	await expect.element(page.getByRole('link').first()).toBeVisible();
	const links = page.getByRole('link').elements();
	expect(links.map((link) => link.getAttribute('href'))).toEqual(
		HOME_SECTIONS.map((section) => section.href),
	);
	for (const section of HOME_SECTIONS) {
		const link = page.getByRole('link', { name: `${section.title} ${section.description}` });
		expect(link.element()).toBeVisible();
		expect(link.getByRole('heading', { level: 2, name: section.title }).element()).toBeVisible();
	}
});

for (const { columns, width } of [
	{ columns: 1, width: 390 },
	{ columns: 2, width: 800 },
]) {
	test(`lays the cards out in ${columns} column(s) with equal row heights at ${width}px`, async () => {
		await page.viewport(width, 800);
		await renderLinks();

		const rects = page
			.getByRole('link')
			.elements()
			.map((link) => link.getBoundingClientRect());
		expect(new Set(rects.map((rect) => Math.round(rect.left))).size).toBe(columns);
		for (let index = 0; index < rects.length; index += columns) {
			const row = rects.slice(index, index + columns);
			expect(new Set(row.map((rect) => Math.round(rect.height))).size).toBe(1);
		}
	});
}

async function renderLinks() {
	const rootRoute = createRootRoute({
		component: () => (
			<HeadingLevels base={1}>
				<HeadingLevels>
					<HomeSectionLinks />
				</HeadingLevels>
			</HeadingLevels>
		),
	});
	const router = createRouter({
		history: createMemoryHistory({ initialEntries: ['/'] }),
		routeTree: rootRoute,
	});
	container = document.body.appendChild(document.createElement('div'));
	root = createRoot(container);
	await act(async () => {
		root?.render(<RouterProvider router={router} />);
		await router.load();
	});
}
