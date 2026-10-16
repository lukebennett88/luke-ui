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
import axe from 'axe-core';
import type { ReactNode } from 'react';
import { act, useState } from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import { afterEach, assert, expect, test, vi } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/context';
import { clearTypeDefinitionsCache } from '../lib/load-type-definitions.js';
import { ComponentPropsTable } from './component-props-table.js';
import { DocsThemeRoot } from './theme-controls.js';
import { TypeDefinitionsProvider } from './type-definitions-context.js';
import { TypeTable } from './type-table.js';

/** Matches the docs article `maxInlineSize` of `52rem` at a 16px root. */
const ARTICLE_INLINE_SIZE = '832px';
const MOBILE_INLINE_SIZE = '375px';

const DEFERRED_DEFINITION = {
	definition: 'type RequiredInitialResponsiveValue<Value> = RequiredInitialResponsive<Value>;',
	name: 'RequiredInitialResponsiveValue',
} as const;

let container: HTMLElement | undefined;
let root: Root | undefined;

afterEach(() => {
	if (root) act(() => root?.unmount());
	container?.remove();
	container = undefined;
	root = undefined;
	clearTypeDefinitionsCache();
	vi.restoreAllMocks();
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

test('opens a type definition popover for a linked alias and restores focus on dismiss', async () => {
	vi.spyOn(globalThis, 'fetch').mockResolvedValue(
		new Response(JSON.stringify({ RequiredInitialResponsiveValue: DEFERRED_DEFINITION }), {
			headers: { 'Content-Type': 'application/json' },
			status: 200,
		}),
	);

	await renderDeferredTypeTable('/type-definitions/focus.json');

	const trigger = page.getByRole('button', {
		name: 'Show definition of RequiredInitialResponsiveValue',
	});
	await expect.element(trigger).toBeVisible();
	await userEvent.click(trigger.element());
	await expect
		.element(page.getByRole('dialog', { name: 'Definition of RequiredInitialResponsiveValue' }))
		.toBeVisible();
	await expect.element(page.getByText(/type RequiredInitialResponsiveValue/)).toBeVisible();

	await userEvent.keyboard('{Escape}');
	await expect
		.element(page.getByRole('dialog', { name: 'Definition of RequiredInitialResponsiveValue' }))
		.not.toBeInTheDocument();
	// RAC FocusScope restores the trigger in a rAF after unmount.
	await expect.element(trigger).toHaveFocus();
});

test('falls back to plain text when a type reference has no definition', async () => {
	await renderWidget(
		<TypeTable
			id="api"
			type={{
				value: {
					type: 'Promise<string>',
					typeDescriptionLink: 'Promise',
				},
			}}
		/>,
	);

	await expect.element(page.getByText('Promise<string>')).toBeVisible();
	expect(page.getByRole('button', { name: /Show definition of Promise/ }).elements()).toHaveLength(
		0,
	);
	expect(page.getByRole('link').elements()).toHaveLength(0);
});

test('deferred definition fetch shows loading, then the definition', async () => {
	let resolveFetch: ((response: Response) => void) | undefined;
	const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(
		() =>
			new Promise((resolve) => {
				resolveFetch = resolve;
			}),
	);

	await renderDeferredTypeTable('/type-definitions/loading.json', [
		'RequiredInitialResponsiveValue',
	]);
	const trigger = page.getByRole('button', {
		name: 'Show definition of RequiredInitialResponsiveValue',
	});
	await userEvent.click(trigger.element());
	await expect
		.element(page.getByRole('dialog', { name: 'Definition of RequiredInitialResponsiveValue' }))
		.toBeVisible();
	await expect.element(page.getByText('Loading definition…')).toBeVisible();

	assert(resolveFetch, 'expected fetch to start');
	const completeFetch = resolveFetch;
	await act(async () => {
		completeFetch(
			new Response(JSON.stringify({ RequiredInitialResponsiveValue: DEFERRED_DEFINITION }), {
				headers: { 'Content-Type': 'application/json' },
				status: 200,
			}),
		);
	});
	await expect.element(page.getByText(/type RequiredInitialResponsiveValue/)).toBeVisible();
	expect(fetchMock).toHaveBeenCalledWith('/type-definitions/loading.json');
});

test('deferred definition fetch shows a recoverable error and retries', async () => {
	// Prefetch runs on hover/focus/press, so keep failing until Retry flips this flag.
	let allowSuccess = false;
	const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
		if (!allowSuccess) {
			return new Response('missing', { status: 404 });
		}
		return new Response(JSON.stringify({ RequiredInitialResponsiveValue: DEFERRED_DEFINITION }), {
			headers: { 'Content-Type': 'application/json' },
			status: 200,
		});
	});

	await renderDeferredTypeTable('/type-definitions/retry.json', ['RequiredInitialResponsiveValue']);
	const trigger = page.getByRole('button', {
		name: 'Show definition of RequiredInitialResponsiveValue',
	});
	await userEvent.click(trigger.element());
	await expect
		.element(page.getByRole('dialog', { name: 'Definition of RequiredInitialResponsiveValue' }))
		.toBeVisible();
	await expect.element(page.getByText(/Failed to load type definitions/)).toBeVisible();
	expect(fetchMock.mock.calls.length).toBeGreaterThan(0);
	expect(fetchMock).toHaveBeenCalledWith('/type-definitions/retry.json');

	allowSuccess = true;
	await userEvent.click(page.getByRole('button', { name: 'Retry loading definition' }).element());
	await expect.element(page.getByText(/type RequiredInitialResponsiveValue/)).toBeVisible();
});

test('deferred tables only link aliases registered in definitionNames', async () => {
	const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
		new Response(JSON.stringify({ RequiredInitialResponsiveValue: DEFERRED_DEFINITION }), {
			headers: { 'Content-Type': 'application/json' },
			status: 200,
		}),
	);

	await renderWidget(
		<TypeDefinitionsProvider
			definitionNames={['RequiredInitialResponsiveValue']}
			definitionsHref="/type-definitions/registered-only.json"
		>
			<TypeTable
				id="api"
				type={{
					columns: {
						description: 'Column tracks.',
						type: 'RequiredInitialResponsiveValue<number | string>',
						typeDescriptionLink: 'RequiredInitialResponsiveValue',
					},
					fallback: {
						description: 'Unresolved external.',
						type: 'Promise<string>',
						typeDescriptionLink: 'Promise',
					},
				}}
			/>
		</TypeDefinitionsProvider>,
	);

	await expect
		.element(
			page.getByRole('button', { name: 'Show definition of RequiredInitialResponsiveValue' }),
		)
		.toBeVisible();
	expect(page.getByRole('button', { name: /Show definition of Promise/ }).elements()).toHaveLength(
		0,
	);
	await expect.element(page.getByText('Promise<string>')).toBeVisible();
	expect(fetchMock).not.toHaveBeenCalled();
});

test('deferred fetch that omits a registered alias settles without infinite loading', async () => {
	const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
		new Response(JSON.stringify({}), {
			headers: { 'Content-Type': 'application/json' },
			status: 200,
		}),
	);

	await renderDeferredTypeTable('/type-definitions/empty-asset.json', [
		'RequiredInitialResponsiveValue',
	]);
	const trigger = page.getByRole('button', {
		name: 'Show definition of RequiredInitialResponsiveValue',
	});
	await userEvent.click(trigger.element());
	await expect
		.element(page.getByRole('dialog', { name: 'Definition of RequiredInitialResponsiveValue' }))
		.toBeVisible();
	await expect.element(page.getByText('Definition not available.')).toBeVisible();
	expect(page.getByText('Loading definition…').elements()).toHaveLength(0);
	expect(fetchMock).toHaveBeenCalledWith('/type-definitions/empty-asset.json');
});

test('linked type popovers in a ComponentPropsTable have no axe violations', async () => {
	vi.spyOn(globalThis, 'fetch').mockResolvedValue(
		new Response(
			JSON.stringify({
				RequiredInitialResponsiveValue: {
					definition:
						'type RequiredInitialResponsiveValue<Value> = RequiredInitialResponsive<ResponsivePropValue<Value>>;',
					name: 'RequiredInitialResponsiveValue',
				},
			}),
			{
				headers: { 'Content-Type': 'application/json' },
				status: 200,
			},
		),
	);

	await renderWidget(
		<ComponentPropsTable
			definitionNames={['RequiredInitialResponsiveValue']}
			definitionsHref="/type-definitions/axe.json"
			id="grid-api"
			type={{
				columns: {
					description: 'Column tracks.',
					type: 'RequiredInitialResponsiveValue<number | string>',
					typeDescriptionLink: 'RequiredInitialResponsiveValue',
				},
			}}
		/>,
	);

	const trigger = page.getByRole('button', {
		name: 'Show definition of RequiredInitialResponsiveValue',
	});
	await userEvent.click(trigger.element());
	const dialog = page.getByRole('dialog', {
		name: 'Definition of RequiredInitialResponsiveValue',
	});
	await expect.element(dialog).toBeVisible();
	await expect.element(page.getByText(/type RequiredInitialResponsiveValue/)).toBeVisible();

	// Include the portalled dialog; Vitest document chrome trips landmark rules.
	assert(container, 'expected a container');
	const results = await axe.run([container, dialog.element()]);
	expect(
		results.violations.map((violation) => ({
			id: violation.id,
			nodes: violation.nodes.map((node) => node.html),
		})),
	).toEqual([]);
});

test('deferred fetch ignores a stale response after a newer href wins', async () => {
	const resolvers = new Map<string, (response: Response) => void>();
	vi.spyOn(globalThis, 'fetch').mockImplementation((input) => {
		const href = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
		return new Promise((resolve) => {
			resolvers.set(href, resolve);
		});
	});

	const { rerender } = await renderDeferredTypeTableWithRerender('/type-definitions/stale-a.json');
	const trigger = page.getByRole('button', {
		name: 'Show definition of RequiredInitialResponsiveValue',
	});
	await userEvent.click(trigger.element());
	await expect.element(page.getByText('Loading definition…')).toBeVisible();
	assert(resolvers.has('/type-definitions/stale-a.json'), 'expected fetch for stale-a');

	// Close before swapping href so the next press opens B instead of toggling A shut.
	await userEvent.keyboard('{Escape}');
	await expect
		.element(page.getByRole('dialog', { name: 'Definition of RequiredInitialResponsiveValue' }))
		.not.toBeInTheDocument();

	await rerender(deferredTypeTableTree('/type-definitions/stale-b.json'));

	await userEvent.click(
		page
			.getByRole('button', { name: 'Show definition of RequiredInitialResponsiveValue' })
			.element(),
	);
	await expect.element(page.getByText('Loading definition…')).toBeVisible();

	const resolveA = resolvers.get('/type-definitions/stale-a.json');
	const resolveB = resolvers.get('/type-definitions/stale-b.json');
	assert(resolveA, 'expected fetch for stale-a');
	assert(resolveB, 'expected fetch for stale-b');

	await act(async () => {
		resolveB(
			new Response(
				JSON.stringify({
					RequiredInitialResponsiveValue: {
						definition: 'type RequiredInitialResponsiveValue<Value> = "from-b";',
						name: 'RequiredInitialResponsiveValue',
					},
				}),
				{ headers: { 'Content-Type': 'application/json' }, status: 200 },
			),
		);
	});
	await expect.element(page.getByText(/from-b/)).toBeVisible();

	await act(async () => {
		resolveA(
			new Response(
				JSON.stringify({
					RequiredInitialResponsiveValue: {
						definition: 'type RequiredInitialResponsiveValue<Value> = "from-a";',
						name: 'RequiredInitialResponsiveValue',
					},
				}),
				{ headers: { 'Content-Type': 'application/json' }, status: 200 },
			),
		);
	});
	await expect.element(page.getByText(/from-b/)).toBeVisible();
	expect(page.getByText(/from-a/).elements()).toHaveLength(0);
});

test('invalid definition JSON shows a recoverable error', async () => {
	// Fresh Response per call: failed loads drop the cache, and a reused body stream is already read.
	vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
		Promise.resolve(
			new Response(JSON.stringify({ Broken: { definition: 1, name: 'Broken' } }), {
				headers: { 'Content-Type': 'application/json' },
				status: 200,
			}),
		),
	);

	await renderDeferredTypeTable('/type-definitions/invalid.json');
	const trigger = page.getByRole('button', {
		name: 'Show definition of RequiredInitialResponsiveValue',
	});
	await userEvent.click(trigger.element());
	await expect
		.element(page.getByRole('dialog', { name: 'Definition of RequiredInitialResponsiveValue' }))
		.toBeVisible();
	await expect.element(page.getByText('Invalid type definitions payload')).toBeVisible();
	await expect
		.element(page.getByRole('button', { name: 'Retry loading definition' }))
		.toBeVisible();
});

function deferredTypeTableTree(
	definitionsHref: string,
	definitionNames: ReadonlyArray<string> = ['RequiredInitialResponsiveValue'],
) {
	return (
		<TypeDefinitionsProvider definitionNames={definitionNames} definitionsHref={definitionsHref}>
			<TypeTable
				id="api"
				type={{
					columns: {
						description: 'Column tracks.',
						type: 'RequiredInitialResponsiveValue<number | string>',
						typeDescriptionLink: 'RequiredInitialResponsiveValue',
					},
				}}
			/>
		</TypeDefinitionsProvider>
	);
}

async function renderDeferredTypeTable(
	definitionsHref: string,
	definitionNames: ReadonlyArray<string> = ['RequiredInitialResponsiveValue'],
) {
	await renderWidget(deferredTypeTableTree(definitionsHref, definitionNames));
}

async function renderDeferredTypeTableWithRerender(definitionsHref: string) {
	return renderWidgetWithRerender(deferredTypeTableTree(definitionsHref));
}

async function renderWidget(
	children: ReactNode,
	options: { hash?: string; inlineSize?: string } = {},
) {
	await renderWidgetWithRerender(children, options);
}

async function renderWidgetWithRerender(
	children: ReactNode,
	options: { hash?: string; inlineSize?: string } = {},
) {
	const { hash, inlineSize = ARTICLE_INLINE_SIZE } = options;
	const childrenRef = { current: children };
	let bump: (() => void) | undefined;

	const rootRoute = createRootRoute({
		component: function TestRoot() {
			const [, setTick] = useState(0);
			bump = () => {
				setTick((tick) => tick + 1);
			};
			return (
				<Provider spritesheetHref={spriteSheetHref}>
					<DocsThemeRoot>{childrenRef.current}</DocsThemeRoot>
				</Provider>
			);
		},
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

	return {
		rerender: async (next: ReactNode) => {
			childrenRef.current = next;
			await act(async () => {
				bump?.();
			});
		},
	};
}
