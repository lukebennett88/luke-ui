import '../styles/app.css';
import '@luke-ui/react/themes/paper/stylesheet.css';
import '@luke-ui/react/themes/tactile/stylesheet.css';
import { IconSpritesheetProvider } from '@luke-ui/react/icon';
import spriteSheetHref from '@luke-ui/react/spritesheet.svg?url&no-inline';
import type { ComponentProps, ReactNode } from 'react';
import { act } from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, expect, test, vi } from 'vite-plus/test';
import { cdp, page, userEvent } from 'vite-plus/test/context';
import { StoryWrapper } from '../lib/story-wrapper';
import type { ThemePrefsUpdate } from '../lib/theme-prefs.js';
import { DocsThemeProvider, DocsThemeRoot, ThemeControls } from './theme-controls';

let container: HTMLElement | undefined;
let root: Root | undefined;

afterEach(async () => {
	if (root) act(() => root?.unmount());
	container?.remove();
	container = undefined;
	root = undefined;
	await emulateColorScheme('light');
});

test('server-renders the selected prefs and colour mode', () => {
	const html = renderToString(
		<ThemeTree
			prefs={{ colorModePreference: 'dark', resolvedColorMode: 'dark', themeIdentity: 'paper' }}
		>
			<ThemeControls />
		</ThemeTree>,
	);
	const document = new DOMParser().parseFromString(html, 'text/html');

	expect(document.querySelector('[data-color-mode]')).toHaveAttribute('data-color-mode', 'dark');
	expect(getToggle(document, 'Paper')).toHaveAttribute('aria-checked', 'true');
	expect(getToggle(document, 'Dark theme')).toHaveAttribute('aria-checked', 'true');
});

test('server-renders the client hint colour mode for the system preference', () => {
	const html = renderToString(
		<ThemeTree
			prefs={{ colorModePreference: 'system', resolvedColorMode: 'dark', themeIdentity: 'tactile' }}
		>
			<ThemeControls />
		</ThemeTree>,
	);
	const document = new DOMParser().parseFromString(html, 'text/html');

	expect(document.querySelector('[data-color-mode]')).toHaveAttribute('data-color-mode', 'dark');
	expect(getToggle(document, 'System theme')).toHaveAttribute('aria-checked', 'true');
});

test('updates optimistically and persists each change', async () => {
	const onPrefsChange = vi.fn<(update: ThemePrefsUpdate) => Promise<void>>(
		() => new Promise(() => {}),
	);
	renderTheme(
		<>
			<ThemeControls />
			<StoryWrapper>
				<span>Theme example</span>
			</StoryWrapper>
		</>,
		{ onPrefsChange },
	);

	await userEvent.click(page.getByRole('radio', { name: 'Paper' }), { force: true });

	await expect.element(page.getByRole('radio', { name: 'Paper' })).toBeChecked();
	expect(onPrefsChange).toHaveBeenLastCalledWith({ themeIdentity: 'paper' });

	await userEvent.click(page.getByRole('radio', { name: 'Dark theme' }), { force: true });

	await expect.element(page.getByRole('radio', { name: 'Dark theme' })).toBeChecked();
	expect(getThemeRoot().dataset.colorMode).toBe('dark');
	expect(page.getByRole('radio', { name: 'Paper' })).toBeChecked();
	expect(onPrefsChange).toHaveBeenLastCalledWith({ colorModePreference: 'dark' });
});

test('system colour mode follows the platform preference', async () => {
	await emulateColorScheme('dark');
	renderTheme(<ThemeControls />);

	await expect.poll(() => getThemeRoot().dataset.colorMode).toBe('dark');

	await emulateColorScheme('light');
	await expect.poll(() => getThemeRoot().dataset.colorMode).toBe('light');
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

/** Mirrors `__root.tsx`'s tree: `ThemeControls` consumes the spritesheet through its icons. */
function ThemeTree({ children, ...props }: ComponentProps<typeof DocsThemeProvider>) {
	return (
		<DocsThemeProvider {...props}>
			<IconSpritesheetProvider href={spriteSheetHref}>
				<DocsThemeRoot>{children}</DocsThemeRoot>
			</IconSpritesheetProvider>
		</DocsThemeProvider>
	);
}

function renderTheme(
	children: ReactNode,
	props: Omit<ComponentProps<typeof DocsThemeProvider>, 'children'> = {},
) {
	container = document.body.appendChild(document.createElement('div'));
	root = createRoot(container);
	act(() => {
		root?.render(<ThemeTree {...props}>{children}</ThemeTree>);
	});
}

function getThemeRoot() {
	const themeRoot = container?.querySelector<HTMLElement>('[data-color-mode]');
	if (!themeRoot) throw new Error('Expected a Luke UI theme root');

	return themeRoot;
}

function getToggle(document: Document, name: string) {
	const toggle = [...document.querySelectorAll('[role="radio"]')].find(
		(element) => element.textContent === name || element.getAttribute('aria-label') === name,
	);
	if (!toggle) throw new Error(`Expected a ${name} toggle`);

	return toggle;
}

async function emulateColorScheme(mode: 'light' | 'dark') {
	await cdp().send('Emulation.setEmulatedMedia', {
		features: [{ name: 'prefers-color-scheme', value: mode }],
	});
}
