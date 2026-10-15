import '../styles/app.css';
import '@luke-ui/theme-tactile/stylesheet.css';
import { Provider } from '@luke-ui/react/provider';
import spriteSheetHref from '@luke-ui/react/spritesheet.svg?url&no-inline';
import {
	createMemoryHistory,
	createRootRoute,
	createRoute,
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

test('renders a semantic table with descriptions visible and no nested paragraphs', async () => {
	await renderWidget(
		<TypeTable
			id="api"
			type={{
				label: {
					default: '"Untitled"',
					description: <p>Visible label text.</p>,
					type: 'string',
				},
			}}
		/>,
	);

	await expect.element(page.getByRole('table')).toBeVisible();
	await expect.element(page.getByRole('columnheader', { name: 'Name' })).toBeVisible();
	await expect.element(page.getByRole('columnheader', { name: 'Type' })).toBeVisible();
	await expect.element(page.getByRole('columnheader', { name: 'Default' })).toBeVisible();
	await expect.element(page.getByRole('rowheader', { name: 'label' })).toBeVisible();
	await expect.element(page.getByText('Visible label text.')).toBeVisible();
	await expect.element(page.getByRole('cell', { name: /"Untitled"/ })).toBeVisible();

	assert(container, 'expected a container');
	expect(container.querySelectorAll('p p')).toHaveLength(0);
	expect(container.querySelector('button')).toBeNull();
});

test('shows the Default column only when a prop has a default', async () => {
	await renderWidget(<TypeTable id="api" type={{ label: { type: 'string' } }} />);

	await expect.element(page.getByRole('columnheader', { name: 'Type' })).toBeVisible();
	expect(page.getByRole('columnheader', { name: 'Default' }).elements()).toHaveLength(0);
});

test('marks required props only when the table mixes required and optional props', async () => {
	await renderWidget(
		<TypeTable
			id="api"
			type={{
				label: { required: true, type: 'string' },
				size: { required: false, type: 'string' },
			}}
		/>,
	);

	await expect.element(page.getByRole('img', { name: 'Required' })).toBeVisible();
	expect(page.getByRole('img', { name: 'Required' }).elements()).toHaveLength(1);
});

test('omits the required marker when every prop is optional', async () => {
	await renderWidget(<TypeTable id="api" type={{ label: { type: 'string' } }} />);

	expect(page.getByRole('img', { name: 'Required' }).elements()).toHaveLength(0);
});

test('gives each prop rowheader an id for hash links', async () => {
	await renderWidget(<TypeTable id="api" type={{ label: { type: 'string' } }} />);

	assert(container, 'expected a container');
	const rowHeader = container.querySelector('#api-label');
	expect(rowHeader?.tagName).toBe('TH');
	expect(rowHeader?.getAttribute('scope')).toBe('row');
});

test('hash targets clear the sticky site header', async () => {
	await renderWidget(<TypeTable id="api" type={{ label: { type: 'string' } }} />);

	assert(container, 'expected a container');
	const rowHeader = container.querySelector('#api-label');
	assert(rowHeader instanceof HTMLElement, 'expected a rowheader element');
	expect(rowHeader.tagName).toBe('TH');
	expect(getComputedStyle(rowHeader).scrollMarginBlockStart).not.toBe('0px');
	const row = rowHeader.closest('tr');
	assert(row, 'expected a table row');
	expect(getComputedStyle(row).scrollMarginBlockStart).toBe('0px');
});

test('associates a description row with its prop rowheader', async () => {
	await renderWidget(
		<TypeTable
			id="api"
			type={{
				label: {
					description: <p>Visible label text.</p>,
					type: 'string',
				},
			}}
		/>,
	);

	assert(container, 'expected a container');
	const rowHeader = container.querySelector('#api-label');
	expect(rowHeader?.tagName).toBe('TH');
	const descriptionCell = page.getByText('Visible label text.').element().closest('td');
	assert(descriptionCell, 'expected a description cell');
	expect(descriptionCell.getAttribute('headers')).toBe('api-label');
	expect(descriptionCell.getAttribute('colspan')).toBe('2');
});

test('associates a description row when the table has no id', async () => {
	await renderWidget(
		<TypeTable
			type={{
				label: {
					description: <p>Visible label text.</p>,
					type: 'string',
				},
			}}
		/>,
	);

	assert(container, 'expected a container');
	const rowHeader = page.getByRole('rowheader', { name: 'label' }).element();
	expect(rowHeader.tagName).toBe('TH');
	const rowId = rowHeader.getAttribute('id');
	assert(rowId, 'expected a generated rowheader id');
	const descriptionCell = page.getByText('Visible label text.').element().closest('td');
	assert(descriptionCell, 'expected a description cell');
	expect(descriptionCell.getAttribute('headers')).toBe(rowId);
	expect(container.querySelector(`#${CSS.escape(rowId)}`)).toBe(rowHeader);
});

for (const [width, inlineSize] of [
	['the docs article width', ARTICLE_INLINE_SIZE],
	['a mobile width', MOBILE_INLINE_SIZE],
] as const) {
	test(`keeps the type visible at ${width}`, async () => {
		await renderWidget(
			<TypeTable
				id="api"
				type={{
					onPress: {
						default: 'undefined',
						description: 'Fires on press.',
						type: 'function',
						typeDescription: '(event: PressEvent) => void',
					},
				}}
			/>,
			{ inlineSize },
		);

		await expect.element(page.getByText('(event: PressEvent) => void')).toBeVisible();
		await expect.element(page.getByText('Fires on press.')).toBeVisible();
		assert(container, 'expected a container');
		expect(container.scrollWidth).toBeLessThanOrEqual(container.clientWidth);
	});
}

test('keeps column headers accessible at a mobile width', async () => {
	await renderWidget(
		<TypeTable id="api" type={{ label: { default: '"Untitled"', type: 'string' } }} />,
		{ inlineSize: MOBILE_INLINE_SIZE },
	);

	// Narrow layout stacks cells visually, but columnheaders must stay in the accessibility tree
	// (visually hidden, not `display: none`).
	expect(page.getByRole('columnheader', { name: 'Name' }).elements()).toHaveLength(1);
	expect(page.getByRole('columnheader', { name: 'Type' }).elements()).toHaveLength(1);
	expect(page.getByRole('columnheader', { name: 'Default' }).elements()).toHaveLength(1);
	await expect.element(page.getByRole('rowheader', { name: 'label' })).toBeVisible();
	await expect.element(page.getByText('Default:')).toBeVisible();
});

test('renders typeDescriptionLink as a link in the type cell', async () => {
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
	);

	const link = page.getByRole('link', { name: 'ColorToken' });
	await expect.element(link).toBeVisible();
	expect(link.element().getAttribute('href')).toBe('/docs/tokens#color');
	expect(link.element().closest('td')).not.toBeNull();
});

test('lists parameters and returns under the description', async () => {
	await renderWidget(
		<TypeTable
			id="api"
			type={{
				validate: {
					description: 'Checks the value.',
					parameters: [{ description: 'The current value.', name: 'value' }],
					returns: 'An error message, or nothing.',
					type: 'function',
				},
			}}
		/>,
	);

	await expect.element(page.getByText('Parameters')).toBeVisible();
	await expect.element(page.getByText(/The current value\./)).toBeVisible();
	await expect.element(page.getByText('An error message, or nothing.')).toBeVisible();
});

test('shows Component props without a toggle and collapses the other groups', async () => {
	await renderWidget(
		<ComponentPropsTable
			id="button-api"
			type={{
				label: { description: 'The label.', type: 'string' },
				className: { description: 'Extra class.', type: 'string' },
			}}
		/>,
	);

	await expect.element(page.getByText('The label.')).toBeVisible();
	const toggle = page.getByRole('button', { name: 'Styling' });
	await expect.element(toggle).toHaveAttribute('aria-expanded', 'false');
	expect(page.getByText('Extra class.').elements()).toHaveLength(0);
	expect(page.getByRole('button', { name: 'Component props' }).elements()).toHaveLength(0);

	await userEvent.click(toggle);
	await expect.element(toggle).toHaveAttribute('aria-expanded', 'true');
	await expect.element(page.getByText('Extra class.')).toBeVisible();

	await userEvent.click(toggle);
	await expect.element(toggle).toHaveAttribute('aria-expanded', 'false');
	expect(page.getByText('Extra class.').elements()).toHaveLength(0);
});

test('expands the group that holds a prop named by the URL hash', async () => {
	await renderWidget(
		<ComponentPropsTable
			id="button-api"
			type={{
				label: { type: 'string' },
				className: { description: 'Extra class.', type: 'string' },
			}}
		/>,
		{ hash: 'button-api-className' },
	);

	await expect
		.element(page.getByRole('button', { name: 'Styling' }))
		.toHaveAttribute('aria-expanded', 'true');
	await expect.element(page.getByText('Extra class.')).toBeVisible();
	assert(container, 'expected a container');
	expect(container.querySelector('#button-api-className')?.tagName).toBe('TH');
});

test('computes the Default column and required marker across every group', async () => {
	await renderWidget(
		<ComponentPropsTable
			id="button-api"
			type={{
				label: { required: true, type: 'string' },
				onPress: { type: 'function' },
				className: { default: '""', required: false, type: 'string' },
			}}
		/>,
	);

	await expect.element(page.getByRole('columnheader', { name: 'Default' })).toBeVisible();
	await expect.element(page.getByRole('img', { name: 'Required' })).toBeVisible();
});

test('lists props in the order of their group', async () => {
	await renderWidget(
		<ComponentPropsTable
			id="button-api"
			type={{
				size: { type: 'string' },
				appearance: { type: 'string' },
			}}
		/>,
	);

	const names = page
		.getByRole('rowheader')
		.elements()
		.map((element) => element.textContent);
	expect(names).toEqual(['appearance', 'size']);
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
	// DocsLink targets `/$` for internal typeDescriptionLink paths.
	const splatRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: '/$',
	});
	const router = createRouter({
		history: createMemoryHistory({ initialEntries: [initialEntry] }),
		routeTree: rootRoute.addChildren([splatRoute]),
	});

	container = document.body.appendChild(document.createElement('div'));
	container.style.inlineSize = inlineSize;
	root = createRoot(container);
	await act(async () => {
		root?.render(<RouterProvider router={router} />);
		await router.load();
	});
}
