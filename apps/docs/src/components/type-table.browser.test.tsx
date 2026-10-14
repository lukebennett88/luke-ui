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
import type { ReactNode } from 'react';
import { act } from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import { afterEach, assert, expect, test } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/context';
import { DocsThemeRoot } from './theme-controls.js';
import { TypeTable } from './type-table.js';

let container: HTMLElement | undefined;
let root: Root | undefined;

afterEach(() => {
	if (root) act(() => root?.unmount());
	container?.remove();
	container = undefined;
	root = undefined;
});

test('expands a prop row and keeps description text out of nested paragraphs', async () => {
	await renderTable(
		<TypeTable
			id="api"
			type={{
				label: {
					default: '"Untitled"',
					description: 'Visible label text.',
					type: 'string',
				},
			}}
		/>,
	);

	const trigger = page.getByRole('button', { name: /label/ });
	await userEvent.click(trigger);
	await expect.element(page.getByText('Visible label text.')).toBeVisible();
	await expect.element(page.getByText('Default')).toBeVisible();
	await expect.element(page.getByText('"Untitled"')).toBeVisible();

	assert(container, 'expected a container');
	const nestedParagraphs = [...container.querySelectorAll('p p')];
	expect(nestedParagraphs).toEqual([]);
});

test('opens a row when the URL hash matches its id', async () => {
	await renderTable(
		<TypeTable
			id="api"
			type={{
				label: { description: 'From hash.', type: 'string' },
			}}
		/>,
		{ hash: 'api-label' },
	);

	await expect.element(page.getByText('From hash.')).toBeVisible();
});

test('uses one grid track for the prop row below the type-column breakpoint', async () => {
	await renderTable(
		<TypeTable
			id="api"
			type={{
				appearance: { type: '"solid" | "subtle"' },
			}}
		/>,
		{ inlineSize: '480px' },
	);

	assert(container, 'expected a container');
	const triggerGrid = container.querySelector('[class*="propTypeGrid"]');
	assert(triggerGrid instanceof HTMLElement, 'expected prop/type grid');
	const tracks = getComputedStyle(triggerGrid).gridTemplateColumns.trim().split(/\s+/);
	expect(tracks).toHaveLength(1);
	const typeColumn = triggerGrid.querySelector('[class*="typeColumn"]');
	assert(typeColumn instanceof HTMLElement, 'expected type column');
	expect(getComputedStyle(typeColumn).display).toBe('none');
	await expect.element(page.getByRole('button', { name: /appearance/ })).toBeVisible();
});

test('keeps typeDescriptionLink out of the disclosure trigger', async () => {
	await renderTable(
		<TypeTable
			id="api"
			type={{
				color: {
					description: 'Accent colour.',
					type: 'ColorToken',
					typeDescriptionLink: '/docs/tokens#color',
				},
			}}
		/>,
	);

	const trigger = page.getByRole('button', { name: /color/ });
	assert(container, 'expected a container');
	const triggerElement = container.querySelector('button');
	assert(triggerElement, 'expected disclosure trigger');
	expect(triggerElement.querySelector('a')).toBeNull();

	await userEvent.click(trigger);
	const typeLink = page.getByRole('link', { name: 'ColorToken' });
	await expect.element(typeLink).toBeVisible();

	await userEvent.keyboard('{Tab}');
	expect(document.activeElement).toBe(typeLink.element());
});

async function renderTable(
	children: ReactNode,
	options: { hash?: string; inlineSize?: string } = {},
) {
	const { hash, inlineSize = '1100px' } = options;
	const rootRoute = createRootRoute({
		component: () => (
			<Provider spritesheetHref={spriteSheetHref}>
				<DocsThemeRoot>{children}</DocsThemeRoot>
			</Provider>
		),
	});
	const initialEntry = hash === undefined ? '/' : `/#${hash}`;
	const router = createRouter({
		history: createMemoryHistory({ initialEntries: [initialEntry] }),
		routeTree: rootRoute,
	});

	container = document.body.appendChild(document.createElement('div'));
	container.style.inlineSize = inlineSize;
	root = createRoot(container);
	await act(async () => {
		root?.render(<RouterProvider router={router} />);
		await router.load();
	});
}
