import '../../styles/app.css';
import '@luke-ui/react/themes/paper/stylesheet.css';
import '@luke-ui/react/themes/tactile/stylesheet.css';
import { Button } from '@luke-ui/react/button';
import { act, createElement, useState } from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, test } from 'vite-plus/test';
import { StoryWrapper } from '../../lib/story-wrapper';
import { DocsThemeRoot } from '../theme-controls';
import { PlaygroundPaneToolbar } from './pane-toolbar.js';
import { PreviewToolbar } from './preview-toolbar.js';
import type { ViewportWidth } from './viewport-toggle.js';

let container: HTMLElement | undefined;
let root: Root | undefined;

afterEach(() => {
	if (root) act(() => root?.unmount());
	container?.remove();
	container = undefined;
	root = undefined;
});

test('editor and preview toolbars share the same block size', () => {
	renderToolbars();

	const [editorToolbar, previewToolbar] = getToolbars();
	expect(editorToolbar.offsetHeight).toBe(previewToolbar.offsetHeight);
});

function renderToolbars() {
	container = document.body.appendChild(document.createElement('div'));
	root = createRoot(container);

	act(() => {
		root?.render(
			createElement(
				DocsThemeRoot,
				null,
				createElement(StoryWrapper, null, createElement(ToolbarHarness)),
			),
		);
	});
}

function ToolbarHarness() {
	const [viewportWidth, setViewportWidth] = useState<ViewportWidth>('100%');
	const [isFullscreen, setIsFullscreen] = useState(false);

	return createElement(
		'div',
		{ 'data-testid': 'toolbar-harness' },
		createElement(
			PlaygroundPaneToolbar,
			null,
			createElement(Button, { appearance: 'ghost', size: 'small' }, 'Format'),
		),
		createElement(PreviewToolbar, {
			isFullscreen,
			onFullscreenChange: setIsFullscreen,
			onViewportChange: setViewportWidth,
			viewportWidth,
		}),
	);
}

function getToolbars(): [HTMLElement, HTMLElement] {
	const harness = container?.querySelector('[data-testid="toolbar-harness"]');
	if (!harness || harness.children.length !== 2) {
		throw new Error('expected editor and preview toolbars');
	}

	const editorToolbar = harness.children[0];
	const previewToolbar = harness.children[1];
	if (!(editorToolbar instanceof HTMLElement) || !(previewToolbar instanceof HTMLElement)) {
		throw new Error('expected editor and preview toolbars');
	}

	return [editorToolbar, previewToolbar];
}
