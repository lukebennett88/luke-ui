import '../../styles/app.css';
import '@luke-ui/react/themes/paper/stylesheet.css';
import '@luke-ui/react/themes/tactile/stylesheet.css';
import type { PlaygroundPreviewMessage } from '@luke-ui/playground-core/protocol';
import { isPlaygroundPreviewMessage } from '@luke-ui/playground-core/protocol';
import { themeClassName as paperThemeClassName } from '@luke-ui/react/themes/paper';
import { act } from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, test } from 'vite-plus/test';
import toneSource from '../../examples/button/tones.tsx?raw';
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

function postFromParent(data: unknown, source: Window = window.parent): void {
	window.dispatchEvent(
		new MessageEvent('message', {
			data,
			origin: window.location.origin,
			source,
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

/** Mounts the preview, posts playground code from the parent, and returns the messages it replies with. */
async function runCodeInPreview(code: string): Promise<Array<PlaygroundPreviewMessage>> {
	const messages = collectParentPreviewMessages();
	await mountPreview();
	await act(async () => {
		postFromParent({ code, type: 'playground:code' });
	});
	return messages;
}

test('applies appearance messages to the preview document without storing them', async () => {
	await mountPreview();

	await act(async () => {
		postFromParent({ colorMode: 'dark', themeIdentity: 'paper', type: 'luke-ui-docs:appearance' });
		await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
	});

	await expect.poll(() => document.documentElement.dataset.colorMode).toBe('dark');
	expect(document.documentElement).toHaveClass(paperThemeClassName);
	expect(localStorage.getItem(THEME_IDENTITY_STORAGE_KEY)).toBeNull();
});

test('ignores an appearance message that is not from the parent', async () => {
	await mountPreview();

	await act(async () => {
		postFromParent(
			{ colorMode: 'dark', themeIdentity: 'paper', type: 'luke-ui-docs:appearance' },
			window,
		);
		await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
	});

	expect(document.documentElement.dataset.colorMode).not.toBe('dark');
	expect(document.documentElement).not.toHaveClass(paperThemeClassName);
});

test('compiles parent playground code and posts success', async () => {
	const messages = await runCodeInPreview(
		'export default function Demo() { return <div>ok</div>; }',
	);

	await expect
		.poll(() => messages.find((message) => message.type === 'playground:success'))
		.toEqual({ type: 'playground:success' });
});

test('runs the Button tone example with the docs comparison helper', async () => {
	const messages = await runCodeInPreview(toneSource);

	await expect
		.poll(() => messages.find((message) => message.type === 'playground:success'))
		.toEqual({ type: 'playground:success' });
	expect(container).toMatchTextContent('Neutral');
});

test('posts the compileComponent error when parent playground code is invalid', async () => {
	const messages = await runCodeInPreview('const broken = true;');

	await expect
		.poll(() => messages.find((message) => message.type === 'playground:error'))
		.toEqual({
			message: 'Playground code must default-export a React component.',
			type: 'playground:error',
		});
});

test('reports a non-component default export as a render error, not a compile error', async () => {
	const messages = await runCodeInPreview('export default 42;');

	// compileComponent only rejects a missing default export, so this reaches
	// React, which fails at render time inside PreviewRunner's ErrorBoundary.
	await expect
		.poll(() => messages.find((message) => message.type === 'playground:error'))
		.toMatchObject({ type: 'playground:error' });
	expect(messages.find((message) => message.type === 'playground:error')).not.toEqual({
		message: 'Playground code must default-export a React component.',
		type: 'playground:error',
	});
});
