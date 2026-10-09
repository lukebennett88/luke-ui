import '../../styles/app.css';
import '@luke-ui/react/themes/tactile/stylesheet.css';
import { Prose } from '@luke-ui/react/prose';
import { Provider } from '@luke-ui/react/provider';
import spriteSheetHref from '@luke-ui/react/spritesheet.svg?url&no-inline';
import { themeClassName as tactileThemeClassName } from '@luke-ui/react/themes/tactile';
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
import { CodeBlock } from '../code-block/code-block.js';
import { ComponentPropsTable } from '../component-props-table.js';
import { ExampleBlock } from '../example-block.js';
import { IconGallery } from '../icon-gallery.js';
import { DocsThemeRoot } from '../theme-controls.js';

let container: HTMLElement | undefined;
let root: Root | undefined;

afterEach(() => {
	if (root) act(() => root?.unmount());
	container?.remove();
	container = undefined;
	root = undefined;
});

// Elements Prose gives a block-start margin or list marker. A widget root that opts out must hold
// none of them anywhere below it.
const PROSE_BLOCKS = 'p, ul, ol, li, dl, dt, dd, blockquote, pre, hr, figure, figcaption, table';

function proseLeaks(widget: Element) {
	return [...widget.querySelectorAll(PROSE_BLOCKS)]
		.filter((element) => element.closest('[data-prose-example]') == null)
		.filter((element) => {
			const style = getComputedStyle(element);
			return (
				style.marginBlockStart !== '0px' ||
				(element.matches('ul') && style.listStyleType === 'disc') ||
				(element.matches('ul, ol') && style.paddingInlineStart === '24px')
			);
		})
		.map((element) => element.outerHTML.slice(0, 80));
}

function widgetRoot(selector: string) {
	assert(container, 'expected a container');
	const widget = container.querySelector(selector);
	assert(widget, `expected ${selector}`);
	return widget;
}

test('keeps Prose rhythm off an ExampleBlock and its example', async () => {
	await renderInProse(<ExampleBlock src="track/element" title="Track: Element" />);
	const frame = widgetRoot('.not-prose');

	expect(getComputedStyle(frame).marginBlockStart).toBe('16px');
	expect(frame.querySelectorAll('li')).toHaveLength(2);
	expect(proseLeaks(frame)).toEqual([]);
});

test('lets a Prose example inside an ExampleBlock keep its own rhythm', async () => {
	await renderInProse(<ExampleBlock src="prose/lists" title="Prose: Lists" />);
	const frame = widgetRoot('.not-prose');
	const nestedList = frame.querySelector('ul');
	assert(nestedList, 'expected a list inside the Prose example');

	expect(getComputedStyle(nestedList).listStyleType).toBe('disc');
	expect(getComputedStyle(nestedList).paddingInlineStart).toBe('24px');
	const items = nestedList.querySelectorAll(':scope > li');
	assert(items[1], 'expected a second list item');
	expect(getComputedStyle(items[1]).marginBlockStart).not.toBe('0px');
});

test('keeps Prose rhythm off a CodeBlock', async () => {
	await renderInProse(<CodeBlock code={'const a = 1;\nconst b = 2;'} title="Source" />);
	const figure = widgetRoot('figure');

	expect(getComputedStyle(figure).marginBlockStart).toBe('0px');
	expect(proseLeaks(figure)).toEqual([]);
});

test('keeps Prose rhythm off a component props table', async () => {
	await renderInProse(
		<ComponentPropsTable
			id="props"
			type={{
				isDisabled: { default: 'false', description: 'Disables the control.', type: 'boolean' },
				label: { description: 'Visible label.', type: 'string' },
			}}
		/>,
	);
	const table = widgetRoot('#props');

	expect(table.classList.contains('not-prose')).toBe(true);
	// A row's detail panel renders paragraphs only once it is open.
	const rowTrigger = [...table.querySelectorAll('button')].find((button) =>
		button.textContent?.includes('label'),
	);
	assert(rowTrigger, 'expected the label row trigger');
	await act(async () => {
		rowTrigger.click();
	});
	expect(table.querySelectorAll('p').length).toBeGreaterThan(1);
	expect(proseLeaks(table)).toEqual([]);
});

test('keeps Prose rhythm off the icon gallery', async () => {
	await renderInProse(<IconGallery />);
	const gallery = widgetRoot('.not-prose');

	expect(proseLeaks(gallery)).toEqual([]);
});

test('still applies Prose rhythm to content around the widgets', async () => {
	await renderInProse(
		<>
			<p>First.</p>
			<p data-testid="second">Second.</p>
			<ul data-testid="list">
				<li>One</li>
			</ul>
		</>,
	);

	expect(getComputedStyle(widgetRoot('[data-testid="second"]')).marginBlockStart).toBe('32px');
	expect(getComputedStyle(widgetRoot('[data-testid="list"]')).listStyleType).toBe('disc');
});

async function renderInProse(children: ReactNode) {
	const rootRoute = createRootRoute({
		component: () => (
			<Provider spritesheetHref={spriteSheetHref}>
				<DocsThemeRoot>
					<Prose data-testid="article">
						<p>Lead paragraph.</p>
						{children}
					</Prose>
				</DocsThemeRoot>
			</Provider>
		),
	});
	const router = createRouter({
		history: createMemoryHistory({ initialEntries: ['/'] }),
		routeTree: rootRoute,
	});

	container = document.body.appendChild(document.createElement('div'));
	container.className = `luke-ui-theme ${tactileThemeClassName}`;
	container.style.inlineSize = '800px';
	root = createRoot(container);
	await act(async () => {
		root?.render(<RouterProvider router={router} />);
		await router.load();
	});
	// Example modules load lazily behind Suspense, so keep wrapping the wait in `act`.
	while (container.querySelector('[role="region"][aria-label^="Loading"]') != null) {
		// oxlint-disable-next-line no-await-in-loop
		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 10));
		});
	}
}
