import '../styles/app.css';
import '@luke-ui/theme-paper/stylesheet.css';
import '@luke-ui/theme-tactile/stylesheet.css';
import { Provider } from '@luke-ui/react/provider';
import spriteSheetHref from '@luke-ui/react/spritesheet.svg?url&no-inline';
import axe from 'axe-core';
import { act } from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, test, vi } from 'vite-plus/test';
import { cdp, page, userEvent } from 'vite-plus/test/context';
import { writeThemePrefs } from '../lib/theme-prefs.js';
import { tokenRowId } from '../lib/token-navigation.js';
import { ColorFamily } from './color-tokens.js';
import { DocsThemeRoot } from './theme-controls.js';
import { TypeStyleTable } from './typography-tokens.js';

let container: HTMLElement | undefined;
let root: Root | undefined;

afterEach(async () => {
	if (root) act(() => root?.unmount());
	container?.remove();
	container = undefined;
	root = undefined;
	localStorage.clear();
	document.documentElement.removeAttribute('class');
	document.documentElement.removeAttribute('data-color-mode');
	document.documentElement.removeAttribute('style');
	vi.restoreAllMocks();
	await emulateColorScheme('light');
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

test('a colour row copies its CSS custom property without moving focus', async () => {
	const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
	await renderReference();
	const button = page.getByRole('button', {
		name: 'Copy CSS --luke-color-background-neutral-subtle-rest',
	});
	await act(async () => {
		await userEvent.click(button);
	});
	expect(writeText).toHaveBeenCalledWith('--luke-color-background-neutral-subtle-rest');
	expect(document.activeElement).toBe(button.element());
	expect(
		page.getByText('Copied --luke-color-background-neutral-subtle-rest').element(),
	).toBeTruthy();
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

test('a typography token copies its CSS custom property', async () => {
	const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
	await renderReference();
	await act(async () => {
		await userEvent.click(
			page.getByRole('button', { name: 'Copy CSS --luke-font-caption-font-size' }),
		);
	});
	expect(writeText).toHaveBeenCalledWith('--luke-font-caption-font-size');
});

test('a colour row resolved value follows colour mode and theme identity', async () => {
	await renderReference();
	const row = tokenRow('color.background.neutral.subtle.rest');

	act(() => {
		writeThemePrefs({ colorModePreference: 'light', themeIdentity: 'tactile' });
	});
	const lightTactile = await resolvedValueText(row);
	expect(lightTactile).not.toBe('—');

	act(() => {
		writeThemePrefs({ colorModePreference: 'dark' });
	});
	await expect.poll(() => resolvedValueText(row)).not.toBe(lightTactile);
	const darkTactile = await resolvedValueText(row);

	act(() => {
		writeThemePrefs({ themeIdentity: 'paper' });
	});
	await expect.poll(() => resolvedValueText(row)).not.toBe(darkTactile);
});

test('a colour row resolved value follows a system colour scheme change', async () => {
	await emulateColorScheme('light');
	await renderReference();
	const row = tokenRow('color.background.neutral.subtle.rest');

	act(() => {
		writeThemePrefs({ colorModePreference: 'system', themeIdentity: 'tactile' });
	});
	const systemLight = await resolvedValueText(row);
	expect(systemLight).not.toBe('—');

	await emulateColorScheme('dark');
	await expect.poll(() => resolvedValueText(row)).not.toBe(systemLight);
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

function tokenRow(path: string) {
	const row = document.getElementById(tokenRowId(path));
	if (!row) throw new Error(`Expected a token row for ${path}`);
	return row;
}

async function resolvedValueText(row: HTMLElement) {
	await expect.poll(() => rowValueText(row)).not.toBe('');
	return rowValueText(row);
}

/** The resolved-value region is the third grid child of a `TokenRow`. */
function rowValueText(row: HTMLElement) {
	const valueRegion = row.children.item(2);
	return valueRegion?.textContent?.trim() ?? '';
}

async function emulateColorScheme(mode: 'light' | 'dark') {
	await cdp().send('Emulation.setEmulatedMedia', {
		features: [{ name: 'prefers-color-scheme', value: mode }],
	});
}
