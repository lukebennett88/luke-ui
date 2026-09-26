import '../styles/app.css';
import '@luke-ui/react/themes/paper/stylesheet.css';
import '@luke-ui/react/themes/tactile/stylesheet.css';
import { IconSpritesheetProvider } from '@luke-ui/react/icon';
import spriteSheetHref from '@luke-ui/react/spritesheet.svg?url&no-inline';
import { themeClassName as paperThemeClassName } from '@luke-ui/react/themes/paper';
import { themeClassName as tactileThemeClassName } from '@luke-ui/react/themes/tactile';
import type { ReactNode } from 'react';
import { act } from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, test } from 'vite-plus/test';
import { cdp, page, userEvent } from 'vite-plus/test/context';
import { StoryWrapper } from '../lib/story-wrapper';
import {
	COLOR_MODE_STORAGE_KEY,
	THEME_IDENTITY_STORAGE_KEY,
	themePrefsScript,
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

test('system colour mode follows the platform preference', async () => {
	await emulateColorScheme('dark');
	renderTheme(<ThemeControls />);

	await userEvent.click(page.getByRole('radio', { name: 'System theme' }), { force: true });

	await expect.poll(() => document.documentElement.dataset.colorMode).toBe('dark');
	expect(document.documentElement).toHaveClass('dark');

	await emulateColorScheme('light');
	await expect.poll(() => document.documentElement.dataset.colorMode).toBe('light');
	expect(document.documentElement).toHaveClass('light');
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
	expect(html.style.colorScheme).toBe('dark');
});

test('the head script resolves the system preference', async () => {
	await emulateColorScheme('dark');

	const html = await loadHeadScriptDocument();

	expect(html).toHaveClass(tactileThemeClassName, 'dark');
	expect(html).toHaveAttribute('data-mode-at-body', 'dark');
});

function renderTheme(children: ReactNode) {
	container = document.body.appendChild(document.createElement('div'));
	root = createRoot(container);

	act(() => {
		root?.render(
			// Mirrors `__root.tsx`: `ThemeControls` consumes the spritesheet through its icons.
			<IconSpritesheetProvider href={spriteSheetHref}>
				<DocsThemeRoot>{children}</DocsThemeRoot>
			</IconSpritesheetProvider>,
		);
	});
}

async function loadHeadScriptDocument() {
	const iframe = document.body.appendChild(document.createElement('iframe'));
	iframe.srcdoc = `<!doctype html><html><head><script>${themePrefsScript}</script></head><body><script>document.documentElement.dataset.modeAtBody = document.documentElement.dataset.colorMode;</script></body></html>`;
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
