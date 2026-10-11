import '../styles/app.css';
import '@luke-ui/theme-paper/stylesheet.css';
import '@luke-ui/theme-tactile/stylesheet.css';
import { Provider } from '@luke-ui/react/provider';
import spriteSheetHref from '@luke-ui/react/spritesheet.svg?url&no-inline';
import { themeClassName as paperThemeClassName } from '@luke-ui/theme-paper';
import { themeClassName as tactileThemeClassName } from '@luke-ui/theme-tactile';
import type { ReactNode } from 'react';
import { act } from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, test, vi } from 'vite-plus/test';
import { cdp, page, userEvent } from 'vite-plus/test/context';
import themePrefsScript from '../generated/theme-prefs-script.iife.js?raw';
import { StoryWrapper } from '../lib/story-wrapper';
import {
	COLOR_MODE_STORAGE_KEY,
	subscribeToThemePrefs,
	THEME_IDENTITY_STORAGE_KEY,
} from '../lib/theme-prefs.js';
import { DocsThemeRoot, ThemeControls } from './theme-controls';

let container: HTMLElement | undefined;
let root: Root | undefined;

afterEach(async () => {
	if (root) act(() => root?.unmount());
	container?.remove();
	localStorage.clear();
	document.documentElement.removeAttribute('class');
	document.documentElement.removeAttribute('data-color-mode');
	document.documentElement.removeAttribute('style');
	container = undefined;
	root = undefined;
	await emulateColorScheme('light');
});

test('stores each choice and applies it to the document', async () => {
	renderTheme(<ThemeControls />);

	await userEvent.click(page.getByRole('radio', { name: 'Paper' }), { force: true });

	await expect.element(page.getByRole('radio', { name: 'Paper' })).toBeChecked();
	expect(localStorage.getItem(THEME_IDENTITY_STORAGE_KEY)).toBe('paper');
	expect(document.documentElement).toHaveClass(paperThemeClassName);
	expect(document.documentElement).not.toHaveClass(tactileThemeClassName);

	await userEvent.click(page.getByRole('radio', { name: 'Dark theme' }), { force: true });

	await expect.element(page.getByRole('radio', { name: 'Dark theme' })).toBeChecked();
	expect(localStorage.getItem(COLOR_MODE_STORAGE_KEY)).toBe('dark');
	expect(document.documentElement).toHaveAttribute('data-color-mode', 'dark');
	expect(document.documentElement).toHaveClass('dark');
	expect(document.documentElement).not.toHaveClass('light');
	expect(document.documentElement).toHaveClass(paperThemeClassName);
});

test('follows a change stored by another tab', async () => {
	renderTheme(<ThemeControls />);

	localStorage.setItem(THEME_IDENTITY_STORAGE_KEY, 'paper');
	localStorage.setItem(COLOR_MODE_STORAGE_KEY, 'dark');
	act(() => {
		window.dispatchEvent(new StorageEvent('storage', { key: COLOR_MODE_STORAGE_KEY }));
	});

	await expect.element(page.getByRole('radio', { name: 'Paper' })).toBeChecked();
	await expect.element(page.getByRole('radio', { name: 'Dark theme' })).toBeChecked();
	expect(document.documentElement).toHaveClass(paperThemeClassName);
	expect(document.documentElement).toHaveAttribute('data-color-mode', 'dark');
});

test('system colour mode leaves the mode to the theme CSS and follows the platform preference', async () => {
	await emulateColorScheme('dark');
	renderTheme(<ThemeControls />);
	await userEvent.click(page.getByRole('radio', { name: 'Dark theme' }), { force: true });
	expect(document.documentElement).toHaveAttribute('data-color-mode', 'dark');

	await userEvent.click(page.getByRole('radio', { name: 'System theme' }), { force: true });

	await expect.poll(() => document.documentElement.hasAttribute('data-color-mode')).toBe(false);
	expect(document.documentElement).toHaveClass('dark');
	expect(document.documentElement.style.colorScheme).toBe('');
	expect(getComputedStyle(document.documentElement).colorScheme).toBe('dark');

	await emulateColorScheme('light');
	await expect.poll(() => document.documentElement.classList.contains('light')).toBe(true);
	expect(document.documentElement).not.toHaveAttribute('data-color-mode');
	expect(getComputedStyle(document.documentElement).colorScheme).toBe('light');
});

test('leaves full-bleed story surfaces unframed', () => {
	renderTheme(
		<StoryWrapper layout="full-bleed">
			<span>Full-bleed example content</span>
		</StoryWrapper>,
	);

	const exampleContent = page.getByText('Full-bleed example content').element();
	const storyRoot = exampleContent.parentElement;
	if (!storyRoot) throw new Error('Expected a full-bleed story root');

	expect(getComputedStyle(storyRoot).padding).toBe('0px');
});

test('the head script applies stored prefs before body scripts run', async () => {
	localStorage.setItem(THEME_IDENTITY_STORAGE_KEY, 'paper');
	localStorage.setItem(COLOR_MODE_STORAGE_KEY, 'dark');

	const html = await loadHeadScriptDocument();

	expect(html).toHaveClass(paperThemeClassName, 'dark');
	expect(html).toHaveAttribute('data-color-mode', 'dark');
	expect(html).toHaveAttribute('data-mode-at-body', 'dark');
	expect(html.style.colorScheme).toBe('');
});

test('the head script leaves the system preference to the theme CSS', async () => {
	await emulateColorScheme('dark');

	const html = await loadHeadScriptDocument();

	expect(html).toHaveClass(tactileThemeClassName, 'dark');
	expect(html).not.toHaveAttribute('data-color-mode');
	expect(html).toHaveAttribute('data-mode-at-body', 'none');
});

test('the head script still applies prefs when localStorage throws', async () => {
	await emulateColorScheme('dark');

	const html = await loadHeadScriptDocument({ throwOnGetItem: true });

	expect(html).toHaveClass(tactileThemeClassName, 'dark');
	expect(html).not.toHaveAttribute('data-color-mode');
	expect(html.style.colorScheme).toBe('');
});

test('subscribeToThemePrefs removes the change listener from the same query it added it to', () => {
	const addEventListener = vi.spyOn(MediaQueryList.prototype, 'addEventListener');
	const removeEventListener = vi.spyOn(MediaQueryList.prototype, 'removeEventListener');

	const unsubscribe = subscribeToThemePrefs(() => {});
	const query = addEventListener.mock.instances[0];
	unsubscribe();

	expect(removeEventListener.mock.instances[0]).toBe(query);

	addEventListener.mockRestore();
	removeEventListener.mockRestore();
});

function renderTheme(children: ReactNode) {
	container = document.body.appendChild(document.createElement('div'));
	root = createRoot(container);

	act(() => {
		root?.render(
			// Mirrors `__root.tsx`: `ThemeControls` consumes the spritesheet through its icons.
			<Provider spritesheetHref={spriteSheetHref}>
				<DocsThemeRoot>{children}</DocsThemeRoot>
			</Provider>,
		);
	});
}

async function loadHeadScriptDocument(options?: { throwOnGetItem?: boolean }) {
	const iframe = document.body.appendChild(document.createElement('iframe'));
	const throwOnGetItemScript = options?.throwOnGetItem
		? `<script>Storage.prototype.getItem = function () { throw new Error('denied'); };</script>`
		: '';
	iframe.srcdoc = `<!doctype html><html><head>${throwOnGetItemScript}<script>${themePrefsScript}</script></head><body><script>document.documentElement.dataset.modeAtBody = document.documentElement.dataset.colorMode ?? 'none';</script></body></html>`;
	await new Promise<void>((resolve) => {
		iframe.addEventListener('load', () => resolve(), { once: true });
	});
	const html = iframe.contentDocument?.documentElement;
	if (!html) throw new Error('Expected the iframe document');
	// Importing a shallow copy keeps the element matchers working across frames.
	const snapshot = document.importNode(html);
	iframe.remove();
	return snapshot;
}

async function emulateColorScheme(mode: 'light' | 'dark') {
	await cdp().send('Emulation.setEmulatedMedia', {
		features: [{ name: 'prefers-color-scheme', value: mode }],
	});
}
