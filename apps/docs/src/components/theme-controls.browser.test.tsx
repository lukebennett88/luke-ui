import { act } from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, test, vi } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/context';
import { ThemeControls, ThemeSettingsProvider } from './theme-controls';

let container: HTMLElement | undefined;
let root: Root | undefined;

afterEach(() => {
	if (root) act(() => root?.unmount());
	container?.remove();
	container = undefined;
	root = undefined;
});

test('exposes accessible controls for changing theme and colour mode', async () => {
	const setColorMode = vi.fn<(colorMode: 'dark' | 'light') => void>();
	const setTheme = vi.fn<(theme: 'elmo' | 'machined-edge') => void>();
	container = document.body.appendChild(document.createElement('div'));
	root = createRoot(container);

	act(() =>
		root?.render(
			<ThemeSettingsProvider
				value={{ colorMode: 'light', setColorMode, setTheme, theme: 'machined-edge' }}
			>
				<ThemeControls />
			</ThemeSettingsProvider>,
		),
	);

	await userEvent.selectOptions(page.getByRole('combobox', { name: 'Theme' }), 'elmo');
	await userEvent.selectOptions(page.getByRole('combobox', { name: 'Color mode' }), 'dark');

	expect(setTheme).toHaveBeenCalledWith('elmo');
	expect(setColorMode).toHaveBeenCalledWith('dark');
});
