import '../styles/app.css';
import '@luke-ui/react/themes/tactile/stylesheet.css';
import { ThemeProvider } from 'next-themes';
import { act } from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, test } from 'vite-plus/test';
import { isExamplePreviewPreviewMessage } from '../lib/example-preview-protocol.js';
import { ExamplePreviewRunner } from './example-preview-runner.js';
import { DocsThemeRoot } from './theme-controls.js';

let container: HTMLElement | undefined;
let parentListenController = new AbortController();
let root: Root | undefined;

afterEach(() => {
	parentListenController.abort();
	parentListenController = new AbortController();
	if (root) act(() => root?.unmount());
	container?.remove();
	container = undefined;
	root = undefined;
});

test('resends an unchanged height when the page requests it', async () => {
	const heights: Array<number> = [];
	const onMessage = (event: MessageEvent) => {
		if (
			event.origin !== window.location.origin ||
			event.source !== window ||
			!isExamplePreviewPreviewMessage(event.data)
		) {
			return;
		}

		if (event.data.type === 'example-preview:height') heights.push(event.data.height);
	};
	window.parent.addEventListener('message', onMessage, { signal: parentListenController.signal });
	renderPreview();

	await expect.poll(() => heights.length).toBeGreaterThan(0);
	const reportCount = heights.length;
	const initialHeight = heights.at(-1);
	window.dispatchEvent(
		new MessageEvent('message', {
			data: { type: 'example-preview:request-height' },
			origin: window.location.origin,
			source: window.parent,
		}),
	);

	await expect.poll(() => heights.length).toBeGreaterThan(reportCount);
	expect(heights.at(-1)).toBe(initialHeight);
});

function renderPreview() {
	container = document.body.appendChild(document.createElement('div'));
	root = createRoot(container);
	act(() => {
		root?.render(
			<ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
				<DocsThemeRoot>
					<ExamplePreviewRunner src="combobox-primitive/basic" />
				</DocsThemeRoot>
			</ThemeProvider>,
		);
	});
}
