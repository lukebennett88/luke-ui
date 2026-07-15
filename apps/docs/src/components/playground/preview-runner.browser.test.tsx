import '../../styles/app.css';
import '@luke-ui/react/themes/elmo.css';
import '@luke-ui/react/themes/machined-edge.css';
import { elmoThemeClassName } from '@luke-ui/react/themes';
import { ThemeProvider } from 'next-themes';
import { act } from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, test } from 'vite-plus/test';
import { DocsThemeRoot } from '../theme-controls.js';
import PreviewRunner from './preview-runner.js';

let container: HTMLElement | undefined;
let root: Root | undefined;

afterEach(() => {
	if (root) act(() => root?.unmount());
	container?.remove();
	localStorage.clear();
	document.documentElement.removeAttribute('class');
	document.documentElement.removeAttribute('data-color-mode');
	container = undefined;
	root = undefined;
});

test('applies appearance messages to the playground preview root', async () => {
	container = document.body.appendChild(document.createElement('div'));
	root = createRoot(container);
	await act(async () => {
		root?.render(
			<ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
				<DocsThemeRoot>
					<PreviewRunner />
				</DocsThemeRoot>
			</ThemeProvider>,
		);
	});

	await act(async () => {
		window.postMessage(
			{ colorMode: 'dark', themeIdentity: 'elmo', type: 'playground:appearance' },
			window.location.origin,
		);
		await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
	});

	const themeRoot = container.querySelector<HTMLElement>('[data-color-mode]');
	if (!themeRoot) throw new Error('Expected a playground theme root');
	await expect.poll(() => themeRoot.dataset.colorMode).toBe('dark');
	expect(themeRoot).toHaveClass(elmoThemeClassName);
});
