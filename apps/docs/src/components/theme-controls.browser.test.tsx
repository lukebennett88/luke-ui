import '../styles/app.css';
import '@luke-ui/react/themes/paper.css';
import '@luke-ui/react/themes/tactile.css';
import { IconSpritesheetProvider } from '@luke-ui/react/icon';
import spriteSheetHref from '@luke-ui/react/spritesheet.svg?url&no-inline';
import { paperThemeClassName } from '@luke-ui/react/themes';
import { ThemeProvider } from 'next-themes';
import { act } from 'react';
import type { ComponentProps, ReactNode } from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, expect, test } from 'vite-plus/test';
import { cdp, page, userEvent } from 'vite-plus/test/context';
import { StoryWrapper } from '../lib/story-wrapper';
import { DocsThemeRoot, ThemeControls } from './theme-controls';

let container: HTMLElement | undefined;
let root: Root | undefined;

afterEach(async () => {
	if (root) act(() => root?.unmount());
	container?.remove();
	localStorage.clear();
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

	const profile = page.getByRole('combobox', { name: 'Theme profile' });
	const darkMode = page.getByRole('radio', { name: 'Dark theme' });
	const themeRoot = getThemeRoot();

	await userEvent.selectOptions(profile, 'paper');

	expect(profile).toHaveValue('paper');
	expect(themeRoot).toHaveClass(paperThemeClassName);
	expect(themeRoot.dataset.colorMode).toBe('light');

	await userEvent.click(darkMode, { force: true });

	await expect.poll(() => getThemeRoot().dataset.colorMode).toBe('dark');
	expect(themeRoot).toHaveClass(paperThemeClassName);

	unmountTheme();
	renderTheme(<ThemeControls />);

	expect(page.getByRole('combobox', { name: 'Theme profile' })).toHaveValue('paper');
	expect(page.getByRole('radio', { name: 'Dark theme' })).toBeChecked();
	expect(getThemeRoot()).toHaveClass(paperThemeClassName);
	await expect.poll(() => getThemeRoot().dataset.colorMode).toBe('dark');
});

test('system colour mode follows the platform preference and drives the docs chrome', async () => {
	await emulateColorScheme('dark');
	renderTheme(<ThemeControls />, { defaultTheme: 'system', enableSystem: true });

	await userEvent.click(page.getByRole('radio', { name: 'System theme' }), { force: true });

	await expect.poll(() => getThemeRoot().dataset.colorMode).toBe('dark');
	expect(document.documentElement).toHaveClass('dark');

	await emulateColorScheme('light');
	await expect.poll(() => getThemeRoot().dataset.colorMode).toBe('light');
	expect(document.documentElement).toHaveClass('light');
});

test('bridges dark mode into the Luke UI root and example canvas', async () => {
	renderTheme(
		<>
			<ThemeControls />
			<StoryWrapper>
				<span>Example content</span>
			</StoryWrapper>
		</>,
	);

	const themeRoot = getThemeRoot();
	const exampleContent = page.getByText('Example content').element();
	const exampleCanvas = exampleContent.parentElement;
	if (!exampleCanvas) throw new Error('Expected an example canvas');

	const lightBackground = getComputedStyle(exampleCanvas).backgroundColor;
	await userEvent.click(page.getByRole('radio', { name: 'Dark theme' }), { force: true });

	await expect.poll(() => themeRoot.dataset.colorMode).toBe('dark');
	expect(getComputedStyle(exampleCanvas).backgroundColor).not.toBe(lightBackground);
});

test('leaves full-bleed story surfaces unframed', () => {
	renderTheme(
		<StoryWrapper mode="full-bleed">
			<span>Full-bleed example content</span>
		</StoryWrapper>,
	);

	const exampleContent = page.getByText('Full-bleed example content').element();
	const storyRoot = exampleContent.parentElement;
	if (!storyRoot) throw new Error('Expected a full-bleed story root');

	expect(storyRoot).not.toHaveAttribute('style');
});

test('keeps inherited docs shell text readable in dark mode', async () => {
	renderTheme(
		<>
			<ThemeControls />
			<span>Unstyled shell text</span>
			<span data-foreground-probe style={{ color: 'var(--color-fd-foreground)' }} />
		</>,
	);

	await userEvent.click(page.getByRole('radio', { name: 'Dark theme' }), { force: true });
	await expect.poll(() => getThemeRoot().dataset.colorMode).toBe('dark');

	const shellText = page.getByText('Unstyled shell text').element();
	const foregroundProbe = container?.querySelector<HTMLElement>('[data-foreground-probe]');
	if (!foregroundProbe) throw new Error('Expected a docs foreground probe');

	expect(getComputedStyle(shellText).color).toBe(getComputedStyle(foregroundProbe).color);
});

test('boots the stored colour mode before the themed root hydrates', async () => {
	localStorage.setItem('theme', 'dark');
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
	await new Promise<void>((resolve) =>
		iframe.addEventListener('load', () => resolve(), { once: true }),
	);

	expect(iframe.contentDocument?.documentElement).toHaveAttribute('data-color-mode', 'dark');
	expect(iframe.contentDocument?.documentElement).toHaveAttribute('data-mode-at-hydration', 'dark');
	iframe.remove();
});

function renderTheme(
	children: ReactNode,
	options: Pick<ComponentProps<typeof ThemeProvider>, 'defaultTheme' | 'enableSystem'> = {},
) {
	container = document.body.appendChild(document.createElement('div'));
	root = createRoot(container);

	act(() => {
		root?.render(
			<ThemeProvider
				attribute="class"
				defaultTheme={options.defaultTheme ?? 'light'}
				enableSystem={options.enableSystem ?? false}
			>
				<IconSpritesheetProvider href={spriteSheetHref}>
					<DocsThemeRoot>{children}</DocsThemeRoot>
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

async function emulateColorScheme(mode: 'light' | 'dark') {
	await cdp().send('Emulation.setEmulatedMedia', {
		features: [{ name: 'prefers-color-scheme', value: mode }],
	});
}
