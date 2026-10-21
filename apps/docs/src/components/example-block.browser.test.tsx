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
import { ExampleBlock, ExampleLoadingState } from './example-block.js';
import { ExampleCodePreview } from './example-code-preview.js';
import * as styles from './example-preview.css.js';
import { ExamplePreview } from './example-preview.js';
import { DocsThemeRoot } from './theme-controls.js';

let container: HTMLElement | undefined;
let root: Root | undefined;
const exampleTitle = 'Combobox Field: Basic';
const loadingLabel = `Loading ${exampleTitle} example`;
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

test('shows a named loading state in a frame that reserves the preview space', () => {
	renderExample(exampleTitle);

	const loadingState = page.getByRole('region', { name: loadingLabel });
	expect(page.getByRole('group', { name: exampleTitle }).query()).toBeNull();
	expect(page.getByText(exampleTitle, { exact: true })).toBeVisible();
	expect(page.getByRole('status', { name: loadingLabel })).toBeVisible();
	expect(loadingState.element().getBoundingClientRect().height).toBeGreaterThanOrEqual(96);

	const playgroundPlaceholder = page.getByText('Open in playground', { exact: true }).element();
	expect(playgroundPlaceholder.closest<HTMLElement>('[inert]')?.inert).toBe(true);
});

test('resizes a desktop preview from the inner grip down to its minimum width', async () => {
	await page.viewport(1000, 800);
	renderPreviewHarness();
	await waitForResizeInteraction();

	const widthBefore = previewWidth();
	expectGripInsidePreview();

	await commands.dragFromSeparator(-12, -400);
	await expect.poll(previewWidth).toBeLessThan(widthBefore - 100);
	expect(document.documentElement.scrollWidth).toBe(document.documentElement.clientWidth);

	await commands.dragFromSeparator(0, -1000);
	await expect.poll(previewWidth).toBeGreaterThanOrEqual(344);
	await expect.poll(previewWidth).toBeLessThanOrEqual(346);
	expect(previewCanvas().getBoundingClientRect().width).toBeGreaterThanOrEqual(320);
	expectGripInsidePreview();
	expect(document.documentElement.scrollWidth).toBe(document.documentElement.clientWidth);
	expect(separator().getBoundingClientRect().width).toBe(1);
});

test('does not change preview content width when resizability becomes established', async () => {
	await page.viewport(1000, 800);
	let firstLayoutCanvasWidth: number | undefined;
	renderPreviewHarness({
		onFirstLayout: (width) => {
			firstLayoutCanvasWidth ??= width;
		},
	});
	expect(firstLayoutCanvasWidth).toBeDefined();
	// Wait for the ResizeObserver to enable resizing, not only for CSS to show
	// the separator, so a late gutter would show up as a width change.
	await waitForResizeInteraction();
	expect(previewCanvas().getBoundingClientRect().width).toBeCloseTo(firstLayoutCanvasWidth!, 0);
});

test('keeps the preview resize grip inside the card and below a sticky page header', async () => {
	await page.viewport(1000, 800);
	renderPreviewHarness({ withStickyHeader: true });

	const header = container?.querySelector('header');
	assert(header, 'expected the sticky page header');
	const group = container?.querySelector<HTMLElement>('[data-group]');
	assert(group, 'expected preview group');
	await expect.poll(() => group.getBoundingClientRect().width).toBeGreaterThanOrEqual(640);
	await waitForResizeInteraction();
	const resizeSeparator = separator();

	resizeSeparator.scrollIntoView({ block: 'center' });
	const separatorCenterY =
		resizeSeparator.getBoundingClientRect().top +
		resizeSeparator.getBoundingClientRect().height / 2;
	const headerBefore = header.getBoundingClientRect();
	window.scrollBy(0, separatorCenterY - (headerBefore.top + headerBefore.height / 2));

	const headerBox = header.getBoundingClientRect();
	const separatorBox = resizeSeparator.getBoundingClientRect();
	const overlapX = separatorBox.left - 12;
	const overlapY = headerBox.top + headerBox.height / 2;

	expect(overlapY).toBeGreaterThanOrEqual(headerBox.top);
	expect(overlapY).toBeLessThanOrEqual(headerBox.bottom);
	expect(document.elementFromPoint(overlapX, overlapY)).toBe(header);
});

test('keyboard resize and double-click reset work without losing width on code expansion', async () => {
	await page.viewport(1000, 800);
	await renderExampleBlock();
	await waitForResizeInteraction();
	separator().focus();
	expect(document.activeElement).toBe(separator());
	const before = previewWidth();
	await userEvent.keyboard('{ArrowLeft}');
	await expect.poll(previewWidth).toBeLessThan(before);

	const resized = previewWidth();
	await expect.poll(() => page.getByRole('button', { name: 'Expand code' }).query()).toBeTruthy();
	await act(async () => {
		await userEvent.click(page.getByRole('button', { name: 'Expand code' }));
	});
	await expect.element(page.getByRole('button', { name: 'Collapse code' })).toBeVisible();
	await expect.poll(previewWidth).toBeCloseTo(resized, 0);
	expectGripInsidePreview();
	await act(async () => {
		await userEvent.click(page.getByRole('button', { name: 'Collapse code' }));
	});
	await expect.element(page.getByRole('button', { name: 'Expand code' })).toBeVisible();
	await expect.poll(previewWidth).toBeCloseTo(resized, 0);

	separator().dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
	await expect.poll(previewWidth).toBeGreaterThan(before - 1);
});

test('narrow cards use the whole preview width and hide the resize control', async () => {
	await page.viewport(1000, 800);
	renderPreviewHarness({ width: 400 });
	const resizeSeparator = container?.querySelector<HTMLElement>('[data-separator]');
	assert(resizeSeparator, 'expected resize separator');
	await expect.poll(() => resizeSeparator.getBoundingClientRect().width).toBe(0);
	expect(previewWidth()).toBeCloseTo(400, 0);
	expect(previewCanvas().getBoundingClientRect().width).toBeCloseTo(400, 0);
	expect(document.documentElement.scrollWidth).toBe(document.documentElement.clientWidth);
});

test('wide cards hide resize chrome below the desktop viewport breakpoint', async () => {
	await page.viewport(700, 800);
	renderPreviewHarness({ width: 800 });
	const resizeSeparator = container?.querySelector<HTMLElement>('[data-separator]');
	assert(resizeSeparator, 'expected resize separator');
	await expect.poll(() => resizeSeparator.getBoundingClientRect().width).toBe(0);
	expect(previewWidth()).toBeCloseTo(800, 0);
	expect(previewCanvas().getBoundingClientRect().width).toBeCloseTo(800, 0);
});

test('a resized preview returns to full width when its card becomes narrow', async () => {
	await page.viewport(1000, 800);
	renderPreviewHarness();
	await waitForResizeInteraction();
	await commands.dragFromSeparator(0, -200);
	await expect.poll(previewWidth).toBeLessThan(700);
	assert(container, 'expected preview container');
	container.style.inlineSize = '400px';
	await expect.poll(previewWidth).toBeCloseTo(400, 0);
	expect(previewCanvas().getBoundingClientRect().width).toBeCloseTo(400, 0);
});

test('the mobile card header keeps a long title and playground action without page overflow', async () => {
	await page.viewport(400, 800);
	await renderExampleBlock({
		src: 'button/basic',
		title: 'Box: Responsive layout with a deliberately long heading',
		width: 360,
	});
	const titleText = 'Box: Responsive layout with a deliberately long heading';
	expect(page.getByText(titleText)).toBeVisible();
	expect(page.getByRole('link', { name: 'Open in playground' })).toBeVisible();
	expect(page.getByRole('button', { name: 'Show code' }).query()).toBeNull();
	expect(document.documentElement.scrollWidth).toBe(document.documentElement.clientWidth);

	const code = container?.querySelector('pre');
	expect(code).toBeTruthy();
	expect(document.documentElement.scrollWidth).toBe(document.documentElement.clientWidth);
});

test('the mobile playground action is keyboard accessible', async () => {
	await page.viewport(400, 800);
	const titleText = 'Box: Responsive layout with a deliberately long heading';
	await renderExampleBlock({ src: 'button/basic', title: titleText, width: 360 });
	const playground = page.getByRole('link', { name: 'Open in playground' }).element();
	await userEvent.tab();
	await expect.element(playground).toHaveFocus();
});

test('a missing example stays readable at mobile width', async () => {
	await page.viewport(400, 800);
	await renderExampleBlock({ src: 'missing/example', width: 360 });
	expect(page.getByText(/Failed to load example missing\/example/)).toBeVisible();
	expect(document.documentElement.scrollWidth).toBe(document.documentElement.clientWidth);
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

test('keeps the focus rings of code controls inside the example frame', async () => {
	await page.viewport(400, 800);
	await renderExampleBlock({ width: 360 });
	const expand = page.getByRole('button', { name: 'Expand code' });
	await expect.element(expand).toBeVisible();
	// Keyboard input makes programmatic focus show its ring.
	await userEvent.keyboard('{Shift}');

	const copy = page.getByRole('button', { name: 'Copy', exact: true }).element();
	copy.focus();
	expectFocusRingUnclipped(copy);
	expand.element().focus();
	expectFocusRingUnclipped(expand.element());

	await act(async () => {
		await userEvent.click(expand);
	});
	const collapse = page.getByRole('button', { name: 'Collapse code' });
	await expect.element(collapse).toBeVisible();
	await userEvent.keyboard('{Shift}');
	collapse.element().focus();
	expectFocusRingUnclipped(collapse.element());
	const viewport = codeRegion('Box: Responsive layout code');
	viewport.focus();
	expectFocusRingUnclipped(viewport);
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

test('collapsed source stays in the accessibility tree and can be scrolled sideways by keyboard', async () => {
	await page.viewport(400, 800);
	await renderExampleBlock({ width: 360 });
	const codeLabel = 'Box: Responsive layout code';
	await expect.element(page.getByRole('button', { name: 'Expand code' })).toBeVisible();

	// Role queries ignore `inert` and `aria-hidden`, so check the ancestors directly.
	const viewport = codeRegion(codeLabel);
	expect(viewport.closest('[inert], [aria-hidden="true"]')).toBeNull();
	for (let node: Element | null = viewport; node; node = node.parentElement) {
		expect(node.matches('[inert], [aria-hidden="true"]')).toBe(false);
	}
	const lines = sourceElement().textContent?.split('\n') ?? [];
	expect(lines.length).toBeGreaterThan(6);
	expect(sourceElement().textContent).toContain(lines[6] ?? '');
	expect(sourceElement().scrollHeight).toBeGreaterThan(sourceElement().clientHeight);

	const copy = page.getByRole('button', { name: 'Copy', exact: true }).element();
	copy.focus();
	await userEvent.tab();
	await expect.element(viewport).toHaveFocus();
	await userEvent.keyboard('{ArrowRight}');
	await expect.poll(() => viewport.scrollLeft).toBeGreaterThan(0);
	await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');
	expect(viewport.scrollTop).toBe(0);
	expect(sourceElement().scrollTop).toBe(0);
	await userEvent.tab();
	await expect.element(page.getByRole('button', { name: 'Expand code' })).toHaveFocus();
});

test('expanded source is a keyboard-scrollable region that does not reveal clipped lines', async () => {
	await page.viewport(400, 800);
	await renderExampleBlock({ width: 360 });
	const copy = page.getByRole('button', { name: 'Copy', exact: true }).element();
	await expect.element(page.getByRole('button', { name: 'Expand code' })).toBeVisible();
	await act(async () => {
		await userEvent.click(page.getByRole('button', { name: 'Expand code' }));
	});
	await expect.element(page.getByRole('button', { name: 'Collapse code' })).toBeVisible();

	const viewport = codeRegion('Box: Responsive layout code');
	copy.focus();
	await userEvent.tab();
	await expect.element(viewport).toHaveFocus();
	await userEvent.keyboard('{ArrowRight}');
	await expect.poll(() => viewport.scrollLeft).toBeGreaterThan(0);
	expect(viewport.scrollHeight).toBeLessThanOrEqual(viewport.clientHeight + 1);

	await act(async () => {
		await userEvent.click(page.getByRole('button', { name: 'Collapse code' }));
	});
	await expect.element(page.getByRole('button', { name: 'Expand code' })).toBeVisible();
	expect(viewport.scrollTop).toBe(0);
	expect(sourceElement().scrollTop).toBe(0);
	expect(viewport.closest('[inert], [aria-hidden="true"]')).toBeNull();
});

test('names a loaded frame as a group by its title', async () => {
	await renderExampleBlock();
	expect(
		page.getByRole('group', { exact: true, name: 'Box: Responsive layout' }).query(),
	).toBeTruthy();
	expect(page.getByRole('region', { name: 'Loading', exact: false }).query()).toBeNull();
});

test('omits expand controls when the source already fits the collapsed preview', async () => {
	await page.viewport(1000, 800);
	await renderExampleBlock({ src: 'button/basic', title: 'Button: Basic' });

	expect(container?.querySelector('pre')).toBeTruthy();
	expect(page.getByRole('button', { name: 'Expand code' }).query()).toBeNull();
	expect(page.getByRole('button', { name: 'Collapse code' }).query()).toBeNull();
	expect(page.getByRole('button', { name: 'Copy' })).toBeVisible();
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

test('narrowing the preview panel flips a responsive example below its container breakpoint', async () => {
	await page.viewport(1000, 800);
	// Wide enough that the canvas @container stays ≥768 after the 12px outside
	// strip, 1px separator, and pe-6 gutter — so the example starts as a row.
	await renderExampleBlock({ width: 820 });

	await expect.poll(flexDirection).toBe('row');
	await waitForResizeInteraction();

	await commands.dragFromSeparator(0, -500);
	await expect.poll(previewWidth).toBeLessThan(768);
	await expect.poll(flexDirection).toBe('column');
});

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

function codeRegion(name: string) {
	const region = page.getByRole('region', { name }).element();
	assert(region instanceof HTMLElement, 'expected code region');
	return region;
}

/** Asserts the focus ring is drawn and no overflow ancestor clips it. */
function expectFocusRingUnclipped(element: HTMLElement | SVGElement) {
	expect(element).toHaveFocus();
	expect(element.matches(':focus-visible')).toBe(true);
	const { outlineOffset, outlineWidth } = getComputedStyle(element);
	const extent = Math.max(0, Number.parseFloat(outlineOffset) + Number.parseFloat(outlineWidth));
	const rect = element.getBoundingClientRect();
	// Room between the ring and each overflow clip edge. Negative means the ring is cut off.
	const gaps: Array<number> = [];
	for (
		let ancestor = element.parentElement;
		ancestor && ancestor !== container;
		ancestor = ancestor.parentElement
	) {
		const { overflowX, overflowY } = getComputedStyle(ancestor);
		const clip = ancestor.getBoundingClientRect();
		if (overflowX !== 'visible') {
			gaps.push(rect.left - extent - clip.left, clip.right - (rect.right + extent));
		}
		if (overflowY !== 'visible') {
			gaps.push(rect.top - extent - clip.top, clip.bottom - (rect.bottom + extent));
		}
	}
	expect(gaps.length).toBeGreaterThan(0);
	expect(Math.min(...gaps)).toBeGreaterThanOrEqual(-0.5);
}

function sourceElement() {
	const pre = container?.querySelector('pre');
	assert(pre, 'expected source element');
	return pre;
}

function renderExample(title: string) {
	container = document.body.appendChild(document.createElement('div'));
	root = createRoot(container);
	act(() => {
		root?.render(
			<Provider spritesheetHref={spriteSheetHref}>
				<ExampleLoadingState layout="full-bleed" title={title} />
			</Provider>,
		);
	});
}

// Renders `ExamplePreview` directly with a static child instead of going
// through `ExampleBlock`'s lazily-loaded example module, so the resize
// mechanics under test do not depend on a Suspense boundary resolving.
function renderPreviewHarness({
	width = 800,
	withStickyHeader = false,
	onFirstLayout,
}: {
	width?: number;
	withStickyHeader?: boolean;
	/** Fires during commit (ref callback), before ResizeObserver enables resizing. */
	onFirstLayout?: (canvasWidth: number) => void;
} = {}) {
	container = document.body.appendChild(document.createElement('div'));
	container.style.inlineSize = withStickyHeader ? '100%' : `${width}px`;
	root = createRoot(container);
	act(() => {
		root?.render(
			<DocsThemeRoot>
				<div>
					{withStickyHeader ? (
						<header
							style={{
								backgroundColor: 'var(--luke-color-surface-base)',
								blockSize: '3.5rem',
								position: 'sticky',
								top: 0,
								zIndex: 10,
							}}
						>
							Page header
						</header>
					) : null}
					<article
						style={withStickyHeader ? { inlineSize: '800px', maxInlineSize: 'none' } : undefined}
					>
						<div style={withStickyHeader ? { inlineSize: '800px' } : undefined}>
							<ExamplePreview title="Resize harness">
								<div
									ref={(node) => {
										if (!node || !onFirstLayout) return;
										const canvas = node.closest(`.${styles.previewCanvas}`)?.firstElementChild;
										if (canvas instanceof HTMLElement) {
											onFirstLayout(canvas.getBoundingClientRect().width);
										}
									}}
									style={{ blockSize: withStickyHeader ? '16rem' : '4rem' }}
								/>
							</ExamplePreview>
						</div>
					</article>
					{withStickyHeader ? <div style={{ blockSize: '100vh' }} /> : null}
				</div>
			</DocsThemeRoot>,
		);
	});
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

function getPreviewPanel(): HTMLElement {
	const panel = container?.querySelector<HTMLElement>('[data-panel]');
	assert(panel, 'expected the example preview panel');
	return panel;
}

function previewWidth() {
	return getPreviewPanel().getBoundingClientRect().width;
}

function previewCanvas() {
	const panelContent = getPreviewPanel().querySelector<HTMLElement>(`.${styles.previewCanvas}`);
	const canvas = panelContent?.firstElementChild;
	assert(canvas instanceof HTMLElement, 'expected preview canvas');
	return canvas;
}

function resizeGrip() {
	const grip = separator().querySelector<HTMLElement>('[data-example-preview-grip]');
	assert(grip, 'expected resize grip');
	return grip;
}

function expectGripInsidePreview() {
	const divider = separator().getBoundingClientRect();
	const grip = resizeGrip().getBoundingClientRect();
	const canvasRight = previewCanvas().getBoundingClientRect().right;
	const group = getPreviewPanel().parentElement?.getBoundingClientRect();
	assert(group, 'expected panel group');
	// The grip is centred on the 1px separator and straddles into the outside strip.
	// The outside panel keeps ≥12px so the full grip stays inside the card.
	expect(grip.left).toBeGreaterThan(canvasRight - 1);
	expect(grip.left).toBeLessThan(divider.left + 1);
	expect(grip.right).toBeGreaterThan(divider.right - 1);
	const dividerCenterX = divider.left + divider.width / 2;
	const gripCenterX = grip.left + grip.width / 2;
	expect(Math.abs(gripCenterX - dividerCenterX)).toBeLessThanOrEqual(2);
	expect(grip.top).toBeGreaterThan(group.top);
	expect(grip.bottom).toBeLessThan(group.bottom);
	const card = getPreviewPanel().closest('[data-example-frame]')?.getBoundingClientRect() ?? group;
	expect(grip.left).toBeGreaterThan(card.left);
	expect(grip.right).toBeLessThanOrEqual(card.right);
	expect(card.right - grip.right).toBeGreaterThanOrEqual(4);
	expect(grip.top).toBeGreaterThan(card.top);
	expect(grip.bottom).toBeLessThan(card.bottom);
}

function separator() {
	return page.getByRole('separator', { name: /preview/ }).element();
}

/** CSS may show the separator before ResizeObserver enables the group. */
async function waitForResizeInteraction() {
	await expect.poll(() => separator().getBoundingClientRect().width).toBe(1);
	await expect.poll(() => separator().getAttribute('aria-disabled')).toBeNull();
}

function flexDirection() {
	const label = Array.from(getPreviewPanel().querySelectorAll('span')).find(
		(element) => element.textContent === 'Item',
	);
	const row = label?.parentElement?.parentElement;
	assert(row, 'expected the responsive-layout row element');
	return getComputedStyle(row).flexDirection;
}
