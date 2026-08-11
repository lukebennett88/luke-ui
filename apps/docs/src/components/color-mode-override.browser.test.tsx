import '../styles/app.css';
import '@luke-ui/react/themes/tactile/stylesheet.css';
import { themeClassName as tactileThemeClassName } from '@luke-ui/react/themes/tactile';
import { act } from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, test } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/context';
import ColorModeOverride from '../examples/theming/color-mode-override';

let container: HTMLElement | undefined;
let root: Root | undefined;

afterEach(() => {
	if (root) act(() => root?.unmount());
	container?.remove();
	container = undefined;
	root = undefined;
});

function renderColourModeExample() {
	container = document.body.appendChild(document.createElement('div'));
	container.className = `luke-ui-theme ${tactileThemeClassName}`;
	root = createRoot(container);
	act(() => {
		root?.render(<ColorModeOverride />);
	});
}

test('toggles the parent colour mode and leaves the nested panel fixed to dark', async () => {
	renderColourModeExample();

	const parent = container?.firstElementChild;
	if (!(parent instanceof HTMLElement)) throw new Error('Expected the colour-mode example root');
	expect(parent).toHaveAttribute('data-color-mode', 'light');

	const fixedPanel = page
		.getByText('This panel is fixed to dark mode.')
		.element()
		.closest('[data-color-mode]');
	expect(fixedPanel).toHaveAttribute('data-color-mode', 'dark');

	await userEvent.click(page.getByRole('button', { name: 'Dark' }));

	await expect.poll(() => parent.getAttribute('data-color-mode')).toBe('dark');
	expect(fixedPanel).toHaveAttribute('data-color-mode', 'dark');
});
