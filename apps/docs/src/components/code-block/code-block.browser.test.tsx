import '../../styles/app.css';
import '@luke-ui/theme-tactile/stylesheet.css';
import type { ReactNode } from 'react';
import { act } from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, test, vi } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/context';
import { expectNoAxeViolations } from '../../../../../packages/@luke-ui/react/src/core/test-utils/axe.js';
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
	vi.useRealTimers();
});

test('copies plain source including leading and trailing whitespace', async () => {
	// Fake only the revert timer: a real 1.5s timeout can fire before `expect.element` starts
	// polling on a slow runner, so "Copied" is never observed.
	vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
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
	vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
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
	assert(container !== undefined, 'expected CodeBlock container');
	await expectNoAxeViolations(container);
});

function renderCodeBlock(node: ReactNode) {
	container = document.body.appendChild(document.createElement('div'));
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
