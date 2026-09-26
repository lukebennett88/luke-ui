import '../../styles/app.css';
import '@luke-ui/react/themes/paper/stylesheet.css';
import '@luke-ui/react/themes/tactile/stylesheet.css';
import { themeClassName as paperThemeClassName } from '@luke-ui/react/themes/paper';
import { act } from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, test } from 'vite-plus/test';
import toneSource from '../../examples/button/tones.tsx?raw';
import type { PlaygroundPreviewMessage } from '../../lib/playground-protocol.js';
import { isPlaygroundPreviewMessage } from '../../lib/playground-protocol.js';
import { THEME_IDENTITY_STORAGE_KEY } from '../../lib/theme-prefs.js';
import { DocsThemeRoot } from '../theme-controls.js';
import PreviewRunner from './preview-runner.js';

let container: HTMLElement | undefined;
let parentListenController = new AbortController();
let root: Root | undefined;

afterEach(() => {
	parentListenController.abort();
	parentListenController = new AbortController();
	if (root) act(() => root?.unmount());
	container?.remove();
	localStorage.clear();
	document.documentElement.removeAttribute('class');
	document.documentElement.removeAttribute('data-color-mode');
	document.documentElement.removeAttribute('style');
	container = undefined;
	root = undefined;
});

async function mountPreview(): Promise<void> {
	container = document.body.appendChild(document.createElement('div'));
	root = createRoot(container);
	await act(async () => {
		root?.render(
			<DocsThemeRoot>
				<PreviewRunner />
			</DocsThemeRoot>,
		);
	});
}

function postFromParent(data: unknown): void {
	window.dispatchEvent(
		new MessageEvent('message', {
			data,
			origin: window.location.origin,
			source: window.parent,
		}),
	);
}

function collectParentPreviewMessages(): Array<PlaygroundPreviewMessage> {
	const messages: Array<PlaygroundPreviewMessage> = [];
	window.parent.addEventListener(
		'message',
		(event: MessageEvent) => {
			if (isPlaygroundPreviewMessage(event.data)) messages.push(event.data);
		},
		{ signal: parentListenController.signal },
	);
	return messages;
}

test('applies appearance messages to the preview document without storing them', async () => {
	await mountPreview();

	await act(async () => {
		postFromParent({ colorMode: 'dark', themeIdentity: 'paper', type: 'playground:appearance' });
		await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
	});

	await expect.poll(() => document.documentElement.dataset.colorMode).toBe('dark');
	expect(document.documentElement).toHaveClass(paperThemeClassName);
	expect(localStorage.getItem(THEME_IDENTITY_STORAGE_KEY)).toBeNull();
});

test('compiles parent playground code and posts success', async () => {
	const messages = collectParentPreviewMessages();
	await mountPreview();

	await act(async () => {
		postFromParent({
			code: 'export default function Demo() { return <div>ok</div>; }',
			type: 'playground:code',
		});
	});

	await expect
		.poll(() => messages.find((message) => message.type === 'playground:success'))
		.toEqual({ type: 'playground:success' });
});

test('runs the Button tone example with the docs comparison helper', async () => {
	const messages = collectParentPreviewMessages();
	await mountPreview();

	await act(async () => {
		postFromParent({ code: toneSource, type: 'playground:code' });
	});

	await expect
		.poll(() => messages.find((message) => message.type === 'playground:success'))
		.toEqual({ type: 'playground:success' });
	expect(container).toHaveTextContent('Neutral');
});

test('posts the compileComponent error when parent playground code is invalid', async () => {
	const messages = collectParentPreviewMessages();
	await mountPreview();

	await act(async () => {
		postFromParent({
			code: 'const broken = true;',
			type: 'playground:code',
		});
	});

	await expect
		.poll(() => messages.find((message) => message.type === 'playground:error'))
		.toEqual({
			message: 'Playground code must default-export a React component.',
			type: 'playground:error',
		});
});
