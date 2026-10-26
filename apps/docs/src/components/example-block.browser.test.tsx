import '../styles/app.css';
import '@luke-ui/theme-tactile/stylesheet.css';
import { Provider } from '@luke-ui/react/provider';
import spriteSheetHref from '@luke-ui/react/spritesheet.svg?url&no-inline';
import {
	createMemoryHistory,
	createRootRoute,
	createRouter,
	RouterProvider,
} from '@tanstack/react-router';
import { act } from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import { afterEach, assert, expect, test, vi } from 'vite-plus/test';
import { cdp, commands, page, userEvent } from 'vite-plus/test/context';
import responsiveLayoutSource from '../examples/box/responsive-layout.tsx?raw';
import { ExampleBlock } from './example-block.js';
import { ExampleCodePreview } from './example-code-preview.js';
import { ExamplePreview } from './example-preview.js';
import { DocsThemeRoot } from './theme-controls.js';

let container: HTMLElement | undefined;
let root: Root | undefined;
const COPY_BUTTON_NAME_PATTERN = /^(Copy|Copied)$/;

afterEach(async () => {
	vi.unstubAllGlobals();
	if (root) act(() => root?.unmount());
	container?.remove();
	container = undefined;
	root = undefined;
	vi.restoreAllMocks();
	vi.useRealTimers();
	await emulateReducedMotion(false);
});

test('a missing example stays readable at mobile width', async () => {
	await page.viewport(400, 800);
	await renderExampleBlock({ src: 'missing/example', width: 360 });
	expect(page.getByText(/Failed to load example missing\/example/)).toBeVisible();
	expect(document.documentElement.scrollWidth).toBe(document.documentElement.clientWidth);
});

test('resizes the preview with pointer and keyboard, then resets it', async () => {
	await page.viewport(1000, 800);
	renderPreviewHarness();
	await waitForResizeInteraction();

	const resizeSeparator = separator();
	const initialWidth = previewWidth();
	await act(async () => {
		await commands.dragFromSeparator(-12, -400);
	});
	await expect.poll(previewWidth).toBeLessThan(initialWidth - 100);

	resizeSeparator.focus();
	const pointerWidth = previewWidth();
	await userEvent.keyboard('{ArrowLeft}');
	await expect.poll(previewWidth).toBeLessThan(pointerWidth);

	await act(async () => {
		resizeSeparator.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
	});
	await expect.poll(previewWidth).toBeGreaterThan(initialWidth - 1);
});

test('expands and collapses source by keyboard, reporting its state and keeping focus', async () => {
	await page.viewport(1000, 800);
	await renderExampleBlock({ src: 'box/responsive-layout', title: 'Box: Responsive layout' });

	expect(container?.querySelector('pre')).toBeTruthy();
	expect(page.getByRole('button', { name: 'Show code' }).query()).toBeNull();

	await expect.poll(() => page.getByRole('button', { name: 'Expand code' }).query()).toBeTruthy();
	const expand = page.getByRole('button', { name: 'Expand code' });
	expect(expand).toBeVisible();
	const codeFigure = () => {
		const figure = container?.querySelector('figure');
		assert(figure instanceof HTMLElement, 'expected code figure');
		return figure;
	};
	const collapsedHeight = codeFigure().getBoundingClientRect().height;
	const control = expand.element();
	const codeFrame = codeFigure().parentElement;
	assert(codeFrame, 'expected the example code frame');
	const regionRect = codeFrame.getBoundingClientRect();
	const controlRect = control.getBoundingClientRect();
	expect(controlRect.bottom).toBeLessThanOrEqual(regionRect.bottom + 1);
	expect(controlRect.top).toBeGreaterThanOrEqual(regionRect.top - 1);
	expect(control).toHaveAttribute('aria-expanded', 'false');
	control.focus();

	await act(async () => {
		await userEvent.keyboard('{Enter}');
	});
	await expect.poll(() => page.getByRole('button', { name: 'Collapse code' }).query()).toBeTruthy();
	await expect.element(control).toHaveFocus();
	expect(control).toHaveAttribute('aria-expanded', 'true');
	await expect
		.poll(() => codeFigure().getBoundingClientRect().height)
		.toBeGreaterThan(collapsedHeight);

	await act(async () => {
		await userEvent.keyboard(' ');
	});
	await expect.poll(() => page.getByRole('button', { name: 'Expand code' }).query()).toBeTruthy();
	await expect.element(control).toHaveFocus();
	expect(control).toHaveAttribute('aria-expanded', 'false');
	await expect
		.poll(() => codeFigure().getBoundingClientRect().height)
		.toBeCloseTo(collapsedHeight, 0);
});

test('copies the complete source from both collapsed and expanded previews', async () => {
	const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
	await page.viewport(1000, 800);
	await renderExampleBlock();
	// Fake only the revert timer, after the example has loaded: a real 1.5s timeout can fire
	// before `expect.element` starts polling on a slow runner, so "Copied" is never observed.
	vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });

	await act(async () => {
		await userEvent.click(page.getByRole('button', { name: 'Copy', exact: true }));
	});
	expect(writeText).toHaveBeenLastCalledWith(responsiveLayoutSource.trim());
	await expect.element(page.getByRole('button', { name: 'Copied' })).toBeVisible();

	await act(async () => {
		await userEvent.click(page.getByRole('button', { name: 'Expand code' }));
	});
	await act(async () => {
		await userEvent.click(page.getByRole('button', { name: COPY_BUTTON_NAME_PATTERN }));
	});
	expect(writeText).toHaveBeenCalledTimes(2);
	expect(writeText).toHaveBeenLastCalledWith(responsiveLayoutSource.trim());
});

for (const motion of ['full', 'reduced'] as const) {
	test(`collapsing a long example keeps its toggle where the reader pressed it with ${motion} motion`, async () => {
		await emulateReducedMotion(motion === 'reduced');
		await renderLongSourcePreview();
		const control = page.getByRole('button', { name: 'Expand code' }).element();
		assert(control instanceof HTMLElement, 'expected the code toggle');
		// A synchronous click lets the test inspect the transition before it ends.
		act(() => control.click());
		for (const transition of sourceElement().getAnimations()) transition.finish();

		control.scrollIntoView({ behavior: 'instant', block: 'center' });
		const topAtPress = control.getBoundingClientRect().top;
		const sourceGap = () =>
			control.getBoundingClientRect().top - sourceElement().getBoundingClientRect().bottom;
		const gapAtPress = sourceGap();
		act(() => control.click());
		expect(control).toHaveTextContent('Expand code');

		const transitions = sourceElement().getAnimations();
		expect(transitions).toHaveLength(motion === 'reduced' ? 0 : 1);
		for (const transition of transitions) {
			transition.pause();
			transition.currentTime = Number(transition.effect?.getComputedTiming().duration) / 2;
			expect(control.getBoundingClientRect().top).toBeCloseTo(topAtPress, 0);
			expect(sourceGap()).toBeCloseTo(gapAtPress, 0);
			transition.finish();
		}
		expect(control.getBoundingClientRect().top).toBeCloseTo(topAtPress, 0);
		expect(sourceGap()).toBeCloseTo(gapAtPress, 0);
		expect(sourceElement().scrollHeight).toBeGreaterThan(sourceElement().clientHeight);
	});
}

async function renderLongSourcePreview() {
	await page.viewport(1000, 800);
	const source = Array.from({ length: 200 }, () => 'const value = 1;').join('\n');
	container = document.body.appendChild(document.createElement('div'));
	root = createRoot(container);
	act(() => {
		root?.render(
			<Provider spritesheetHref={spriteSheetHref}>
				<header style={{ blockSize: '3.5rem', insetBlockStart: 0, position: 'sticky' }}>
					Sticky header
				</header>
				<p style={{ blockSize: '50vh' }}>Before</p>
				<ExampleCodePreview html={`<code>${source}</code>`} source={source} title="Long source" />
				<p style={{ blockSize: '100vh' }}>After</p>
			</Provider>,
		);
	});
}

async function emulateReducedMotion(reduce: boolean) {
	await cdp().send('Emulation.setEmulatedMedia', {
		features: reduce ? [{ name: 'prefers-reduced-motion', value: 'reduce' }] : [],
	});
}

function sourceElement() {
	const pre = container?.querySelector('pre');
	assert(pre, 'expected source element');
	return pre;
}

function renderPreviewHarness() {
	container = document.body.appendChild(document.createElement('div'));
	container.style.inlineSize = '800px';
	root = createRoot(container);
	act(() => {
		root?.render(
			<DocsThemeRoot>
				<ExamplePreview title="Resize harness">
					<div style={{ blockSize: '4rem' }} />
				</ExamplePreview>
			</DocsThemeRoot>,
		);
	});
}

function separator() {
	return page.getByRole('separator', { name: 'Resize harness preview' }).element();
}

function previewWidth() {
	const panel = container?.querySelector<HTMLElement>('[data-panel]');
	assert(panel, 'expected example preview panel');
	return panel.getBoundingClientRect().width;
}

async function waitForResizeInteraction() {
	await expect.poll(() => separator().getBoundingClientRect().width).toBe(1);
	await expect.poll(() => separator().getAttribute('aria-disabled')).toBeNull();
}

async function renderExampleBlock({
	src = 'box/responsive-layout',
	title = 'Box: Responsive layout',
	width = 800,
}: {
	src?: string;
	title?: string;
	width?: number;
} = {}) {
	const rootRoute = createRootRoute({
		component: () => (
			<Provider spritesheetHref={spriteSheetHref}>
				<DocsThemeRoot>
					<ExampleBlock src={src} title={title} />
				</DocsThemeRoot>
			</Provider>
		),
	});
	const router = createRouter({
		history: createMemoryHistory({ initialEntries: ['/'] }),
		routeTree: rootRoute,
	});

	container = document.body.appendChild(document.createElement('div'));
	container.style.inlineSize = `${width}px`;
	root = createRoot(container);
	await act(async () => {
		root?.render(<RouterProvider router={router} />);
		await router.load();
	});
	// The example module loads lazily behind Suspense. Poll inside repeated
	// `act` calls so the render React performs when the module resolves stays
	// wrapped, rather than waiting for it outside `act` and racing React's own
	// microtask continuation. The wait is bounded: a module that never
	// resolves fails here with the rendered state, instead of hanging the test.
	const deadline = Date.now() + 10_000;
	while (
		!container.querySelector('[data-panel]') &&
		!container.textContent?.includes('Failed to load example')
	) {
		if (Date.now() > deadline) {
			throw new Error(
				`Timed out waiting for the example module to load. Rendered: ${container.textContent ?? ''}`,
			);
		}
		// Each iteration must wait for the previous one before checking again,
		// so the resolution this polls for stays wrapped in `act`.
		// oxlint-disable-next-line no-await-in-loop
		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 10));
		});
	}
}
