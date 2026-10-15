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
import { RoleColors } from './role-colors.js';
import { DocsThemeRoot } from './theme-controls.js';
import { TokenFind } from './token-find.js';
import { TypeStyleTable } from './typography-tokens.js';

let container: HTMLElement | undefined;
let root: Root | undefined;
let screenWidthDescriptor: PropertyDescriptor | undefined;
let initialHash: string;

afterEach(() => {
	if (root) act(() => root?.unmount());
	container?.remove();
	container = undefined;
	root = undefined;
	if (screenWidthDescriptor) Object.defineProperty(window.screen, 'width', screenWidthDescriptor);
	else delete (window.screen as { width?: number }).width;
	window.history.replaceState(null, '', `${location.pathname}${location.search}${initialHash}`);
	vi.restoreAllMocks();
});

test('a role row copies its full typed path', async () => {
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

test('a typography token copies its typed path and appears in Find', async () => {
	const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
	await renderReference();
	await act(async () => {
		await userEvent.click(page.getByRole('button', { name: 'Copy vars.font.caption.fontSize' }));
	});
	expect(writeText).toHaveBeenCalledWith('vars.font.caption.fontSize');
	await expect.element(page.getByText('--luke-font-caption-font-size')).toBeVisible();
	await act(async () => {
		await userEvent.type(
			page.getByRole('combobox', { name: 'Find a token' }),
			'vars.font.caption.fontSize',
		);
	});
	await expect
		.element(page.getByRole('option', { name: 'vars.font.caption.fontSize' }))
		.toBeVisible();
});

for (const query of [
	'vars.color.border.neutral',
	'var(--luke-color-border-neutral)',
	'--luke-color-border-neutral',
]) {
	test(`Find resolves ${query} without jumping while editing`, async () => {
		await renderReference();
		const field = page.getByRole('combobox', { name: 'Find a token' });
		await act(async () => {
			await userEvent.type(field, query);
		});
		await expect
			.element(page.getByRole('option', { name: 'vars.color.border.neutral' }))
			.toBeVisible();
		expect(window.location.hash).toBe(initialHash);
		await act(async () => {
			await userEvent.clear(field);
		});
		expect(window.location.hash).toBe(initialHash);
	});
}

test('Find keyboard selection jumps to the matching row', async () => {
	await renderReference();
	const field = page.getByRole('combobox', { name: 'Find a token' });
	await act(async () => {
		await userEvent.type(field, 'vars.color.border.neutral');
	});
	expect(window.location.hash).toBe(initialHash);
	await act(async () => {
		await userEvent.keyboard('{ArrowDown}{Enter}');
	});
	expect(window.location.hash).toBe('#token-color-border-neutral');
	expect(document.getElementById('token-color-border-neutral')).not.toBeNull();
});

test('Find selects a CSS variable from the mobile tray and jumps to its row', async () => {
	await renderReference(390);
	await act(async () => {
		await userEvent.click(page.getByRole('button', { name: /^Find a token/ }));
	});
	await expect.element(page.getByRole('dialog', { name: 'Find a token' })).toBeVisible();
	await act(async () => {
		await userEvent.type(
			page.getByRole('searchbox', { name: 'Find a token' }),
			'var(--luke-color-border-neutral)',
		);
	});
	await act(async () => {
		await userEvent.click(page.getByRole('option', { name: 'vars.color.border.neutral' }));
	});
	expect(window.location.hash).toBe('#token-color-border-neutral');
	await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
});

test('the token reference tables and Find have no axe violations', async () => {
	await renderReference();
	const results = await axe.run(container!);
	expect(
		results.violations.map((violation) => ({
			id: violation.id,
			nodes: violation.nodes.map((node) => node.html),
		})),
	).toEqual([]);
});

async function renderReference(screenWidth = 1024) {
	initialHash = window.location.hash;
	screenWidthDescriptor = Object.getOwnPropertyDescriptor(window.screen, 'width');
	Object.defineProperty(window.screen, 'width', { configurable: true, value: screenWidth });
	container = document.body.appendChild(document.createElement('div'));
	container.style.inlineSize = '1100px';
	root = createRoot(container);
	await act(async () => {
		root?.render(
			<Provider spritesheetHref={spriteSheetHref}>
				<DocsThemeRoot>
					<TokenFind />
					<RoleColors colorRole="neutral" />
					<TypeStyleTable />
				</DocsThemeRoot>
			</Provider>,
		);
	});
}
