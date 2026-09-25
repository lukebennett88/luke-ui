import '../styles/app.css';
import '@luke-ui/react/themes/tactile/stylesheet.css';
import { IconSpritesheetProvider } from '@luke-ui/react/icon';
import spriteSheetHref from '@luke-ui/react/spritesheet.svg?url&no-inline';
import { themeClassName as tactileThemeClassName } from '@luke-ui/react/themes/tactile';
import {
	createMemoryHistory,
	createRootRoute,
	createRouter,
	RouterProvider,
} from '@tanstack/react-router';
import { ThemeProvider } from 'next-themes';
import { act } from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import { afterEach, assert, expect, test } from 'vite-plus/test';
import { commands, page, userEvent } from 'vite-plus/test/context';
import { ExampleBlock, ExampleLoadingState, ExamplePreview } from './example-block';
import { DocsThemeRoot } from './theme-controls.js';

let container: HTMLElement | undefined;
let root: Root | undefined;
const exampleTitle = 'Combobox Field: Basic';
const loadingLabel = `Loading ${exampleTitle} example`;

afterEach(() => {
	if (root) act(() => root?.unmount());
	container?.remove();
	container = undefined;
	root = undefined;
});

test('shows a named loading state in a frame that reserves the preview space', () => {
	renderExample(exampleTitle);

	const loadingState = page.getByRole('region', { name: loadingLabel });
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
	// Wait until JS enables resize (post-ResizeObserver), not merely until CSS
	// shows the separator — that is the race that used to inject the gutter.
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
	await expect.poll(() => getComputedStyle(resizeGrip()).boxShadow).not.toBe('none');
	const before = previewWidth();
	await userEvent.keyboard('{ArrowLeft}');
	await expect.poll(previewWidth).toBeLessThan(before);

	const resized = previewWidth();
	await userEvent.click(page.getByRole('button', { name: 'Show code' }));
	await expect.poll(previewWidth).toBeCloseTo(resized, 0);
	expectGripInsidePreview();
	await userEvent.click(page.getByRole('button', { name: 'Hide code' }));
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

test('the mobile card header scrolls complete controls without page overflow', async () => {
	await page.viewport(400, 800);
	await renderExampleBlock({
		src: 'button/basic',
		title: 'Box: Responsive layout with a deliberately long heading',
		width: 360,
	});
	const titleText = 'Box: Responsive layout with a deliberately long heading';
	const title = page.getByText(titleText).element();
	const playground = page.getByText('Open in playground', { exact: true }).element();
	expect(playground.closest('a, button')).not.toBeNull();
	const showCode = page.getByRole('button', { name: 'Show code' }).element();
	const headerRegion = page.getByRole('region', { name: titleText });
	await expect.poll(() => headerRegion.query()).toBeTruthy();
	const header = headerRegion.element();
	assert(header instanceof HTMLElement, 'expected header region');
	expect(header.tabIndex).toBe(0);
	expect(header.scrollWidth).toBeGreaterThan(header.clientWidth);
	expect(title.getBoundingClientRect().width).toBeGreaterThan(300);
	expect(title.getBoundingClientRect().height).toBeLessThan(30);
	expect(playground.getBoundingClientRect().height).toBeLessThan(40);
	expect(showCode.getBoundingClientRect().height).toBeLessThan(40);
	expect(document.documentElement.scrollWidth).toBe(document.documentElement.clientWidth);

	showCode.focus();
	expect(document.activeElement).toBe(showCode);
	await userEvent.keyboard('{Enter}');
	await expect.poll(() => page.getByRole('button', { name: 'Hide code' }).element()).toBeTruthy();
	const code = container?.querySelector('pre');
	expect(code).toBeTruthy();
	expect(document.documentElement.scrollWidth).toBe(document.documentElement.clientWidth);
});

test('the frame does not clip the scrollable header focus ring', async () => {
	await page.viewport(400, 800);
	const titleText = 'Box: Responsive layout with a deliberately long heading';
	await renderExampleBlock({ src: 'button/basic', title: titleText, width: 360 });
	const headerRegion = page.getByRole('region', { name: titleText });
	await expect.poll(() => headerRegion.query()).toBeTruthy();
	const header = headerRegion.element();
	assert(header instanceof HTMLElement, 'expected header region');

	header.focus({ focusVisible: true });
	expect(document.activeElement).toBe(header);
	expect(header.matches(':focus-visible')).toBe(true);
	const headerStyle = getComputedStyle(header);
	expect(headerStyle.outlineStyle).toBe('solid');
	expect(Number.parseFloat(headerStyle.outlineWidth)).toBeGreaterThan(0);
	expect(headerStyle.outlineOffset).toBe('2px');

	const frame = header.parentElement;
	assert(frame, 'expected the example frame');
	const frameStyle = getComputedStyle(frame);
	for (const overflow of [frameStyle.overflow, frameStyle.overflowX, frameStyle.overflowY]) {
		expect(overflow).not.toMatch(/hidden|clip/);
	}
});

test('a missing example stays readable at mobile width', async () => {
	await page.viewport(400, 800);
	await renderExampleBlock({ src: 'missing/example', width: 360 });
	expect(page.getByText(/Failed to load example missing\/example/)).toBeVisible();
	expect(document.documentElement.scrollWidth).toBe(document.documentElement.clientWidth);
});

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

function renderExample(title: string) {
	container = document.body.appendChild(document.createElement('div'));
	container.className = `luke-ui-theme ${tactileThemeClassName}`;
	root = createRoot(container);
	act(() => {
		root?.render(
			<IconSpritesheetProvider href={spriteSheetHref}>
				<ExampleLoadingState layout="full-bleed" title={title} />
			</IconSpritesheetProvider>,
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
	/** Fires during commit (ref callback), before ResizeObserver updates cardWidth. */
	onFirstLayout?: (canvasWidth: number) => void;
} = {}) {
	container = document.body.appendChild(document.createElement('div'));
	container.className = `luke-ui-theme ${tactileThemeClassName}`;
	container.style.inlineSize = withStickyHeader ? '100%' : `${width}px`;
	root = createRoot(container);
	act(() => {
		root?.render(
			<DocsThemeRoot>
				<div id={withStickyHeader ? 'nd-notebook-layout' : undefined}>
					{withStickyHeader ? (
						<header className="sticky top-0 z-10 bg-fd-background" style={{ blockSize: '3.5rem' }}>
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
										const canvas = node.closest('.example-preview-canvas')?.firstElementChild;
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
}: { src?: string; title?: string; width?: number } = {}) {
	const rootRoute = createRootRoute({
		component: () => (
			<ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
				<IconSpritesheetProvider href={spriteSheetHref}>
					<DocsThemeRoot>
						<ExampleBlock src={src} title={title} />
					</DocsThemeRoot>
				</IconSpritesheetProvider>
			</ThemeProvider>
		),
	});
	const router = createRouter({
		history: createMemoryHistory({ initialEntries: ['/'] }),
		routeTree: rootRoute,
	});

	container = document.body.appendChild(document.createElement('div'));
	container.className = `luke-ui-theme ${tactileThemeClassName}`;
	container.style.inlineSize = `${width}px`;
	root = createRoot(container);
	await act(async () => {
		root?.render(<RouterProvider router={router} />);
		await router.load();
	});
	// The example module loads lazily behind Suspense. Poll inside repeated
	// `act` calls so the render React performs when the module resolves stays
	// wrapped, rather than waiting for it outside `act` and racing React's own
	// microtask continuation.
	while (
		!container.querySelector('[data-panel]') &&
		!container.textContent?.includes('Failed to load example')
	) {
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
	const panelContent = getPreviewPanel().querySelector<HTMLElement>('.example-preview-canvas');
	const canvas = panelContent?.firstElementChild;
	assert(canvas instanceof HTMLElement, 'expected preview canvas');
	return canvas;
}

function resizeGrip() {
	const grip = separator().querySelector<HTMLElement>('.example-preview-grip');
	assert(grip, 'expected resize grip');
	return grip;
}

function expectGripInsidePreview() {
	const divider = separator().getBoundingClientRect();
	const grip = resizeGrip().getBoundingClientRect();
	const canvasRight = previewCanvas().getBoundingClientRect().right;
	const group = getPreviewPanel().parentElement?.getBoundingClientRect();
	assert(group, 'expected panel group');
	// Grip is centered on the 1px separator and straddles into the outside strip.
	// The outside panel keeps ≥12px so the full grip stays inside the card.
	expect(grip.left).toBeGreaterThan(canvasRight - 1);
	expect(grip.left).toBeLessThan(divider.left + 1);
	expect(grip.right).toBeGreaterThan(divider.right - 1);
	const dividerCenterX = divider.left + divider.width / 2;
	const gripCenterX = grip.left + grip.width / 2;
	expect(Math.abs(gripCenterX - dividerCenterX)).toBeLessThanOrEqual(2);
	expect(grip.top).toBeGreaterThan(group.top);
	expect(grip.bottom).toBeLessThan(group.bottom);
	const card = getPreviewPanel().closest('.not-prose')?.getBoundingClientRect() ?? group;
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
