import '../../styles/app.css';
import '@luke-ui/react/themes/paper.css';
import '@luke-ui/react/themes/tactile.css';
import { paperThemeClassName, tactileThemeClassName } from '@luke-ui/react/themes';
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

for (const [themeName, themeClassName] of [
	['Tactile', tactileThemeClassName],
	['Paper', paperThemeClassName],
] as const) {
	for (const mode of ['light', 'dark'] as const) {
		test(`uses an opaque ${themeName} ${mode} popover surface behind its loading pill`, () => {
			renderSkeleton(themeClassName, mode);

			const label = page.getByText('Loading editor', { exact: true }).nth(1).element();
			const pillBackground = getComputedStyle(label.parentElement as HTMLElement).backgroundColor;
			const expectedBackground = getSemanticSurfaceBackground();

			expect(pillBackground).toBe(expectedBackground);
			expect(pillBackground).not.toBe('rgba(0, 0, 0, 0)');
		});
	}
}

function renderSkeleton(themeClassName: string, mode: 'light' | 'dark') {
	container = document.body.appendChild(document.createElement('div'));
	container.className = `luke-ui-theme ${themeClassName}`;
	container.dataset.colorMode = mode;
	container.classList.toggle('dark', mode === 'dark');
	root = createRoot(container);
	act(() => {
		root?.render(<EditorSkeleton code="const value = 1;" showPill />);
	});
}

function getSemanticSurfaceBackground() {
	if (!container) throw new Error('Expected a theme root.');

	const surface = container.appendChild(document.createElement('div'));
	surface.style.backgroundColor = 'var(--color-fd-popover)';
	const background = getComputedStyle(surface).backgroundColor;
	surface.remove();
	return background;
}
