import '../styles/app.css';
import '@luke-ui/react/themes/paper/stylesheet.css';
import '@luke-ui/react/themes/tactile/stylesheet.css';
import { IconSpritesheetProvider } from '@luke-ui/react/icon';
import spriteSheetHref from '@luke-ui/react/spritesheet.svg?url&no-inline';
import { themeClassName as paperThemeClassName } from '@luke-ui/react/themes/paper';
import { ThemeProvider } from 'next-themes';
import type { ComponentProps, ReactNode } from 'react';
import { act } from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, expect, test } from 'vite-plus/test';
import { cdp, page, userEvent } from 'vite-plus/test/context';
import themePrefsBootstrapScript from '../generated/theme-prefs-bootstrap-script.iife.js?raw';
import { StoryWrapper } from '../lib/story-wrapper';
import {
	COLOR_MODE_COOKIE_NAME,
	COLOR_MODE_STORAGE_KEY,
	THEME_IDENTITY_COOKIE_NAME,
} from '../lib/theme-prefs.js';
import { DocsThemeRoot, ThemeControls } from './theme-controls';

let container: HTMLElement | undefined;
let root: Root | undefined;

afterEach(async () => {
	if (root) act(() => root?.unmount());
	container?.remove();
	clearThemePrefs();
	document.documentElement.removeAttribute('class');
	container = undefined;
	root = undefined;
	await emulateColorScheme('light');
});

test('persists theme identity and colour mode independently', async () => {
	renderTheme(
		<>
			<ThemeControls />
			<StoryWrapper>
				<span>Theme example</span>
			</StoryWrapper>
		</>,
	);

	const paperProfile = page.getByRole('radio', { name: 'Paper' });
	const darkMode = page.getByRole('radio', { name: 'Dark theme' });
	const themeRoot = getThemeRoot();

	await userEvent.click(paperProfile, { force: true });

	expect(paperProfile).toBeChecked();
	expect(document.documentElement).toHaveClass(paperThemeClassName);
	expect(themeRoot.dataset.colorMode).toBe('light');
	expect(readCookie(THEME_IDENTITY_COOKIE_NAME)).toBe('paper');
	expect(localStorage.getItem(THEME_IDENTITY_COOKIE_NAME)).toBe('paper');

	await userEvent.click(darkMode, { force: true });

	await expect.poll(() => getThemeRoot().dataset.colorMode).toBe('dark');
	expect(document.documentElement).toHaveClass(paperThemeClassName);
	expect(readCookie(COLOR_MODE_COOKIE_NAME)).toBe('dark');
	expect(localStorage.getItem(COLOR_MODE_STORAGE_KEY)).toBe('dark');

	unmountTheme();
	renderTheme(<ThemeControls />, {
		initialPrefs: { colorMode: 'dark', themeIdentity: 'paper' },
	});

	expect(page.getByRole('radio', { name: 'Paper' })).toBeChecked();
	expect(page.getByRole('radio', { name: 'Dark theme' })).toBeChecked();
	expect(document.documentElement).toHaveClass(paperThemeClassName);
	await expect.poll(() => getThemeRoot().dataset.colorMode).toBe('dark');
});

test('system colour mode follows the platform preference and drives the docs chrome', async () => {
	await emulateColorScheme('dark');
	renderTheme(<ThemeControls />, {
		defaultTheme: 'system',
		enableSystem: true,
		initialPrefs: { colorMode: 'system', themeIdentity: 'tactile' },
	});

	await userEvent.click(page.getByRole('radio', { name: 'System theme' }), { force: true });

	await expect.poll(() => getThemeRoot().dataset.colorMode).toBe('dark');
	expect(document.documentElement).toHaveClass('dark');

	await emulateColorScheme('light');
	await expect.poll(() => getThemeRoot().dataset.colorMode).toBe('light');
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

test('boots the stored colour mode before the themed root hydrates', async () => {
	localStorage.setItem(COLOR_MODE_STORAGE_KEY, 'dark');
	const bootstrap = renderToString(
		<ThemeProvider
			attribute={['class', 'data-color-mode']}
			defaultTheme="light"
			enableSystem={false}
		>
			<span>Server content</span>
		</ThemeProvider>,
	);
	const iframe = document.body.appendChild(document.createElement('iframe'));
	iframe.srcdoc = `<!doctype html><html><body>${bootstrap}<script>document.documentElement.dataset.modeAtHydration = document.documentElement.dataset.colorMode;</script></body></html>`;
	await new Promise<void>((resolve) => {
		iframe.addEventListener('load', () => resolve(), { once: true });
	});

	expect(iframe.contentDocument?.documentElement).toHaveAttribute('data-color-mode', 'dark');
	expect(iframe.contentDocument?.documentElement).toHaveAttribute('data-mode-at-hydration', 'dark');
	iframe.remove();
});

test('boots the theme identity from the preference cookie before paint', async () => {
	const iframe = document.body.appendChild(document.createElement('iframe'));
	iframe.srcdoc = `<!doctype html><html><head><script>document.cookie=${JSON.stringify(`${THEME_IDENTITY_COOKIE_NAME}=paper; Path=/`)};</script><script>${themePrefsBootstrapScript}</script></head><body><script>document.documentElement.dataset.identityAtHydration = document.documentElement.classList.contains('${paperThemeClassName}') ? 'paper' : 'other';</script></body></html>`;
	await new Promise<void>((resolve) => {
		iframe.addEventListener('load', () => resolve(), { once: true });
	});

	expect(iframe.contentDocument?.documentElement).toHaveClass(paperThemeClassName);
	expect(iframe.contentDocument?.documentElement).toHaveAttribute(
		'data-identity-at-hydration',
		'paper',
	);
	iframe.remove();
});

test('SSR selects Paper and dark colour mode from server prefs', () => {
	const html = renderToString(
		<ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
			<IconSpritesheetProvider href={spriteSheetHref}>
				<DocsThemeRoot initialPrefs={{ colorMode: 'dark', themeIdentity: 'paper' }}>
					<ThemeControls />
				</DocsThemeRoot>
			</IconSpritesheetProvider>
		</ThemeProvider>,
	);

	expect(html).toMatch(/aria-checked="true"[^>]*>Paper<|>Paper<\/button[^>]*aria-checked="true"/);
	expect(html).toMatch(
		/aria-checked="true"[^>]*aria-label="Dark theme"|aria-label="Dark theme"[^>]*aria-checked="true"/,
	);
	expect(html).toContain('data-color-mode="dark"');
});

test('syncs theme identity from another tab via the storage event', async () => {
	renderTheme(<ThemeControls />, {
		initialPrefs: { colorMode: 'light', themeIdentity: 'paper' },
	});

	expect(page.getByRole('radio', { name: 'Paper' })).toBeChecked();

	act(() => {
		localStorage.setItem(THEME_IDENTITY_COOKIE_NAME, 'tactile');
		window.dispatchEvent(
			new StorageEvent('storage', {
				key: THEME_IDENTITY_COOKIE_NAME,
				newValue: 'tactile',
				oldValue: 'paper',
				storageArea: localStorage,
			}),
		);
	});

	expect(page.getByRole('radio', { name: 'Tactile' })).toBeChecked();
	expect(document.documentElement).not.toHaveClass(paperThemeClassName);
	expect(readCookie(THEME_IDENTITY_COOKIE_NAME)).toBe('tactile');
});

test('does not reload when a migrated preference cookie fails to persist', async () => {
	const iframe = document.body.appendChild(document.createElement('iframe'));
	iframe.srcdoc = `<!doctype html><html><head><script>
localStorage.setItem(${JSON.stringify(THEME_IDENTITY_COOKIE_NAME)}, 'paper');
localStorage.setItem(${JSON.stringify(COLOR_MODE_STORAGE_KEY)}, 'dark');
var reloadCount = 0;
Object.defineProperty(location, 'reload', { configurable: true, value: function () { reloadCount += 1; } });
Object.defineProperty(document, 'cookie', {
	configurable: true,
	get: function () { return ''; },
	set: function () {},
});
</script><script>${themePrefsBootstrapScript}</script></head><body><script>
document.documentElement.dataset.reloadCount = String(reloadCount);
</script></body></html>`;
	await new Promise<void>((resolve) => {
		iframe.addEventListener('load', () => resolve(), { once: true });
	});

	expect(iframe.contentDocument?.documentElement).toHaveAttribute('data-reload-count', '0');
	iframe.remove();
});

function renderTheme(
	children: ReactNode,
	options: Pick<ComponentProps<typeof ThemeProvider>, 'defaultTheme' | 'enableSystem'> & {
		initialPrefs?: ComponentProps<typeof DocsThemeRoot>['initialPrefs'];
	} = {},
) {
	container = document.body.appendChild(document.createElement('div'));
	root = createRoot(container);

	const initialPrefs = options.initialPrefs;
	if (initialPrefs) {
		document.cookie = `${THEME_IDENTITY_COOKIE_NAME}=${initialPrefs.themeIdentity}; Path=/; SameSite=Lax`;
		document.cookie = `${COLOR_MODE_COOKIE_NAME}=${initialPrefs.colorMode}; Path=/; SameSite=Lax`;
		localStorage.setItem(THEME_IDENTITY_COOKIE_NAME, initialPrefs.themeIdentity);
		localStorage.setItem(COLOR_MODE_STORAGE_KEY, initialPrefs.colorMode);
	}

	act(() => {
		root?.render(
			<ThemeProvider
				attribute="class"
				defaultTheme={options.defaultTheme ?? initialPrefs?.colorMode ?? 'light'}
				enableSystem={options.enableSystem ?? false}
			>
				{/* Mirrors `__root.tsx`'s real tree shape: `IconSpritesheetProvider` wraps
				`DocsThemeRoot` there too, and `ThemeControls` (rendered by these tests) consumes it
				through `ColorModeToggle`'s icons. */}
				<IconSpritesheetProvider href={spriteSheetHref}>
					<DocsThemeRoot initialPrefs={initialPrefs}>{children}</DocsThemeRoot>
				</IconSpritesheetProvider>
			</ThemeProvider>,
		);
	});
}

function unmountTheme() {
	act(() => root?.unmount());
	container?.remove();
	container = undefined;
	root = undefined;
}

function getThemeRoot() {
	const themeRoot = container?.querySelector<HTMLElement>('[data-color-mode]');
	if (!themeRoot) throw new Error('Expected a Luke UI theme root');

	return themeRoot;
}

function readCookie(name: string) {
	const prefix = `${name}=`;
	for (const part of document.cookie.split('; ')) {
		if (part.startsWith(prefix)) return part.slice(prefix.length);
	}
	return undefined;
}

function clearThemePrefs() {
	for (const name of [THEME_IDENTITY_COOKIE_NAME, COLOR_MODE_COOKIE_NAME]) {
		document.cookie = `${name}=; Path=/; Max-Age=0`;
	}
	localStorage.clear();
}

async function emulateColorScheme(mode: 'light' | 'dark') {
	await cdp().send('Emulation.setEmulatedMedia', {
		features: [{ name: 'prefers-color-scheme', value: mode }],
	});
}
