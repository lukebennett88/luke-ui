/// <reference types="mdx" />
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
import { ComponentPropsTable } from './component-props-table.js';
import { MdxCode } from './docs-article/mdx-elements.js';
import { DocsThemeRoot } from './theme-controls.js';
import { TypeDefinitionsProvider } from './type-definitions-context.js';
import { TypeTable } from './type-table.js';

/** Matches the docs article `maxInlineSize` of `52rem` at a 16px root. */
const ARTICLE_INLINE_SIZE = '832px';
const MOBILE_INLINE_SIZE = '375px';

/** Real guides render their examples elsewhere. This suite needs only their API tables. */
const GUIDE_COMPONENTS = { ComponentPropsTable, ExampleBlock: () => null, code: MdxCode };

const PRESS_ACTION_DEFINITION_PATTERN = /^type PressAction = /;
const RESPONSIVE_VALUE_DEFINITION_PATTERN =
	/^type RequiredInitialResponsiveValue<Value> = RequiredInitialResponsive</;

const SYNTHETIC_TYPE = 'RequiredInitialResponsiveValue<number | string>';
const SYNTHETIC_DEFINITION =
	'type RequiredInitialResponsiveValue<Value> = RequiredInitialResponsive<Value>;';

let container: HTMLElement | undefined;
let root: Root | undefined;

afterEach(() => {
	if (root) act(() => root?.unmount());
	container?.remove();
	container = undefined;
	root = undefined;
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

/** Long generated signature that stretches a phone viewport when wrapping fails. */
const LONG_ALIGN_SELF_TYPE =
	'ResponsiveValue<"auto" | "baseline" | "center" | "flex-end" | "flex-start" | "normal" | "stretch"> | undefined';

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

test('keeps a long linked type from widening a mobile viewport', async () => {
	vi.spyOn(globalThis, 'fetch').mockResolvedValue(definitionsResponse());

	await renderWidget(
		<TypeDefinitionsProvider
			definitionNames={['ResponsiveValue']}
			definitionsHref="/type-definitions/overflow.json"
		>
			<TypeTable
				id="api"
				type={{
					alignSelf: {
						description: 'Aligns this part on the cross axis.',
						type: LONG_ALIGN_SELF_TYPE,
						typeDescriptionLink: 'ResponsiveValue',
					},
				}}
			/>
		</TypeDefinitionsProvider>,
		{ inlineSize: MOBILE_INLINE_SIZE },
	);

	await expect
		.element(page.getByRole('button', { exact: true, name: LONG_ALIGN_SELF_TYPE }))
		.toBeVisible();
	assert(container, 'expected a container');
	expect(container.scrollWidth).toBeLessThanOrEqual(container.clientWidth);
});

test('keeps the Lockup guide API table from widening a mobile viewport', async () => {
	const { default: LockupGuide } = await import('../../content/docs/components/layout/lockup.mdx');
	await renderWidget(<LockupGuide components={GUIDE_COMPONENTS} />, {
		inlineSize: MOBILE_INLINE_SIZE,
	});

	await expect.element(page.getByRole('rowheader', { name: 'alignSelf' })).toBeVisible();
	assert(container, 'expected a container');
	expect(container.scrollWidth).toBeLessThanOrEqual(container.clientWidth);
});

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
	vi.spyOn(globalThis, 'fetch').mockResolvedValue(definitionsResponse());

	await renderDeferredTypeTable('/type-definitions/focus.json');

	const trigger = page.getByRole('button', {
		exact: true,
		name: SYNTHETIC_TYPE,
	});
	await expect.element(trigger).toBeVisible();
	await expect.element(trigger).toHaveAccessibleName(SYNTHETIC_TYPE);
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

test('the Button guide opens PressAction from its generated definitions', async () => {
	// The Button primitive guide also documents a `ButtonProps` from a `button.tsx`, which fumadocs
	// gives the same table id. Compiling it too checks that each guide keeps its own definitions.
	const { default: ButtonGuide } = await import('../../content/docs/components/actions/button.mdx');
	await import('../../content/docs/components/primitives/button.mdx');
	await renderWidget(<ButtonGuide components={GUIDE_COMPONENTS} />);

	const { dialog, trigger } = await openDefinitionWithKeyboard('PressAction', 'PressAction');
	await expect.element(dialog.getByText(PRESS_ACTION_DEFINITION_PATTERN)).toBeVisible();
	await userEvent.keyboard('{Escape}');
	await expect.element(dialog).not.toBeInTheDocument();
	await expect.element(trigger).toHaveFocus();
});

test('the Grid guide opens RequiredInitialResponsiveValue from its generated definitions', async () => {
	const { default: GridGuide } = await import('../../content/docs/components/layout/grid.mdx');
	await renderWidget(<GridGuide components={GUIDE_COMPONENTS} />);

	const { dialog, trigger } = await openDefinitionWithKeyboard(
		'RequiredInitialResponsiveValue',
		'RequiredInitialResponsiveValue<number | string>',
	);
	await expect.element(dialog.getByText(RESPONSIVE_VALUE_DEFINITION_PATTERN)).toBeVisible();
	await userEvent.keyboard('{Escape}');
	await expect.element(dialog).not.toBeInTheDocument();
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
	expect(page.getByRole('button', { name: 'Promise<string>' }).elements()).toHaveLength(0);
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
		exact: true,
		name: SYNTHETIC_TYPE,
	});
	await userEvent.click(trigger.element());
	await expect
		.element(page.getByRole('dialog', { name: 'Definition of RequiredInitialResponsiveValue' }))
		.toBeVisible();
	await expect.element(page.getByText('Loading definition…')).toBeVisible();

	assert(resolveFetch, 'expected fetch to start');
	const completeFetch = resolveFetch;
	await act(async () => {
		completeFetch(definitionsResponse());
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
		return definitionsResponse();
	});

	await renderDeferredTypeTable('/type-definitions/retry.json', ['RequiredInitialResponsiveValue']);
	const trigger = page.getByRole('button', {
		exact: true,
		name: SYNTHETIC_TYPE,
	});
	await userEvent.click(trigger.element());
	await expect
		.element(page.getByRole('dialog', { name: 'Definition of RequiredInitialResponsiveValue' }))
		.toBeVisible();
	await expect.element(page.getByText(/Failed to load type definitions/)).toBeVisible();
	expect(fetchMock.mock.calls.length).toBeGreaterThan(0);
	expect(fetchMock).toHaveBeenCalledWith('/type-definitions/retry.json');

	allowSuccess = true;
	await userEvent.click(page.getByRole('button', { exact: true, name: 'Retry' }).element());
	await expect.element(page.getByText(/type RequiredInitialResponsiveValue/)).toBeVisible();
});

test('deferred tables only link aliases registered in definitionNames', async () => {
	const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(definitionsResponse());

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
						type: SYNTHETIC_TYPE,
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
		.element(page.getByRole('button', { exact: true, name: SYNTHETIC_TYPE }))
		.toBeVisible();
	expect(page.getByRole('button', { name: 'Promise<string>' }).elements()).toHaveLength(0);
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
		exact: true,
		name: SYNTHETIC_TYPE,
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
	vi.spyOn(globalThis, 'fetch').mockResolvedValue(definitionsResponse());

	await renderWidget(
		<ComponentPropsTable
			definitionNames={['RequiredInitialResponsiveValue']}
			definitionsHref="/type-definitions/axe.json"
			id="grid-api"
			type={{
				columns: {
					description: 'Column tracks.',
					type: SYNTHETIC_TYPE,
					typeDescriptionLink: 'RequiredInitialResponsiveValue',
				},
			}}
		/>,
	);

	const trigger = page.getByRole('button', {
		exact: true,
		name: SYNTHETIC_TYPE,
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

test('ignores a response for an asset the table no longer uses', async () => {
	const resolvers = new Map<string, (response: Response) => void>();
	vi.spyOn(globalThis, 'fetch').mockImplementation((input) => {
		const href = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
		return new Promise((resolve) => {
			resolvers.set(href, resolve);
		});
	});

	function SwitchableAsset() {
		const [href, setHref] = useState('/type-definitions/stale-a.json');
		return (
			<>
				<button onClick={() => setHref('/type-definitions/stale-b.json')} type="button">
					Use asset B
				</button>
				{deferredTypeTableTree(href)}
			</>
		);
	}

	await renderWidget(<SwitchableAsset />);
	const trigger = page.getByRole('button', {
		exact: true,
		name: SYNTHETIC_TYPE,
	});
	await userEvent.click(trigger.element());
	await expect.element(page.getByText('Loading definition…')).toBeVisible();
	await userEvent.keyboard('{Escape}');
	await userEvent.click(page.getByRole('button', { name: 'Use asset B' }).element());
	await userEvent.click(trigger.element());
	await expect.element(page.getByText('Loading definition…')).toBeVisible();

	const resolveA = resolvers.get('/type-definitions/stale-a.json');
	const resolveB = resolvers.get('/type-definitions/stale-b.json');
	assert(resolveA, 'expected fetch for stale-a');
	assert(resolveB, 'expected fetch for stale-b');

	await act(async () => {
		resolveB(definitionsResponse('type RequiredInitialResponsiveValue<Value> = "from-b";'));
	});
	await expect.element(page.getByText(/from-b/)).toBeVisible();

	await act(async () => {
		resolveA(definitionsResponse('type RequiredInitialResponsiveValue<Value> = "from-a";'));
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
		exact: true,
		name: SYNTHETIC_TYPE,
	});
	await userEvent.click(trigger.element());
	await expect
		.element(page.getByRole('dialog', { name: 'Definition of RequiredInitialResponsiveValue' }))
		.toBeVisible();
	await expect.element(page.getByText('Invalid type definitions payload')).toBeVisible();
	await expect.element(page.getByRole('button', { exact: true, name: 'Retry' })).toBeVisible();
});

/**
 * Opens a generated table's popover from its focused trigger with Enter. The trigger's accessible
 * name must be its complete visible type, generic arguments included.
 */
async function openDefinitionWithKeyboard(typeName: string, visibleType: string) {
	const trigger = page.getByRole('button', { exact: true, name: visibleType });
	await expect.element(trigger).toHaveAccessibleName(visibleType);
	trigger.element().focus();
	await userEvent.keyboard('{Enter}');

	const dialog = page.getByRole('dialog', { name: `Definition of ${typeName}` });
	await expect.element(dialog).toBeVisible();
	return { dialog, trigger };
}

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
						type: SYNTHETIC_TYPE,
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

function definitionsResponse(definition = SYNTHETIC_DEFINITION) {
	return new Response(
		JSON.stringify({
			RequiredInitialResponsiveValue: {
				definition,
				name: 'RequiredInitialResponsiveValue',
				references: [],
			},
		}),
		{ headers: { 'Content-Type': 'application/json' }, status: 200 },
	);
}

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
