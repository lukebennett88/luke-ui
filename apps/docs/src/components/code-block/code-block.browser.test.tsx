import '../../styles/app.css';
import '@luke-ui/react/themes/tactile/stylesheet.css';
import { themeClassName as tactileThemeClassName } from '@luke-ui/react/themes/tactile';
import axe from 'axe-core';
import type { ReactNode } from 'react';
import { act } from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, test, vi } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/context';
import { StoryWrapper } from '../../lib/story-wrapper';
import { CodeBlock } from './code-block';

let container: HTMLElement | undefined;
let root: Root | undefined;

afterEach(() => {
	if (root) act(() => root?.unmount());
	container?.remove();
	container = undefined;
	root = undefined;
	vi.restoreAllMocks();
});

test('copies plain source including leading and trailing whitespace', async () => {
	const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
	const source = '  pnpm add @luke-ui/react  ';

	renderCodeBlock(<CodeBlock code={source} title="Terminal" />);

	await act(async () => {
		await userEvent.click(page.getByRole('button', { name: 'Copy' }));
	});

	expect(writeText).toHaveBeenCalledWith(source);
	await expect.element(page.getByRole('button', { name: 'Copied' })).toBeVisible();
	await expect.element(page.getByRole('status')).toHaveTextContent('Copied');
});

test('copies copyText instead of rendered highlighted text', async () => {
	const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
	const source = 'const value = 1;\n';
	const html = '<code class="shiki"><span>rendered</span></code>';

	renderCodeBlock(<CodeBlock copyText={source} html={html} />);

	await act(async () => {
		await userEvent.click(page.getByRole('button', { name: 'Copy' }));
	});

	expect(writeText).toHaveBeenCalledWith(source);
	expect(page.getByText('rendered').element()).toBeTruthy();
});

test('hides the copy control when allowCopy is false', () => {
	renderCodeBlock(<CodeBlock allowCopy={false} code="secret" />);

	expect(page.getByRole('button', { name: 'Copy' })).not.toBeInTheDocument();
});

test('scrolls horizontally in a narrow viewport and stays operable in RTL', async () => {
	await page.viewport(320, 720);
	document.documentElement.dir = 'rtl';

	try {
		renderCodeBlock(
			<CodeBlock
				code={'const long = "abcdefghijklmnopqrstuvwxyz0123456789".repeat(8);'}
				title="Source"
			/>,
		);

		const viewport = page.getByRole('region', { name: 'Source' }).element();
		expect(viewport.scrollWidth).toBeGreaterThan(viewport.clientWidth);
		expect(viewport.tabIndex).toBe(0);

		const copyButton = page.getByRole('button', { name: 'Copy' }).element();
		const figure = copyButton.closest('figure');
		assert(figure != null, 'Expected a figure ancestor');
		expect(getComputedStyle(figure).direction).toBe('ltr');
	} finally {
		document.documentElement.dir = 'ltr';
	}
});

test('the CodeBlock scene has no axe violations', async () => {
	renderCodeBlock(<CodeBlock code={'const example = "hello";'} title="Example" />);

	const results = await axe.run(container!);
	expect(
		results.violations.map((violation) => ({
			id: violation.id,
			nodes: violation.nodes.map((node) => node.html),
		})),
	).toEqual([]);
});

function renderCodeBlock(node: ReactNode) {
	container = document.body.appendChild(document.createElement('div'));
	container.className = `luke-ui-theme ${tactileThemeClassName}`;
	root = createRoot(container);
	act(() => {
		root?.render(<StoryWrapper>{node}</StoryWrapper>);
	});
}

function assert(condition: boolean, message: string): asserts condition {
	if (!condition) throw new Error(message);
}
