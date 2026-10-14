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
import { ComponentPropsTable } from './component-props-table.js';
import { DocsThemeRoot } from './theme-controls.js';
import { TypeTable } from './type-table.js';

/** Matches the docs article `maxInlineSize` of `52rem` at a 16px root. */
const ARTICLE_INLINE_SIZE = '832px';
const MOBILE_INLINE_SIZE = '375px';

let container: HTMLElement | undefined;
let root: Root | undefined;

afterEach(() => {
	if (root) act(() => root?.unmount());
	container?.remove();
	container = undefined;
	root = undefined;
});

test('expands a prop row and keeps description text out of nested paragraphs', async () => {
	await renderWidget(
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
	await renderWidget(
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

test('keeps prop types visible at the docs article width', async () => {
	await renderWidget(
		<TypeTable
			id="api"
			type={{
				appearance: {
					type: 'union',
					typeDescription: '"solid" | "subtle" | "text"',
				},
			}}
		/>,
		{ inlineSize: ARTICLE_INLINE_SIZE },
	);

	await expect
		.element(page.getByRole('button', { name: /appearance.*"solid" \| "subtle" \| "text"/ }))
		.toBeVisible();
});

test('keeps prop types visible at a mobile width', async () => {
	await renderWidget(
		<TypeTable
			id="api"
			type={{
				onPress: {
					type: 'function',
					typeDescription: '(event: PressEvent) => void',
				},
			}}
		/>,
		{ inlineSize: MOBILE_INLINE_SIZE },
	);

	await expect.element(page.getByRole('button', { name: /onPress.*PressEvent/ })).toBeVisible();
});

test('keeps typeDescriptionLink out of the disclosure trigger', async () => {
	await renderWidget(
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
		{ inlineSize: ARTICLE_INLINE_SIZE },
	);

	assert(container, 'expected a container');
	const triggerElement = container.querySelector('button');
	assert(triggerElement, 'expected disclosure trigger');
	expect(triggerElement.querySelector('a')).toBeNull();
	expect(triggerElement.textContent).toContain('ColorToken');

	await userEvent.click(page.getByRole('button', { name: /color/ }));
	const typeLink = page.getByRole('link', { name: 'ColorToken' });
	await expect.element(typeLink).toBeVisible();

	await userEvent.keyboard('{Tab}');
	expect(document.activeElement).toBe(typeLink.element());
});

test('opens a ComponentPropsTable row from the shared hash prefix', async () => {
	await renderWidget(
		<ComponentPropsTable
			id="button-api"
			type={{
				label: {
					description: 'Grouped hash target.',
					type: 'string',
				},
				className: {
					description: 'Other group prop.',
					type: 'string',
				},
			}}
		/>,
		{ hash: 'button-api-label', inlineSize: ARTICLE_INLINE_SIZE },
	);

	await expect.element(page.getByText('Grouped hash target.')).toBeVisible();
	await expect.element(page.getByText('string').first()).toBeVisible();
});

async function renderWidget(
	children: ReactNode,
	options: { hash?: string; inlineSize?: string } = {},
) {
	const { hash, inlineSize = ARTICLE_INLINE_SIZE } = options;
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
