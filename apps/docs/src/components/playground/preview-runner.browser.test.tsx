import '../../styles/app.css';
import '@luke-ui/react/themes/paper/stylesheet.css';
import '@luke-ui/react/themes/tactile/stylesheet.css';
import { themeClassName as paperThemeClassName } from '@luke-ui/react/themes/paper';
import { ThemeProvider } from 'next-themes';
import { act } from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, test } from 'vite-plus/test';
import type { PlaygroundPreviewMessage } from '../../lib/playground-protocol.js';
import { isPlaygroundPreviewMessage } from '../../lib/playground-protocol.js';
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
	container = undefined;
	root = undefined;
});

async function mountPreview(): Promise<void> {
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

function collectParentPreviewMessages(): PlaygroundPreviewMessage[] {
	const messages: PlaygroundPreviewMessage[] = [];
	window.parent.addEventListener(
		'message',
		(event: MessageEvent) => {
			if (isPlaygroundPreviewMessage(event.data)) messages.push(event.data);
		},
		{ signal: parentListenController.signal },
	);
	return messages;
}

test('applies appearance messages to the playground preview root', async () => {
	await mountPreview();

	await act(async () => {
		postFromParent({ colorMode: 'dark', themeIdentity: 'paper', type: 'playground:appearance' });
		await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
	});

	const themeRoot = container?.querySelector<HTMLElement>('[data-color-mode]');
	if (!themeRoot) throw new Error('Expected a playground theme root');
	await expect.poll(() => themeRoot.dataset.colorMode).toBe('dark');
	expect(document.documentElement).toHaveClass(paperThemeClassName);
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
