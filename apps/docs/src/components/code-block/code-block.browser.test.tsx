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

test('announces clipboard failure without claiming Copied', async () => {
	vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('denied'));

	renderCodeBlock(<CodeBlock code="const value = 1;" title="Source" />);

	await act(async () => {
		await userEvent.click(page.getByRole('button', { name: 'Copy' }));
	});

	await expect.element(page.getByRole('status')).toHaveTextContent('Could not copy code');
	await expect.element(page.getByRole('button', { name: 'Copy' })).toBeVisible();
	expect(page.getByRole('button', { name: 'Copied' })).not.toBeInTheDocument();
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

test('scrolls Shiki line spans horizontally under a floating copy control', async () => {
	await page.viewport(320, 720);

	const longImport = `import { Box } from '@luke-ui/react/box';`;
	const longBox = `<Box maxInlineSize="42rem" padding="sp24">`;
	const html = [
		'<code class="shiki">',
		`<span class="line">${longImport}</span>`,
		`<span class="line">${longBox}</span>`,
		'<span class="line">{children}</span>',
		'<span class="line"></Box>;</span>',
		'</code>',
	].join('');

	renderCodeBlock(<CodeBlock copyText={`${longImport}\n${longBox}`} html={html} />);

	const viewport = page.getByRole('region', { name: 'Code' }).element();
	expect(viewport.scrollWidth).toBeGreaterThan(viewport.clientWidth);

	const pre = viewport.querySelector('pre');
	assert(pre != null, 'Expected a pre element');
	// max-content pre must outgrow the scrollport so lines are not clipped at the copy gutter.
	expect(pre.getBoundingClientRect().width).toBeGreaterThan(viewport.clientWidth);

	const firstLine = pre.querySelector('.line');
	assert(firstLine != null, 'Expected a Shiki line');
	expect(firstLine.getBoundingClientRect().width).toBeGreaterThan(viewport.clientWidth);
});

test('hides the copy control when allowCopy is false', () => {
	renderCodeBlock(<CodeBlock allowCopy={false} code="secret" />);

	expect(page.getByRole('button', { name: 'Copy' })).not.toBeInTheDocument();
});

test('opts out of prose inline-code chrome on the fence code element', () => {
	renderCodeBlock(
		<div className="prose">
			<CodeBlock code={'const value = 1;'} />
		</div>,
	);

	const figure = page.getByRole('button', { name: 'Copy' }).element().closest('figure');
	assert(figure != null, 'Expected a figure ancestor');
	expect(figure.classList.contains('not-prose')).toBe(true);

	const code = figure.querySelector('pre code');
	assert(code != null, 'Expected a code element');
	const styles = getComputedStyle(code);
	expect(styles.borderWidth).toBe('0px');
	expect(styles.padding).toBe('0px');
	expect(styles.backgroundColor).toBe('rgba(0, 0, 0, 0)');
});

test('scrolls horizontally in a narrow viewport and stays operable in RTL', async () => {
	await page.viewport(320, 720);
	document.documentElement.dir = 'rtl';

	try {
		renderCodeBlock(<CodeBlock code={'x'.repeat(200)} title="Source" />);

		const viewport = page.getByRole('region', { name: 'Source' }).element();
		expect(viewport.scrollWidth).toBeGreaterThan(viewport.clientWidth);
		expect(viewport.tabIndex).toBe(0);
		expect(getComputedStyle(viewport).direction).toBe('ltr');

		const copyButton = page.getByRole('button', { name: 'Copy' }).element();
		const figure = copyButton.closest('figure');
		assert(figure != null, 'Expected a figure ancestor');

		// Chrome inherits document direction; only the code scroll region stays LTR.
		expect(getComputedStyle(figure).direction).toBe('rtl');
		const pre = figure.querySelector('pre');
		assert(pre != null, 'Expected a pre element');
		expect(getComputedStyle(pre).direction).toBe('ltr');

		// In RTL, inline-end is physically left — the copy action sits nearer the figure's left edge.
		const figureBox = figure.getBoundingClientRect();
		const buttonBox = copyButton.getBoundingClientRect();
		const buttonMidX = (buttonBox.left + buttonBox.right) / 2;
		const figureMidX = (figureBox.left + figureBox.right) / 2;
		expect(buttonMidX).toBeLessThan(figureMidX);
	} finally {
		document.documentElement.dir = 'ltr';
	}
});

test('titleless floating copy clears code content in RTL', async () => {
	await page.viewport(320, 720);
	document.documentElement.dir = 'rtl';

	try {
		renderCodeBlock(<CodeBlock code={'x'.repeat(200)} />);

		const viewport = page.getByRole('region', { name: 'Code' }).element();
		expect(viewport.scrollWidth).toBeGreaterThan(viewport.clientWidth);
		expect(getComputedStyle(viewport).direction).toBe('ltr');

		const copyButton = page.getByRole('button', { name: 'Copy' }).element();
		const figure = copyButton.closest('figure');
		assert(figure != null, 'Expected a figure ancestor');

		expect(getComputedStyle(figure).direction).toBe('rtl');
		const pre = figure.querySelector('pre');
		assert(pre != null, 'Expected a pre element');
		expect(getComputedStyle(pre).direction).toBe('ltr');

		// Floating copy uses insetInlineEnd on the figure → physical left in RTL.
		const figureBox = figure.getBoundingClientRect();
		const buttonBox = copyButton.getBoundingClientRect();
		const buttonMidX = (buttonBox.left + buttonBox.right) / 2;
		const figureMidX = (figureBox.left + figureBox.right) / 2;
		expect(buttonMidX).toBeLessThan(figureMidX);

		// Frame padding (not the LTR viewport) reserves the same physical side as the button.
		const code = pre.querySelector('code') ?? pre;
		const codeBox = code.getBoundingClientRect();
		expect(rectsIntersect(codeBox, buttonBox)).toBe(false);
	} finally {
		document.documentElement.dir = 'ltr';
	}
});

function rectsIntersect(a: DOMRect, b: DOMRect): boolean {
	return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

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
