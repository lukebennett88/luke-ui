import '../../styles/app.css';
import '@luke-ui/react/themes/tactile/stylesheet.css';
import { themeClassName as tactileThemeClassName } from '@luke-ui/react/themes/tactile';
import axe from 'axe-core';
import type { ReactNode } from 'react';
import { act, createRef } from 'react';
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
	await expect.element(page.getByRole('status')).toMatchTextContent('Copied');
});

test('announces clipboard failure without claiming Copied', async () => {
	vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('denied'));

	renderCodeBlock(<CodeBlock code="const value = 1;" title="Source" />);

	await act(async () => {
		await userEvent.click(page.getByRole('button', { name: 'Copy' }));
	});

	await expect.element(page.getByRole('status')).toMatchTextContent('Could not copy code');
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

test('updates scroll accessibility when the mounted source and label change', async () => {
	await page.viewport(400, 800);
	renderCodeBlock(<CodeBlock allowCopy={false} code="short" viewportLabel="Source" />);
	const source = container?.querySelector('pre');
	assert(source != null, 'Expected a source element');
	const viewport = source.parentElement;
	assert(viewport != null, 'Expected a scroll viewport');
	expect(page.getByRole('region').query()).toBeNull();

	rerenderCodeBlock(<CodeBlock allowCopy={false} code={'x'.repeat(200)} viewportLabel="Source" />);
	await expect.element(page.getByRole('region', { name: 'Source' })).toBeVisible();
	expect(viewport).toHaveAttribute('tabindex', '0');
	expect(container?.querySelector('pre')).toBe(source);

	rerenderCodeBlock(
		<CodeBlock allowCopy={false} code={'x'.repeat(200)} viewportLabel="Updated source" />,
	);
	await expect.element(page.getByRole('region', { name: 'Updated source' })).toBeVisible();
	expect(page.getByRole('region', { name: 'Source', exact: true }).query()).toBeNull();

	rerenderCodeBlock(<CodeBlock allowCopy={false} code="short" viewportLabel="Updated source" />);
	await expect.poll(() => page.getByRole('region').query()).toBeNull();
	expect(viewport).not.toHaveAttribute('tabindex');
	expect(viewport).not.toHaveAttribute('aria-label');
});

test('updates scroll accessibility when the viewport narrows and widens', async () => {
	await page.viewport(1000, 800);
	renderCodeBlock(<CodeBlock allowCopy={false} code={'x'.repeat(80)} title="Source" />);
	expect(page.getByRole('region').query()).toBeNull();

	await page.viewport(320, 800);
	const viewport = page.getByRole('region', { name: 'Source' });
	await expect.element(viewport).toBeVisible();
	expect(viewport).toHaveAttribute('tabindex', '0');

	await page.viewport(1000, 800);
	await expect.poll(() => viewport.query()).toBeNull();
});

test('composes source refs through content changes, ref replacement, and unmount', () => {
	const cleanup = vi.fn<() => void>();
	const callbackRef = vi.fn<(node: HTMLPreElement | null) => (() => void) | void>((node) => {
		if (node) return cleanup;
	});
	const figureRef = createRef<HTMLElement>();
	const objectRef = createRef<HTMLPreElement>();
	renderCodeBlock(<CodeBlock code="first" ref={figureRef} sourceRef={callbackRef} />);
	const source = container?.querySelector('pre');
	assert(source != null, 'Expected a source element');
	expect(callbackRef).toHaveBeenCalledExactlyOnceWith(source);
	expect(figureRef.current).toBe(source.closest('figure'));

	rerenderCodeBlock(
		<CodeBlock html="<code>second</code>" ref={figureRef} sourceRef={callbackRef} />,
	);
	expect(source).toHaveTextContent('second');
	expect(callbackRef).toHaveBeenCalledTimes(1);
	expect(cleanup).not.toHaveBeenCalled();

	rerenderCodeBlock(<CodeBlock code="third" ref={figureRef} sourceRef={objectRef} />);
	expect(cleanup).toHaveBeenCalledTimes(1);
	expect(objectRef.current).toBe(source);
	expect(source).toHaveTextContent('third');

	act(() => root?.unmount());
	root = undefined;
	expect(objectRef.current).toBeNull();
	expect(figureRef.current).toBeNull();
});

test('copies child source while excluding ignored spans', async () => {
	const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
	renderCodeBlock(
		<CodeBlock>
			<code>
				first<span className="nd-copy-ignore">annotation</span>second
			</code>
		</CodeBlock>,
	);

	await act(async () => {
		await userEvent.click(page.getByRole('button', { name: 'Copy' }));
	});
	expect(writeText).toHaveBeenCalledWith('first\nsecond');
});

test('scrolls Shiki line spans across the full figure width under overlay copy', async () => {
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

	const figure = viewport.closest('figure');
	assert(figure != null, 'Expected a figure ancestor');
	// Overlay copy must not carve out a flex/grid side column.
	expect(viewport.getBoundingClientRect().width).toBeGreaterThan(figure.clientWidth * 0.9);

	const pre = viewport.querySelector('pre');
	assert(pre != null, 'Expected a pre element');
	expect(pre.getBoundingClientRect().width).toBeGreaterThan(viewport.clientWidth);
});

test('keeps empty Shiki line spans one line tall', () => {
	// The highlight plugin drops the `shiki` class, so Fumadocs' `.line:empty` rule does not apply.
	const html = [
		'<code>',
		'<span class="line">import a from "a";</span>',
		'<span class="line"></span>',
		'<span class="line">export default a;</span>',
		'</code>',
	].join('');

	renderCodeBlock(<CodeBlock copyText={'import a from "a";\n\nexport default a;'} html={html} />);

	const lines = container?.querySelectorAll('.line');
	assert(lines != null && lines.length === 3, 'Expected three line spans');
	const [first, empty, last] = [...lines].map((line) => line.getBoundingClientRect());
	assert(first != null && empty != null && last != null, 'Expected line boxes');

	expect(empty.height).toBeGreaterThan(0);
	expect(empty.height).toBeGreaterThanOrEqual(first.height - 1);
	expect(last.top - first.top).toBeGreaterThanOrEqual(first.height + empty.height - 1);
});

test('hides the copy control when allowCopy is false', () => {
	renderCodeBlock(<CodeBlock allowCopy={false} code="secret" />);

	expect(page.getByRole('button', { name: 'Copy' })).not.toBeInTheDocument();
});

test('centres overlay copy on the first line of a one-line fence', () => {
	renderCodeBlock(<CodeBlock code="pnpm add @luke-ui/react react-aria-components" />);

	const copyButton = page.getByRole('button', { name: 'Copy' }).element();
	const figure = copyButton.closest('figure');
	assert(figure != null, 'Expected a figure ancestor');
	const line = figure.querySelector('.line') ?? figure.querySelector('pre');
	assert(line != null, 'Expected a code line');

	const buttonBox = copyButton.getBoundingClientRect();
	const lineBox = line.getBoundingClientRect();
	const buttonMidY = (buttonBox.top + buttonBox.bottom) / 2;
	const lineMidY = (lineBox.top + lineBox.bottom) / 2;
	expect(Math.abs(buttonMidY - lineMidY)).toBeLessThanOrEqual(2);
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

for (const copyCase of [
	{ name: 'untitled overlay copy', title: undefined as string | undefined },
	{ name: 'titled header copy', title: 'Source' },
]) {
	test(`scrolls horizontally and keeps ${copyCase.name} on the physical right in RTL docs`, async () => {
		await page.viewport(320, 720);
		document.documentElement.dir = 'rtl';

		try {
			renderCodeBlock(<CodeBlock code={'x'.repeat(200)} title={copyCase.title} />);

			const regionName = copyCase.title ?? 'Code';
			const viewport = page.getByRole('region', { name: regionName }).element();
			expect(viewport.scrollWidth).toBeGreaterThan(viewport.clientWidth);
			expect(viewport.tabIndex).toBe(0);

			const copyButton = page.getByRole('button', { name: 'Copy' }).element();
			const figure = copyButton.closest('figure');
			assert(figure != null, 'Expected a figure ancestor');

			// Figure forces LTR like Fumadocs so copy stays on the physical right.
			expect(figure.getAttribute('dir')).toBe('ltr');
			expect(getComputedStyle(figure).direction).toBe('ltr');

			const figureBox = figure.getBoundingClientRect();
			const buttonBox = copyButton.getBoundingClientRect();
			const buttonMidX = (buttonBox.left + buttonBox.right) / 2;
			const figureMidX = (figureBox.left + figureBox.right) / 2;
			expect(buttonMidX).toBeGreaterThan(figureMidX);

			// Full-width scrollport — not a side column beside the button.
			expect(viewport.getBoundingClientRect().width).toBeGreaterThan(figure.clientWidth * 0.9);
		} finally {
			document.documentElement.dir = 'ltr';
		}
	});
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
	rerenderCodeBlock(node);
}

function rerenderCodeBlock(node: ReactNode) {
	act(() => {
		root?.render(<StoryWrapper>{node}</StoryWrapper>);
	});
}

function assert(condition: boolean, message: string): asserts condition {
	if (!condition) throw new Error(message);
}
