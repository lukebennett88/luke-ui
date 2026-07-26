import '../../styles/app.css';
import '@luke-ui/react/themes/tactile.css';
import { tactileThemeClassName } from '@luke-ui/react/themes';
import { act } from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, test } from 'vite-plus/test';
import { page } from 'vite-plus/test/context';
import { EditorSkeleton } from './editor-skeleton';

let container: HTMLElement | undefined;
let root: Root | undefined;

afterEach(() => {
	if (root) act(() => root?.unmount());
	container?.remove();
	container = undefined;
	root = undefined;
});

for (const [mode, expectedBackground] of [
	['light', 'rgb(239, 241, 245)'],
	['dark', 'rgb(30, 30, 46)'],
] as const) {
	test(`uses the ${mode} editor surface behind its loading pill`, () => {
		renderSkeleton(mode);

		const label = page.getByText('Loading editor', { exact: true }).nth(1).element();
		expect(getComputedStyle(label.parentElement as HTMLElement).backgroundColor).toBe(
			expectedBackground,
		);
	});
}

function renderSkeleton(mode: 'light' | 'dark') {
	container = document.body.appendChild(document.createElement('div'));
	container.className = `luke-ui-theme ${tactileThemeClassName}`;
	container.dataset.colorMode = mode;
	container.classList.toggle('dark', mode === 'dark');
	root = createRoot(container);
	act(() => {
		root?.render(<EditorSkeleton code="const value = 1;" showPill />);
	});
}
