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
import * as shellStyles from './docs-shell.css.js';
import { ExampleBlock, ExampleLoadingState } from './example-block.js';
import { ExampleCodePreview } from './example-code-preview.js';
import * as styles from './example-preview.css.js';
import { ExamplePreview } from './example-preview.js';
import { SITE_HEADER_BLOCK_SIZE } from './site-header-size.js';
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
	await page.viewport(1000, 800);
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
	const restingShadow = getComputedStyle(resizeGrip()).boxShadow;
	separator().focus();
	expect(document.activeElement).toBe(separator());
	await expect.poll(() => getComputedStyle(resizeGrip()).boxShadow).not.toBe(restingShadow);
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

test('shows source by default and expands it by keyboard while retaining control focus', async () => {
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
	// The toggle is visual only: the full source is always in the accessibility tree.
	expect(control).not.toHaveAttribute('aria-expanded');
	expect(control).not.toHaveAttribute('aria-controls');
	control.focus();

	await act(async () => {
		await userEvent.keyboard('{Enter}');
	});
	await expect.poll(() => page.getByRole('button', { name: 'Collapse code' }).query()).toBeTruthy();
	await expect.element(control).toHaveFocus();
	expect(control).not.toHaveAttribute('aria-expanded');
	expect(control).not.toHaveAttribute('aria-controls');
	await expect
		.poll(() => codeFigure().getBoundingClientRect().height)
		.toBeGreaterThan(collapsedHeight);

	await act(async () => {
		await userEvent.keyboard(' ');
	});
	await expect.poll(() => page.getByRole('button', { name: 'Expand code' }).query()).toBeTruthy();
	await expect.element(control).toHaveFocus();
	expect(control).not.toHaveAttribute('aria-expanded');
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

test('keeps expanded source collapsible when its typography changes to fit', async () => {
	await page.viewport(1000, 800);
	const source = Array.from({ length: 20 }, () => 'const value = 1;').join('\n');
	container = document.body.appendChild(document.createElement('div'));
	root = createRoot(container);
	act(() => {
		root?.render(
			<Provider spritesheetHref={spriteSheetHref}>
				<ExampleCodePreview html={`<code>${source}</code>`} source={source} title="Source sizing" />
			</Provider>,
		);
	});
	await expect.element(page.getByRole('button', { name: 'Expand code' })).toBeVisible();
	await act(async () => {
		await userEvent.click(page.getByRole('button', { name: 'Expand code' }));
	});
	const collapse = page.getByRole('button', { name: 'Collapse code' });
	await expect.element(collapse).toBeVisible();
	const pre = container.querySelector('pre');
	assert(pre, 'expected source element');
	pre.style.fontSize = '1px';
	pre.style.lineHeight = '1px';
	// Border box stays at the collapsed floor while animatable; content size is what fits.
	await expect.poll(() => sourceContentBlockSize(pre)).toBeLessThan(30);
	expect(collapse).not.toHaveAttribute('aria-expanded');
	await act(async () => {
		await userEvent.click(collapse);
	});
	await expect.poll(() => page.getByRole('button', { name: 'Expand code' }).query()).toBeNull();
	await expect.poll(() => collapse.query()).toBeNull();

	pre.style.removeProperty('font-size');
	pre.style.removeProperty('line-height');
	await expect.element(page.getByRole('button', { name: 'Expand code' })).toBeVisible();
});

test('collapsed source drops its toggle when typography makes it fit, and restores it after', async () => {
	await renderSourcePreview();
	await expect.element(page.getByRole('button', { name: 'Expand code' })).toBeVisible();
	expect(sourceElement().scrollHeight).toBeGreaterThan(sourceElement().clientHeight + 1);

	shrinkTypography(sourceElement());
	await expect.poll(() => page.getByRole('button', { name: 'Expand code' }).query()).toBeNull();
	expect(sourceElement().scrollHeight).toBeLessThanOrEqual(sourceElement().clientHeight + 1);

	sourceElement().style.removeProperty('font-size');
	sourceElement().style.removeProperty('line-height');
	await expect.element(page.getByRole('button', { name: 'Expand code' })).toBeVisible();
});

test('collapsing clipped source with Enter keeps focus on the toggle', async () => {
	await renderSourcePreview();
	const expand = page.getByRole('button', { name: 'Expand code' });
	await expect.element(expand).toBeVisible();
	expand.element().focus();
	await pressKey('{Enter}');
	const collapse = page.getByRole('button', { name: 'Collapse code' });
	await expect.element(collapse).toHaveFocus();

	await pressKey('{Enter}');
	await expect.element(page.getByRole('button', { name: 'Expand code' })).toHaveFocus();
});

test('collapsing source that now fits with Enter moves focus to Copy', async () => {
	await renderSourcePreview();
	const expand = page.getByRole('button', { name: 'Expand code' });
	await expect.element(expand).toBeVisible();
	expand.element().focus();
	await pressKey('{Enter}');
	await expect.element(page.getByRole('button', { name: 'Collapse code' })).toHaveFocus();
	shrinkTypography(sourceElement());
	await expect.poll(() => sourceContentBlockSize(sourceElement())).toBeLessThan(30);

	await pressKey('{Enter}');
	await expect.poll(() => page.getByRole('button', { name: 'Collapse code' }).query()).toBeNull();
	await expect.poll(() => page.getByRole('button', { name: 'Expand code' }).query()).toBeNull();
	await expect.element(page.getByRole('button', { name: COPY_BUTTON_NAME_PATTERN })).toHaveFocus();
});

test('collapse with Enter respects focus moving away before commit', async () => {
	await renderSourcePreview({ withNextControl: true });
	const expand = page.getByRole('button', { name: 'Expand code' });
	await expect.element(expand).toBeVisible();
	expand.element().focus();
	await pressKey('{Enter}');
	const collapse = page.getByRole('button', { name: 'Collapse code' });
	await expect.element(collapse).toHaveFocus();
	shrinkTypography(sourceElement());
	await expect.poll(() => sourceContentBlockSize(sourceElement())).toBeLessThan(30);

	const next = page.getByRole('button', { name: 'Next example' }).element();
	// Redirect focus during the native activation event, before another browser task can run.
	collapse.element().addEventListener('keyup', () => next.focus(), { once: true });
	vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', false);
	await userEvent.keyboard('{Enter}');
	await expect.poll(() => collapse.query()).toBeNull();
	await expect.element(page.getByRole('button', { name: 'Next example' })).toHaveFocus();
});

test('collapse with Enter respects focus returning before commit', async () => {
	await renderSourcePreview({ withNextControl: true });
	const expand = page.getByRole('button', { name: 'Expand code' });
	await expect.element(expand).toBeVisible();
	expand.element().focus();
	await pressKey('{Enter}');
	const collapse = page.getByRole('button', { name: 'Collapse code' });
	await expect.element(collapse).toHaveFocus();
	shrinkTypography(sourceElement());
	await expect.poll(() => sourceContentBlockSize(sourceElement())).toBeLessThan(30);

	const control = collapse.element();
	const next = page.getByRole('button', { name: 'Next example' }).element();
	control.addEventListener(
		'keyup',
		() => {
			next.focus();
			control.focus();
		},
		{ once: true },
	);
	vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', false);
	await userEvent.keyboard('{Enter}');
	await expect.poll(() => collapse.query()).toBeNull();
	await expect.element(page.getByRole('button', { name: COPY_BUTTON_NAME_PATTERN })).toHaveFocus();
});

test('collapsing long source keeps the toggle where the reader left it', async () => {
	await renderSourcePreview({ lineCount: 200, withSpaceBelow: true, withStickyHeader: true });
	await userEvent.click(page.getByRole('button', { name: 'Expand code' }));
	const collapse = page.getByRole('button', { name: 'Collapse code' });
	await expect.element(collapse).toBeVisible();
	const control = collapse.element();
	const header = docsSiteHeader();
	// Scroll the expanded source under the sticky header so only the toggle remains in view.
	window.scrollBy({
		behavior: 'instant',
		top: control.getBoundingClientRect().top - (header.getBoundingClientRect().bottom + 16),
	});
	expect(sourceElement().getBoundingClientRect().top).toBeLessThan(
		header.getBoundingClientRect().bottom,
	);
	expect(sourceElement().getBoundingClientRect().bottom).toBeLessThan(
		control.getBoundingClientRect().top + 24,
	);
	// Prefer keyboard activation: a pointer click can scroll the toggle under the sticky header
	// and leave too little scroll room for full compensation.
	control.focus();
	let topAtPress: number | undefined;
	control.addEventListener(
		'keydown',
		() => {
			topAtPress = control.getBoundingClientRect().top;
		},
		{ once: true },
	);

	await pressKey('{Enter}');
	await expect.element(page.getByRole('button', { name: 'Expand code' })).toBeVisible();
	assert(topAtPress != null, 'expected the toggle to be pressed');
	expect(Math.abs(control.getBoundingClientRect().top - topAtPress)).toBeLessThanOrEqual(1);
});

test('collapsing with the source top still visible keeps the toggle stationary', async () => {
	await renderSourcePreview({
		lineCount: 16,
		withHeading: true,
		withSpaceAbove: '40rem',
		withSpaceBelow: true,
		withStickyHeader: true,
	});
	await expect.element(page.getByRole('button', { name: 'Expand code' })).toBeVisible();
	await act(async () => {
		await userEvent.click(page.getByRole('button', { name: 'Expand code' }));
	});
	const collapse = page.getByRole('button', { name: 'Collapse code' });
	await expect.element(collapse).toBeVisible();
	const control = collapse.element();
	const headerBottom = docsSiteHeader().getBoundingClientRect().bottom;
	// Expanding scroll-pins the sill, which can lift the source under the header. Reposition so the
	// source top is visible again, with room above to pin on collapse.
	window.scrollBy({
		behavior: 'instant',
		top: sourceElement().getBoundingClientRect().top - (headerBottom + 24),
	});
	expect(sourceElement().getBoundingClientRect().top).toBeGreaterThan(headerBottom);
	expect(control.getBoundingClientRect().bottom).toBeLessThan(window.innerHeight);
	expect(window.scrollY).toBeGreaterThan(
		control.getBoundingClientRect().top - sourceElement().getBoundingClientRect().top,
	);
	control.focus();
	let topAtPress: number | undefined;
	control.addEventListener(
		'keydown',
		() => {
			topAtPress = control.getBoundingClientRect().top;
		},
		{ once: true },
	);

	await pressKey('{Enter}');
	await expect.element(page.getByRole('button', { name: 'Expand code' })).toBeVisible();
	assert(topAtPress != null, 'expected the toggle to be pressed');
	expect(Math.abs(control.getBoundingClientRect().top - topAtPress)).toBeLessThanOrEqual(1);
});

test('collapsing under a taller-than-default sticky header still keeps the toggle in place', async () => {
	// Taller than SITE_HEADER_BLOCK_SIZE so a fixed-rem assumption would skip compensation while the
	// source top sits under the real header. Space above the example leaves enough scroll room to
	// compensate; keep the expanded block short enough that the toggle stays on screen.
	await renderSourcePreview({
		headerBlockSize: '8rem',
		lineCount: 40,
		withHeading: true,
		withSpaceAbove: '40rem',
		withSpaceBelow: true,
		withStickyHeader: true,
	});
	await userEvent.click(page.getByRole('button', { name: 'Expand code' }));
	const collapse = page.getByRole('button', { name: 'Collapse code' });
	await expect.element(collapse).toBeVisible();
	const control = collapse.element();
	const header = docsSiteHeader();
	const headerBox = header.getBoundingClientRect();
	const assumedHeaderBottom =
		Number.parseFloat(SITE_HEADER_BLOCK_SIZE) *
		Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
	expect(headerBox.height).toBeGreaterThan(assumedHeaderBottom + 8);

	const targetSourceTop = (assumedHeaderBottom + headerBox.bottom) / 2;
	window.scrollBy({
		behavior: 'instant',
		top: sourceElement().getBoundingClientRect().top - targetSourceTop,
	});
	expect(sourceElement().getBoundingClientRect().top).toBeGreaterThan(assumedHeaderBottom);
	expect(sourceElement().getBoundingClientRect().top).toBeLessThan(
		header.getBoundingClientRect().bottom,
	);
	expect(control.getBoundingClientRect().bottom).toBeLessThan(window.innerHeight);
	expect(control.getBoundingClientRect().top).toBeGreaterThan(
		header.getBoundingClientRect().bottom,
	);
	// Compensation scrolls up by the collapse delta; there must be room above the current scroll.
	expect(window.scrollY).toBeGreaterThan(
		control.getBoundingClientRect().top - sourceElement().getBoundingClientRect().top,
	);

	control.focus();
	let topAtPress: number | undefined;
	control.addEventListener(
		'keydown',
		() => {
			topAtPress = control.getBoundingClientRect().top;
			expect(sourceElement().getBoundingClientRect().top).toBeGreaterThan(assumedHeaderBottom);
			expect(sourceElement().getBoundingClientRect().top).toBeLessThan(
				header.getBoundingClientRect().bottom,
			);
		},
		{ once: true },
	);
	await pressKey('{Enter}');
	await expect.element(page.getByRole('button', { name: 'Expand code' })).toBeVisible();
	assert(topAtPress != null, 'expected the toggle to be pressed');
	expect(Math.abs(control.getBoundingClientRect().top - topAtPress)).toBeLessThanOrEqual(1);
});

test('keyboard collapse of a long example under the sticky header keeps the toggle in place', async () => {
	await renderSourcePreview({ lineCount: 200, withSpaceBelow: true, withStickyHeader: true });
	const expand = page.getByRole('button', { name: 'Expand code' });
	await expect.element(expand).toBeVisible();
	expand.element().focus();
	await pressKey('{Enter}');
	const collapse = page.getByRole('button', { name: 'Collapse code' });
	await expect.element(collapse).toHaveFocus();
	const control = collapse.element();
	const header = docsSiteHeader();
	window.scrollBy({
		behavior: 'instant',
		top: control.getBoundingClientRect().top - (header.getBoundingClientRect().bottom + 16),
	});
	expect(sourceElement().getBoundingClientRect().top).toBeLessThan(
		header.getBoundingClientRect().bottom,
	);

	let topAtPress: number | undefined;
	control.addEventListener(
		'keydown',
		() => {
			topAtPress = control.getBoundingClientRect().top;
		},
		{ once: true },
	);
	await pressKey('{Enter}');
	await expect.element(page.getByRole('button', { name: 'Expand code' })).toHaveFocus();
	assert(topAtPress != null, 'expected the toggle to be pressed');
	expect(Math.abs(control.getBoundingClientRect().top - topAtPress)).toBeLessThanOrEqual(1);
});

test('expand and collapse keep the toggle still while height clips bottom lines', async () => {
	// Space above leaves room to scroll-pin the toggle while the clip window closes upward.
	await renderSourcePreview({ lineCount: 40, withSpaceAbove: '40rem', withSpaceBelow: true });
	const expand = page.getByRole('button', { name: 'Expand code' });
	await expect.element(expand).toBeVisible();
	const source = sourceElement();
	const frame = container?.querySelector<HTMLElement>('[data-example-code-frame]');
	assert(frame, 'expected the example code frame');
	const collapsedHeight = source.getBoundingClientRect().height;
	expect(source.scrollHeight).toBeGreaterThan(source.clientHeight + 1);

	expand.element().focus();
	let expandToggleTop: number | undefined;
	expand.element().addEventListener(
		'keydown',
		() => {
			expandToggleTop = expand.element().getBoundingClientRect().top;
		},
		{ once: true },
	);
	await pressKey('{Enter}');
	const collapse = page.getByRole('button', { name: 'Collapse code' });
	await expect.element(collapse).toBeVisible();
	await expect
		.poll(() => source.getBoundingClientRect().height)
		.toBeGreaterThan(collapsedHeight + 40);
	assert(expandToggleTop != null, 'expected expand to be pressed');
	expect(
		Math.abs(collapse.element().getBoundingClientRect().top - expandToggleTop),
	).toBeLessThanOrEqual(1);
	const expandedToggle = collapse.element();
	expect(expandedToggle.getBoundingClientRect().bottom).toBeLessThanOrEqual(
		frame.getBoundingClientRect().bottom + 1,
	);

	let toggleTopAtPress = expandedToggle.getBoundingClientRect().top;
	let heightAtPress = source.getBoundingClientRect().height;
	const toggleTops: Array<number> = [];
	const toggleBottomGaps: Array<number> = [];
	const sourceHeights: Array<number> = [];
	// Sample from keyup — React Aria fires onPress then, which is when scroll-pinning starts.
	const onToggle = () => {
		toggleTopAtPress = expandedToggle.getBoundingClientRect().top;
		heightAtPress = source.getBoundingClientRect().height;
		const startedAt = performance.now();
		const sample = () => {
			toggleTops.push(expandedToggle.getBoundingClientRect().top);
			toggleBottomGaps.push(
				frame.getBoundingClientRect().bottom - expandedToggle.getBoundingClientRect().bottom,
			);
			sourceHeights.push(source.getBoundingClientRect().height);
			// Keep sampling until height has moved or the enter window has elapsed.
			const heightDropped = source.getBoundingClientRect().height < heightAtPress - 20;
			if (!heightDropped && performance.now() - startedAt < 1000) {
				requestAnimationFrame(sample);
				return;
			}
			if (performance.now() - startedAt < 300) {
				requestAnimationFrame(sample);
			}
		};
		requestAnimationFrame(sample);
	};
	expandedToggle.addEventListener('keyup', onToggle, { once: true });
	expandedToggle.focus();
	await pressKey('{Enter}');
	await expect.element(page.getByRole('button', { name: 'Expand code' })).toBeVisible();
	await expect.poll(() => source.getBoundingClientRect().height).toBeCloseTo(collapsedHeight, 0);
	expect(
		Math.abs(expand.element().getBoundingClientRect().top - toggleTopAtPress),
	).toBeLessThanOrEqual(1);
	expect(source.scrollHeight).toBeGreaterThan(source.clientHeight + 1);
	// Later lines sit below the collapsed clip once the height has settled.
	expect(source.getBoundingClientRect().bottom).toBeLessThan(
		source.getBoundingClientRect().top + source.scrollHeight - 8,
	);
	await expect.poll(() => sourceHeights.length).toBeGreaterThan(0);
	await expect.poll(() => heightAtPress - Math.min(...sourceHeights)).toBeGreaterThan(20);
	for (const top of toggleTops) {
		expect(Math.abs(top - toggleTopAtPress)).toBeLessThanOrEqual(2);
	}
	expect(Math.max(...toggleBottomGaps)).toBeLessThan(24);
	expect(Math.min(...toggleBottomGaps)).toBeGreaterThan(-2);
});

test('narrow viewport collapse under the sticky header keeps the toggle in place', async () => {
	await renderSourcePreview({
		lineCount: 200,
		viewportWidth: 390,
		viewportHeight: 800,
		withSpaceBelow: true,
		withStickyHeader: true,
	});
	await userEvent.click(page.getByRole('button', { name: 'Expand code' }));
	const collapse = page.getByRole('button', { name: 'Collapse code' });
	await expect.element(collapse).toBeVisible();
	const control = collapse.element();
	const header = docsSiteHeader();
	window.scrollBy({
		behavior: 'instant',
		top: control.getBoundingClientRect().top - (header.getBoundingClientRect().bottom + 16),
	});
	expect(sourceElement().getBoundingClientRect().top).toBeLessThan(
		header.getBoundingClientRect().bottom,
	);

	control.focus();
	let topAtPress: number | undefined;
	control.addEventListener(
		'keydown',
		() => {
			topAtPress = control.getBoundingClientRect().top;
		},
		{ once: true },
	);
	await pressKey('{Enter}');
	await expect.element(page.getByRole('button', { name: 'Expand code' })).toBeVisible();
	assert(topAtPress != null, 'expected the toggle to be pressed');
	expect(Math.abs(control.getBoundingClientRect().top - topAtPress)).toBeLessThanOrEqual(1);
});

test('reduced-motion collapse under the sticky header keeps the toggle in place', async () => {
	await emulateReducedMotion(true);
	await renderSourcePreview({ lineCount: 200, withSpaceBelow: true, withStickyHeader: true });
	await userEvent.click(page.getByRole('button', { name: 'Expand code' }));
	const collapse = page.getByRole('button', { name: 'Collapse code' });
	await expect.element(collapse).toBeVisible();
	const control = collapse.element();
	const header = docsSiteHeader();
	window.scrollBy({
		behavior: 'instant',
		top: control.getBoundingClientRect().top - (header.getBoundingClientRect().bottom + 16),
	});

	control.focus();
	let topAtPress: number | undefined;
	control.addEventListener(
		'keydown',
		() => {
			topAtPress = control.getBoundingClientRect().top;
		},
		{ once: true },
	);
	await pressKey('{Enter}');
	await expect.element(page.getByRole('button', { name: 'Expand code' })).toBeVisible();
	assert(topAtPress != null, 'expected the toggle to be pressed');
	expect(Math.abs(control.getBoundingClientRect().top - topAtPress)).toBeLessThanOrEqual(1);
});

test('typography changes without interaction do not move focus', async () => {
	await renderSourcePreview();
	await expect.element(page.getByRole('button', { name: 'Expand code' })).toBeVisible();
	await userEvent.click(page.getByRole('button', { name: 'Expand code' }));
	const collapse = page.getByRole('button', { name: 'Collapse code' });
	await expect.element(collapse).toBeVisible();
	collapse.element().focus();
	const pre = sourceElement();

	// The source now fits, but the expanded toggle stays until someone collapses it.
	shrinkTypography(pre);
	await expect.poll(() => sourceContentBlockSize(pre)).toBeLessThan(30);
	await expect.element(collapse).toHaveFocus();

	// Collapsing removes the toggle and hands focus to Copy. Growing the source again must leave it
	// there while the expand control comes back.
	await pressKey('{Enter}');
	await expect.poll(() => collapse.query()).toBeNull();
	const copy = page.getByRole('button', { name: COPY_BUTTON_NAME_PATTERN });
	await expect.element(copy).toHaveFocus();
	pre.style.removeProperty('font-size');
	pre.style.removeProperty('line-height');
	await expect.element(page.getByRole('button', { name: 'Expand code' })).toBeVisible();
	await expect.element(copy).toHaveFocus();
});

test('a surviving collapse does not restore focus after a later typography change', async () => {
	await renderSourcePreview({ withNextControl: true });
	const expand = page.getByRole('button', { name: 'Expand code' });
	await expect.element(expand).toBeVisible();
	expand.element().focus();
	await pressKey('{Enter}');
	await expect.element(page.getByRole('button', { name: 'Collapse code' })).toHaveFocus();
	await pressKey('{Enter}');
	await expect.element(expand).toHaveFocus();

	await userEvent.tab();
	await expect.element(page.getByRole('button', { name: 'Next example' })).toHaveFocus();
	await userEvent.tab({ shift: true });
	await expect.element(expand).toHaveFocus();
	shrinkTypography(sourceElement());
	await expect.poll(() => expand.query()).toBeNull();
	expect(document.activeElement).toBe(document.body);
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

async function renderSourcePreview({
	headerBlockSize,
	lineCount = 20,
	viewportHeight = 800,
	viewportWidth = 1000,
	withHeading = false,
	withNextControl = false,
	withSpaceAbove,
	withSpaceBelow = false,
	withStickyHeader = false,
}: {
	headerBlockSize?: string;
	lineCount?: number;
	viewportHeight?: number;
	viewportWidth?: number;
	withHeading?: boolean;
	withNextControl?: boolean;
	withSpaceAbove?: string;
	withSpaceBelow?: boolean;
	withStickyHeader?: boolean;
} = {}) {
	await page.viewport(viewportWidth, viewportHeight);
	const source = Array.from({ length: lineCount }, () => 'const value = 1;').join('\n');
	const preview = (
		<>
			{withSpaceAbove ? <div style={{ blockSize: withSpaceAbove }} /> : null}
			{withHeading ? <h2 style={{ blockSize: '20rem', margin: 0 }}>Example heading</h2> : null}
			<ExampleCodePreview html={`<code>${source}</code>`} source={source} title="Source sizing" />
			{withNextControl ? <button type="button">Next example</button> : null}
			{withSpaceBelow ? <div style={{ blockSize: '100vh' }} /> : null}
		</>
	);
	container = document.body.appendChild(document.createElement('div'));
	root = createRoot(container);
	act(() => {
		root?.render(
			<Provider spritesheetHref={spriteSheetHref}>
				{withStickyHeader ? (
					<div className={shellStyles.shell} id="docs-shell">
						<header
							className={shellStyles.header}
							data-docs-sticky-header
							style={
								headerBlockSize
									? {
											backgroundColor: 'Canvas',
											blockSize: headerBlockSize,
											minBlockSize: headerBlockSize,
										}
									: { backgroundColor: 'Canvas', minBlockSize: SITE_HEADER_BLOCK_SIZE }
							}
						>
							Sticky docs header
						</header>
						<main>{preview}</main>
					</div>
				) : (
					preview
				)}
			</Provider>,
		);
	});
}

function docsSiteHeader() {
	const header = container?.querySelector<HTMLElement>('#docs-shell [data-docs-sticky-header]');
	assert(header, 'expected the sticky docs header');
	return header;
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

/** Content height inside the pre, ignoring the collapsed min-block-size floor. */
function sourceContentBlockSize(pre: HTMLElement) {
	const content = pre.firstElementChild;
	if (content instanceof HTMLElement) {
		return content.getBoundingClientRect().height;
	}
	return pre.scrollHeight;
}

function shrinkTypography(pre: HTMLElement) {
	pre.style.fontSize = '1px';
	pre.style.lineHeight = '1px';
}

async function pressKey(key: string) {
	await act(async () => {
		await userEvent.keyboard(key);
	});
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
