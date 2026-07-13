import '@luke-ui/react/stylesheet.css';
import '@luke-ui/react/themes/elmo.css';
import '@luke-ui/react/themes/machined-edge.css';
import { ThemeProvider } from 'next-themes';
import { act } from 'react';
import type { ReactNode } from 'react';
import type { Root } from 'react-dom/client';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, expect, test, vi } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/context';
import { StoryWrapper } from '../lib/story-wrapper';
import { DocsThemeRoot, ThemeControls } from './theme-controls';

let container: HTMLElement | undefined;
let root: Root | undefined;

afterEach(() => {
	if (root) act(() => root?.unmount());
	container?.remove();
	localStorage.clear();
	document.documentElement.removeAttribute('class');
	container = undefined;
	root = undefined;
});

test('exposes the playground colour-mode toggle beside the theme profile control', async () => {
	renderTheme(<ThemeControls />);

	const profile = page.getByRole('combobox', { name: 'Theme profile' });
	const darkMode = getDarkModeButton();

	await userEvent.selectOptions(profile, 'elmo');
	await userEvent.click(darkMode, { force: true });

	expect(profile).toHaveValue('elmo');
	await expect.poll(() => getThemeRoot().dataset.colorMode).toBe('dark');
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
	await userEvent.click(getDarkModeButton(), { force: true });

	await expect.poll(() => themeRoot.dataset.colorMode).toBe('dark');
	expect(getComputedStyle(exampleCanvas).backgroundColor).not.toBe(lightBackground);
});

test('omits the colour mode until hydration completes', async () => {
	localStorage.setItem('theme', 'dark');
	const tree = (
		<ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
			<DocsThemeRoot>
				<span>Hydrated content</span>
			</DocsThemeRoot>
		</ThemeProvider>
	);
	const serverMarkup = renderToString(tree);
	expect(serverMarkup).not.toContain('data-color-mode');

	container = document.body.appendChild(document.createElement('div'));
	container.innerHTML = serverMarkup;
	const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
	await act(async () => {
		root = hydrateRoot(container as HTMLElement, tree);
	});

	await expect.poll(() => getThemeRoot().dataset.colorMode).toBe('dark');
	expect(consoleError).not.toHaveBeenCalledWith(expect.stringContaining('hydration mismatch'));
	consoleError.mockRestore();
});

function renderTheme(children: ReactNode) {
	container = document.body.appendChild(document.createElement('div'));
	root = createRoot(container);

	act(() => {
		root?.render(
			<ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
				<DocsThemeRoot>{children}</DocsThemeRoot>
			</ThemeProvider>,
		);
	});
}

function getDarkModeButton() {
	const button = container?.querySelector<HTMLButtonElement>('button[aria-label="Dark theme"]');
	if (!button) throw new Error('Expected an accessible dark theme button');

	return page.elementLocator(button);
}

function getThemeRoot() {
	const themeRoot = container?.querySelector<HTMLElement>('[data-color-mode]');
	if (!themeRoot) throw new Error('Expected a Luke UI theme root');

	return themeRoot;
}
