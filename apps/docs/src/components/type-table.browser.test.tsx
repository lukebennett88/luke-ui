import '../styles/app.css';
import '@luke-ui/theme-tactile/stylesheet.css';
import { Provider } from '@luke-ui/react/provider';
import spriteSheetHref from '@luke-ui/react/spritesheet.svg?url&no-inline';
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
	window.history.replaceState(null, '', ' ');
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
	window.history.replaceState(null, '', '#api-label');
	await renderTable(
		<TypeTable
			id="api"
			type={{
				label: { description: 'From hash.', type: 'string' },
			}}
		/>,
	);

	await expect.element(page.getByText('From hash.')).toBeVisible();
});

async function renderTable(children: ReactNode) {
	container = document.body.appendChild(document.createElement('div'));
	container.style.inlineSize = '800px';
	root = createRoot(container);
	await act(async () => {
		root?.render(
			<Provider spritesheetHref={spriteSheetHref}>
				<DocsThemeRoot>{children}</DocsThemeRoot>
			</Provider>,
		);
	});
}
