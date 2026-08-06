import '../../styles/app.css';
import '@luke-ui/react/themes/tactile.css';
import { tactileThemeClassName } from '@luke-ui/react/themes';
import { act } from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, test } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/context';
import ColorModeOverride from './color-mode-override';

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

function backgroundOf(panel: HTMLElement): string {
	return getComputedStyle(panel).backgroundColor;
}

test(
	're-colours the parent-following panel when the parent mode changes and leaves the fixed nested' +
		' panel in its explicit mode',
	async () => {
		renderColourModeExample();

		const followingPanel = page
			.getByText('This panel follows the parent mode.')
			.element().parentElement;
		const fixedPanel = page.getByText('This panel is fixed to dark mode.').element().parentElement;
		if (!followingPanel || !fixedPanel) {
			throw new Error('Expected the colour-mode panels rendered');
		}

		const lightFollowing = backgroundOf(followingPanel);
		const darkFixed = backgroundOf(fixedPanel);

		expect(lightFollowing).not.toBe(darkFixed);

		await userEvent.click(page.getByRole('button', { name: 'Dark' }));

		await expect.poll(() => backgroundOf(followingPanel)).toBe(darkFixed);
		expect(backgroundOf(followingPanel)).not.toBe(lightFollowing);
		expect(backgroundOf(fixedPanel)).toBe(darkFixed);
	},
);
