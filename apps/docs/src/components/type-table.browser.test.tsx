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
import type { TypeTokens } from '../lib/type-tokens.js';
import { ComponentPropsTable } from './component-props-table.js';
import { MdxCode } from './docs-article/mdx-elements.js';
import { DocsThemeRoot } from './theme-controls.js';
import { TypeDefinitionsProvider } from './type-definitions-context.js';
import { TypeTokensView } from './type-popover.js';
import { TypeTable } from './type-table.js';

/** Matches the docs article `maxInlineSize` of `52rem` at a 16px root. */
const ARTICLE_INLINE_SIZE = '832px';
const MOBILE_INLINE_SIZE = '375px';

/** Real guides render their examples elsewhere. This suite needs only their API tables. */
const GUIDE_COMPONENTS = { ComponentPropsTable, ExampleBlock: () => null, code: MdxCode };

const PRESS_ACTION_DEFINITION_PATTERN = /^type PressAction = /;
const OPERATOR_GLUE_PATTERN = /\u2060?\u00a0/g;
const PROMINENCE_DEFINITION_PATTERN =
	/^type Prominence = 'low'\s+\|\u2060\s'standard'\s+\|\u2060\s'high';$/;
const BOX_ELEMENT_TYPE_DEFINITION_PATTERN = /^type BoxLikeElementType = keyof Pick</;
const DEFINITIONS_ASSET_PATTERN = /\/type-definitions\/[0-9a-f]{16}\.json/;
const BOX_ELEMENT_TYPE_RESOLVED_PATTERN = /^"article"\s+\|\u2060\s"aside"\s+\|\u2060\s[\s\S]*"ul"$/;
const RESPONSIVE_VALUE_DEFINITION_PATTERN =
	/^type RequiredInitialResponsiveValue<Value> = RequiredInitialResponsive</;

const SYNTHETIC_TYPE = 'RequiredInitialResponsiveValue<number | string>';
/** The tokens the build gives `SYNTHETIC_TYPE`. Only the type name is a link. */
const SYNTHETIC_TOKENS: TypeTokens = [
	['t', 'RequiredInitialResponsiveValue', 'RequiredInitialResponsiveValue'],
	'<',
	['k', 'number'],
	' |\u2060\u00a0',
	['k', 'string'],
	'>',
];
const SYNTHETIC_TRIGGER = 'RequiredInitialResponsiveValue';
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
const ALIGN_SELF_VALUES = [
	'auto',
	'baseline',
	'center',
	'flex-end',
	'flex-start',
	'normal',
	'stretch',
];
/** `LONG_ALIGN_SELF_TYPE` as the build formats it: one union member per line. */
const LONG_ALIGN_SELF_TOKENS: TypeTokens = [
	['t', 'ResponsiveValue', 'ResponsiveValue'],
	'<',
	...ALIGN_SELF_VALUES.flatMap((value, index): TypeTokens => [
		...(index === 0 ? [] : [1, '|\u2060\u00a0']),
		['s', `"${value}"`],
	]),
	'> |\u2060\u00a0',
	['k', 'undefined'],
];

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
						typeTokens: LONG_ALIGN_SELF_TOKENS,
					},
				}}
			/>
		</TypeDefinitionsProvider>,
		{ inlineSize: MOBILE_INLINE_SIZE },
	);

	await expect
		.element(page.getByRole('button', { exact: true, name: 'ResponsiveValue' }))
		.toBeVisible();
	assert(container, 'expected a container');
	expect(container.scrollWidth).toBeLessThanOrEqual(container.clientWidth);
});

test('shows a long union in the type cell with one member per line', async () => {
	await renderWidget(
		<TypeTable
			id="api"
			type={{
				alignSelf: {
					description: 'Aligns this part on the cross axis.',
					type: LONG_ALIGN_SELF_TYPE,
					typeTokens: LONG_ALIGN_SELF_TOKENS,
				},
			}}
		/>,
	);

	const cell = page.getByRole('cell').filter({ hasText: 'ResponsiveValue' }).first().element();
	assert(cell instanceof HTMLElement, 'expected the type cell');
	// The build's line breaks survive rendering, so each member starts its own indented line.
	expect(visibleText(cell).split('\n')).toEqual([
		'ResponsiveValue<"auto"',
		...ALIGN_SELF_VALUES.slice(1, -1).map((value) => `  | "${value}"`),
		'  | "stretch"> | undefined',
	]);
	// Without a definitions provider the type name is plain text, not a trigger.
	expect(page.getByRole('button').elements()).toHaveLength(0);
});

test('wraps a union before its operator, never between the operator and its member', async () => {
	await renderWidget(
		<p>
			<TypeTokensView
				tokens={[
					['t', 'ResponsiveValue'],
					'<',
					['s', '"0"'],
					' |\u2060\u00a0',
					['s', '"1"'],
					'>',
					' |\u2060\u00a0',
					['k', 'undefined'],
				]}
			/>
		</p>,
	);
	const member = page.getByText('undefined', { exact: true }).element();
	const paragraph = member.closest('p');
	assert(paragraph, 'expected the paragraph');
	// Room for `ResponsiveValue<"0" | "1"> |` and its no-break space, but not the member after them.
	const characterInlineSize = member.getBoundingClientRect().width / 'undefined'.length;
	paragraph.style.inlineSize = `${characterInlineSize * 29.5}px`;

	const operator = document.createRange();
	const joiner = member.previousSibling;
	assert(joiner instanceof Text, 'expected the operator before the member');
	operator.setStart(joiner, 1);
	operator.setEnd(joiner, 2);
	const memberTop = member.getBoundingClientRect().top;
	expect(memberTop).toBeGreaterThan(paragraph.getBoundingClientRect().top + 1);
	expect(operator.getBoundingClientRect().top).toBeCloseTo(memberTop, 0);
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
		name: SYNTHETIC_TRIGGER,
	});
	await expect.element(trigger).toBeVisible();
	await expect.element(trigger).toHaveAccessibleName(SYNTHETIC_TRIGGER);
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

// `pressAction` writes its alias. `prominence` gets `Prominence` from presentation branches that
// declare different subsets of it, so the row shows the resolved alias. Both link.
for (const { definitionPattern, typeName } of [
	{ definitionPattern: PRESS_ACTION_DEFINITION_PATTERN, typeName: 'PressAction' },
	{ definitionPattern: PROMINENCE_DEFINITION_PATTERN, typeName: 'Prominence' },
]) {
	test(`the Button guide opens ${typeName} from its generated definitions`, async () => {
		// The Button primitive guide also documents a `ButtonProps` from a `button.tsx`, which fumadocs
		// gives the same table id. Compiling it too checks that each guide keeps its own definitions.
		const { default: ButtonGuide } =
			await import('../../content/docs/components/actions/button.mdx');
		await import('../../content/docs/components/primitives/button.mdx');
		await renderWidget(<ButtonGuide components={GUIDE_COMPONENTS} />);

		const { dialog, trigger } = await openDefinitionWithKeyboard(typeName);
		await expect.element(dialog.getByText(definitionPattern)).toBeVisible();
		await userEvent.keyboard('{Escape}');
		await expect.element(dialog).not.toBeInTheDocument();
		await expect.element(trigger).toHaveFocus();
	});
}

test('the Box guide shows a definition and the values it resolves to', async () => {
	const { default: BoxGuide } = await import('../../content/docs/components/layout/box.mdx');
	await renderWidget(<BoxGuide components={GUIDE_COMPONENTS} />);
	// `elementType` sits in the collapsed Advanced group.
	await userEvent.click(page.getByRole('button', { name: 'Advanced' }));

	const { dialog } = await openDefinitionWithKeyboard('BoxLikeElementType');
	await expect.element(dialog.getByText(BOX_ELEMENT_TYPE_DEFINITION_PATTERN)).toBeVisible();
	await expect.element(dialog.getByText('Which resolves to:')).toBeVisible();
	await expect.element(dialog.getByText(BOX_ELEMENT_TYPE_RESOLVED_PATTERN)).toBeVisible();
});

test('generated definitions load only when a reader reaches a linked type', async () => {
	const fetchSpy = vi.spyOn(globalThis, 'fetch');
	// Requests are cached per asset for the page's lifetime, so this test uses a guide whose asset no
	// other test in this file loads.
	const guide = await import('../../content/docs/components/layout/stack.mdx');
	// The page module keeps processed Markdown, and with it the Markdown type definitions, server-side.
	expect((guide as { _markdown?: unknown })._markdown).toBeUndefined();
	await renderWidget(<guide.default components={GUIDE_COMPONENTS} />);

	const trigger = page.getByRole('button', { exact: true, name: 'RequiredInitialResponsive' });
	await expect.element(trigger).toBeVisible();
	expect(fetchSpy).not.toHaveBeenCalled();

	trigger.element().focus();
	await expect.poll(() => fetchSpy.mock.calls.length).toBe(1);
	// The separately emitted, content-hashed asset that `remarkAttachTypeDefinitions` wrote.
	expect(fetchSpy).toHaveBeenCalledWith(expect.stringMatching(DEFINITIONS_ASSET_PATTERN));
});

test('the Grid guide opens RequiredInitialResponsiveValue from its generated definitions', async () => {
	const { default: GridGuide } = await import('../../content/docs/components/layout/grid.mdx');
	await renderWidget(<GridGuide components={GUIDE_COMPONENTS} />);

	const { dialog, trigger } = await openDefinitionWithKeyboard('RequiredInitialResponsiveValue');
	await expect.element(dialog.getByText(RESPONSIVE_VALUE_DEFINITION_PATTERN)).toBeVisible();
	await userEvent.keyboard('{Escape}');
	await expect.element(dialog).not.toBeInTheDocument();
	await expect.element(trigger).toHaveFocus();
});

test('opens the types a definition names in the same popover and goes back with breadcrumbs', async () => {
	vi.spyOn(globalThis, 'fetch').mockResolvedValue(
		jsonResponse({
			Inner: { definition: [['k', 'type'], ' ', ['t', 'Inner'], ' = ', ['k', 'string'], ';'] },
			Outer: {
				definition: [['k', 'type'], ' ', ['t', 'Outer'], ' = ', ['t', 'Inner', 'Inner'], '[];'],
			},
		}),
	);
	await renderWidget(
		<TypeDefinitionsProvider
			definitionNames={['Inner', 'Outer']}
			definitionsHref="/type-definitions/nested.json"
		>
			<TypeTable
				id="api"
				type={{ value: { type: 'Outer', typeTokens: [['t', 'Outer', 'Outer']] } }}
			/>
		</TypeDefinitionsProvider>,
	);

	const { trigger } = await openDefinitionWithKeyboard('Outer');
	const nested = page.getByRole('dialog').getByRole('button', { exact: true, name: 'Inner' });
	nested.element().focus();
	await userEvent.keyboard('{Enter}');

	// The popover now shows Inner, says so in its name, and takes focus so reading starts there.
	const innerDialog = page.getByRole('dialog', { name: 'Definition of Inner' });
	await expect.element(innerDialog).toHaveFocus();
	await expect.element(innerDialog.getByText(/^type Inner = string;$/)).toBeVisible();
	await expect
		.element(innerDialog.getByRole('link', { name: 'Inner' }))
		.toHaveAttribute('aria-current', 'page');

	await userEvent.click(innerDialog.getByRole('link', { name: 'Outer' }));
	const outerDialog = page.getByRole('dialog', { name: 'Definition of Outer' });
	await expect.element(outerDialog.getByText(/^type Outer = Inner\[\];$/)).toBeVisible();

	await userEvent.keyboard('{Escape}');
	await expect.element(outerDialog).not.toBeInTheDocument();
	await expect.element(trigger).toHaveFocus();
});

test('the Grid guide follows responsive types to the breakpoint names they accept', async () => {
	const { default: GridGuide } = await import('../../content/docs/components/layout/grid.mdx');
	await renderWidget(<GridGuide components={GUIDE_COMPONENTS} />);

	await openDefinitionWithKeyboard('RequiredInitialResponsiveValue');
	await openNamedType('ResponsivePropValue');
	await openNamedType('ResponsiveCondition');

	const dialog = page.getByRole('dialog', { name: 'Definition of ResponsiveCondition' });
	await expect.element(dialog.getByText('Which resolves to:')).toBeVisible();
	await expect.element(dialog.getByText('"bp640"', { exact: true })).toBeVisible();
	await expect.element(dialog.getByText('"initial"', { exact: true })).toBeVisible();
	expect(
		dialog
			.getByRole('link')
			.elements()
			.map((link) => link.textContent),
	).toEqual(['RequiredInitialResponsiveValue', 'ResponsivePropValue', 'ResponsiveCondition']);
});

test('the Grid guide shows every Sprinkles prop a mapped type hides, scrolling on a phone', async () => {
	const { default: GridGuide } = await import('../../content/docs/components/layout/grid.mdx');
	await renderWidget(<GridGuide components={GUIDE_COMPONENTS} />, {
		inlineSize: MOBILE_INLINE_SIZE,
	});

	await openDefinitionWithKeyboard('GridAlignmentProp');
	await openNamedType('SprinklesProps');
	await openNamedType('SprinklesPropsShape');

	const dialog = page.getByRole('dialog', { name: 'Definition of SprinklesPropsShape' });
	await expect.element(dialog.getByText('Which resolves to:')).toBeVisible();
	const shown = visibleText(dialog.element() as HTMLElement);
	expect(shown).toContain('readonly alignContent?: ResponsiveValue<"center"');
	expect(shown).toContain('readonly rowGap?: ResponsiveValue<');

	const popover = dialog.element().parentElement;
	assert(popover, 'expected the popover around the dialog');
	expect(popover.scrollWidth).toBeLessThanOrEqual(popover.clientWidth);
	expect(popover.scrollHeight).toBeGreaterThan(popover.clientHeight);
	assert(container, 'expected a container');
	expect(container.scrollWidth).toBeLessThanOrEqual(container.clientWidth);
});

test('keeps the Box guide token unions on separate lines without widening a mobile viewport', async () => {
	const { default: BoxGuide } = await import('../../content/docs/components/layout/box.mdx');
	await renderWidget(<BoxGuide components={GUIDE_COMPONENTS} />, {
		inlineSize: MOBILE_INLINE_SIZE,
	});

	const row = page.getByRole('rowheader', { name: 'backgroundColor' });
	await expect.element(row).toBeVisible();
	const typeCell = row.element().nextElementSibling;
	assert(typeCell instanceof HTMLElement, 'expected the type cell');
	expect(visibleText(typeCell)).toContain('ResponsiveValue<"accent.solid"\n  | "accent.subtle"');
	assert(container, 'expected a container');
	expect(container.scrollWidth).toBeLessThanOrEqual(container.clientWidth);
});

test('shows resolved values for a type without a source definition', async () => {
	vi.spyOn(globalThis, 'fetch').mockResolvedValue(
		jsonResponse({
			"Spacing['gap']": {
				resolved: [
					['s', '"space.4"'],
					' |\u2060\u00a0',
					['s', '"space.8"'],
					' |\u2060\u00a0',
					['k', 'undefined'],
				],
			},
		}),
	);

	await renderWidget(
		<TypeDefinitionsProvider
			definitionNames={["Spacing['gap']"]}
			definitionsHref="/type-definitions/resolved-only.json"
		>
			<TypeTable
				id="api"
				type={{
					gap: {
						description: 'Space between children.',
						type: "Spacing['gap']",
						typeTokens: [['t', "Spacing['gap']", "Spacing['gap']"]],
					},
				}}
			/>
		</TypeDefinitionsProvider>,
	);

	const { dialog } = await openDefinitionWithKeyboard("Spacing['gap']");
	await expect.element(dialog.getByText('Resolves to:')).toBeVisible();
	await expect
		.element(dialog.getByText('"space.4" |\u2060\u00a0"space.8" |\u2060\u00a0undefined'))
		.toBeVisible();
	expect(dialog.getByText('Definition not available.').elements()).toHaveLength(0);
});

test('keeps a definition popover inside a mobile viewport and scrolls long values', async () => {
	const longResolved = Array.from({ length: 300 }, (_, index): TypeTokens => [
		...(index === 0 ? [] : [1, '|\u2060\u00a0']),
		['s', `"value${index}"`],
	]).flat();
	vi.spyOn(globalThis, 'fetch').mockResolvedValue(
		jsonResponse({
			LongUnion: {
				definition: [['k', 'type'], ' ', ['t', 'LongUnion'], ' = ', ['k', 'keyof'], ' longValues;'],
				resolved: longResolved,
			},
		}),
	);

	await renderWidget(
		<TypeDefinitionsProvider
			definitionNames={['LongUnion']}
			definitionsHref="/type-definitions/long-union.json"
		>
			<TypeTable
				id="api"
				type={{
					value: {
						description: 'A long union.',
						type: 'LongUnion',
						typeTokens: [['t', 'LongUnion', 'LongUnion']],
					},
				}}
			/>
		</TypeDefinitionsProvider>,
		{ inlineSize: MOBILE_INLINE_SIZE },
	);

	const { dialog } = await openDefinitionWithKeyboard('LongUnion');
	await expect.element(dialog.getByText('"value0"', { exact: true })).toBeVisible();
	const popover = dialog.element().parentElement;
	assert(popover, 'expected the popover around the dialog');
	const { left, right } = popover.getBoundingClientRect();
	expect(left).toBeGreaterThanOrEqual(0);
	expect(right).toBeLessThanOrEqual(window.innerWidth);
	// Long values wrap instead of widening the popover, which scrolls when they are taller than it.
	expect(popover.scrollWidth).toBeLessThanOrEqual(popover.clientWidth);
	expect(popover.scrollHeight).toBeGreaterThan(popover.clientHeight);
});

test('falls back to plain text when a type reference has no definition', async () => {
	await renderWidget(
		<TypeTable
			id="api"
			type={{
				value: {
					type: 'Promise<string>',
					typeTokens: [['t', 'Promise', 'Promise'], '<', ['k', 'string'], '>'],
				},
			}}
		/>,
	);

	await expect.element(page.getByText('Promise', { exact: true })).toBeVisible();
	expect(page.getByRole('button').elements()).toHaveLength(0);
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
		name: SYNTHETIC_TRIGGER,
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
		name: SYNTHETIC_TRIGGER,
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
						typeTokens: SYNTHETIC_TOKENS,
					},
					fallback: {
						description: 'Unresolved external.',
						type: 'Promise<string>',
						typeTokens: [['t', 'Promise', 'Promise'], '<', ['k', 'string'], '>'],
					},
				}}
			/>
		</TypeDefinitionsProvider>,
	);

	await expect
		.element(page.getByRole('button', { exact: true, name: SYNTHETIC_TRIGGER }))
		.toBeVisible();
	expect(page.getByRole('button', { name: 'Promise' }).elements()).toHaveLength(0);
	await expect.element(page.getByText('Promise', { exact: true })).toBeVisible();
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
		name: SYNTHETIC_TRIGGER,
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
					typeTokens: SYNTHETIC_TOKENS,
				},
			}}
		/>,
	);

	const trigger = page.getByRole('button', {
		exact: true,
		name: SYNTHETIC_TRIGGER,
	});
	await userEvent.click(trigger.element());
	const dialog = page.getByRole('dialog', {
		name: 'Definition of RequiredInitialResponsiveValue',
	});
	await expect.element(dialog).toBeVisible();
	await expect.element(page.getByText(/type RequiredInitialResponsiveValue/)).toBeVisible();

	// Check the settled popover, not a frame of its fade-in, whose text is still translucent.
	const popover = dialog.element().closest('[data-trigger]');
	assert(popover instanceof HTMLElement, 'expected the popover');
	await Promise.all(popover.getAnimations().map((animation) => animation.finished));

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
		const href = input instanceof Request ? input.url : String(input);
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
		name: SYNTHETIC_TRIGGER,
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
		name: SYNTHETIC_TRIGGER,
	});
	await userEvent.click(trigger.element());
	await expect
		.element(page.getByRole('dialog', { name: 'Definition of RequiredInitialResponsiveValue' }))
		.toBeVisible();
	await expect.element(page.getByText('Invalid type definitions payload')).toBeVisible();
	await expect.element(page.getByRole('button', { exact: true, name: 'Retry' })).toBeVisible();
});

/**
 * Opens a type's popover from its focused trigger with Enter. Each linked type name is its own
 * trigger, named by the type. The first one on the page is used when several rows name the type.
 */
async function openDefinitionWithKeyboard(typeName: string) {
	const trigger = page.getByRole('button', { exact: true, name: typeName }).first();
	await expect.element(trigger).toHaveAccessibleName(typeName);
	trigger.element().focus();
	await userEvent.keyboard('{Enter}');

	const dialog = page.getByRole('dialog', { name: `Definition of ${typeName}` });
	await expect.element(dialog).toBeVisible();
	return { dialog, trigger };
}

/** Opens a type that the open popover's definition names, in the same popover. */
async function openNamedType(typeName: string) {
	await userEvent.click(
		page.getByRole('dialog').getByRole('button', { exact: true, name: typeName }),
	);
	await expect
		.element(page.getByRole('dialog', { name: `Definition of ${typeName}` }))
		.toBeVisible();
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
						typeTokens: SYNTHETIC_TOKENS,
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

/** An element's rendered text, with the characters that keep `|` with its member as a space. */
function visibleText(element: HTMLElement) {
	return element.innerText.replace(OPERATOR_GLUE_PATTERN, ' ');
}

function definitionsResponse(definition = SYNTHETIC_DEFINITION) {
	return jsonResponse({ RequiredInitialResponsiveValue: { definition: [definition] } });
}

function jsonResponse(body: unknown) {
	return new Response(JSON.stringify(body), {
		headers: { 'Content-Type': 'application/json' },
		status: 200,
	});
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
