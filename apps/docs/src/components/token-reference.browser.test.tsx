import '../styles/app.css';
import '@luke-ui/theme-tactile/stylesheet.css';
import { Provider } from '@luke-ui/react/provider';
import spriteSheetHref from '@luke-ui/react/spritesheet.svg?url&no-inline';
import axe from 'axe-core';
import { act } from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, test, vi } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/context';
import { ColorFamily } from './color-tokens.js';
import { DocsThemeRoot } from './theme-controls.js';
import { TypeStyleTable } from './typography-tokens.js';

let container: HTMLElement | undefined;
let root: Root | undefined;

afterEach(() => {
	if (root) act(() => root?.unmount());
	container?.remove();
	container = undefined;
	root = undefined;
	vi.restoreAllMocks();
});

test('a colour row copies its full typed path', async () => {
	const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
	await renderReference();
	await act(async () => {
		await userEvent.click(
			page.getByRole('button', { name: 'Copy vars.color.background.neutral.subtle.rest' }),
		);
	});
	expect(writeText).toHaveBeenCalledWith('vars.color.background.neutral.subtle.rest');
	await expect.element(page.getByText('--luke-color-background-neutral-subtle-rest')).toBeVisible();
});

test('a typography token copies its typed path', async () => {
	const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
	await renderReference();
	await act(async () => {
		await userEvent.click(page.getByRole('button', { name: 'Copy vars.font.caption.fontSize' }));
	});
	expect(writeText).toHaveBeenCalledWith('vars.font.caption.fontSize');
	await expect.element(page.getByText('--luke-font-caption-font-size')).toBeVisible();
});

test('the token reference tables have no axe violations', async () => {
	await renderReference();
	const results = await axe.run(container!);
	expect(
		results.violations.map((violation) => ({
			id: violation.id,
			nodes: violation.nodes.map((node) => node.html),
		})),
	).toEqual([]);
});

async function renderReference() {
	container = document.body.appendChild(document.createElement('div'));
	container.style.inlineSize = '1100px';
	root = createRoot(container);
	await act(async () => {
		root?.render(
			<Provider spritesheetHref={spriteSheetHref}>
				<DocsThemeRoot>
					<ColorFamily family="background" />
					<ColorFamily family="border" />
					<TypeStyleTable />
				</DocsThemeRoot>
			</Provider>,
		);
	});
}
