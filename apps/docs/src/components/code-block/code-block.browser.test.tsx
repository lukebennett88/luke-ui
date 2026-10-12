import '../../styles/app.css';
import '@luke-ui/theme-tactile/stylesheet.css';
import { Provider } from '@luke-ui/react/provider';
import spriteSheetHref from '@luke-ui/react/spritesheet.svg?url&no-inline';
import { act } from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import { afterEach, assert, expect, test } from 'vite-plus/test';
import { page } from 'vite-plus/test/context';
import { CodeBlock } from './code-block.js';

let container: HTMLElement | undefined;
let root: Root | undefined;

afterEach(() => {
	if (root) act(() => root?.unmount());
	container?.remove();
	container = undefined;
	root = undefined;
});

function renderCode(code: string) {
	if (!container || !root) {
		container = document.body.appendChild(document.createElement('div'));
		root = createRoot(container);
	}
	act(() => {
		root?.render(
			<Provider spritesheetHref={spriteSheetHref}>
				<CodeBlock code={code} title="Sample" viewportLabel="Sample code" />
			</Provider>,
		);
	});
}

function viewportElement() {
	const viewport = container?.querySelector('pre')?.parentElement;
	assert(viewport instanceof HTMLElement, 'expected code viewport');
	return viewport;
}

test('a tall standalone fence grows to its natural height without vertical scroll', async () => {
	await page.viewport(1000, 800);
	renderCode(Array.from({ length: 80 }, (_, i) => `const value${i} = ${i};`).join('\n'));
	const viewport = viewportElement();
	await expect.poll(() => viewport.getBoundingClientRect().height).toBeGreaterThan(800);
	expect(viewport.clientHeight).toBe(viewport.scrollHeight);
	expect(viewport.matches('[role="region"]')).toBe(false);
});

test('a standalone fence is a focusable named region only while lines overflow sideways', async () => {
	await page.viewport(400, 800);
	renderCode(`const long = '${'x'.repeat(200)}';`);
	await expect.element(page.getByRole('region', { name: 'Sample code' })).toBeInTheDocument();
	const viewport = viewportElement();
	expect(viewport.tabIndex).toBe(0);
	viewport.focus();
	await expect.element(viewport).toHaveFocus();
	expect(viewport.scrollWidth).toBeGreaterThan(viewport.clientWidth);

	renderCode('const short = 1;');
	await expect.poll(() => page.getByRole('region', { name: 'Sample code' }).query()).toBeNull();
	expect(viewportElement().tabIndex).toBe(-1);
});
