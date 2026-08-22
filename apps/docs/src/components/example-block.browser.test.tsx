import '../styles/app.css';
import '@luke-ui/react/themes/tactile/stylesheet.css';
import { IconSpritesheetProvider } from '@luke-ui/react/icon';
import spriteSheetHref from '@luke-ui/react/spritesheet.svg?url&no-inline';
import { themeClassName as tactileThemeClassName } from '@luke-ui/react/themes/tactile';
import { ThemeProvider } from 'next-themes';
import { act } from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, test } from 'vite-plus/test';
import { commands, page } from 'vite-plus/test/context';
import { mountExamplePreview } from '../test-utils/example-preview-frame.js';
import { ExampleLoadingState, ExamplePreview } from './example-block';
import { DocsThemeRoot } from './theme-controls.js';

let container: HTMLElement | undefined;
let previewFixtureUrl: string | undefined;
let root: Root | undefined;
const exampleTitle = 'Combobox Field — Basic';
const loadingLabel = `Loading ${exampleTitle} example`;

afterEach(() => {
	if (root) act(() => root?.unmount());
	container?.remove();
	if (previewFixtureUrl) URL.revokeObjectURL(previewFixtureUrl);
	container = undefined;
	previewFixtureUrl = undefined;
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

test('resizes a desktop preview from its external grip down to its minimum width', async () => {
	await page.viewport(1000, 800);
	renderExampleBlock();

	await expect.poll(previewWidth).toBeGreaterThan(0);
	const widthBefore = previewWidth();

	// The visible grip is 12px to the right of the 1px separator. This is
	// deliberately outside the playground's 16px target, so it proves the
	// example owns a sufficiently large hit target for its external grip.
	await commands.dragFromSeparator(12, -400);
	await expect.poll(previewWidth).toBeLessThan(widthBefore - 100);
	expect(document.documentElement.scrollWidth).toBe(document.documentElement.clientWidth);

	await commands.dragFromSeparator(0, -1000);
	await expect.poll(previewWidth).toBeGreaterThanOrEqual(320);
});

test('fits the preview inside viewports narrower than its desktop minimum', async () => {
	await page.viewport(280, 800);
	renderExampleBlock('box/responsive-layout', '100%');

	await expect.poll(previewWidth).toBeGreaterThan(0);
	expect(previewWidth()).toBeLessThanOrEqual(280);
	expect(document.documentElement.scrollWidth).toBe(document.documentElement.clientWidth);
});

test('sizes a simple example to its content on one continuous surface', async () => {
	renderExampleBlock('button/basic');

	const iframe = getPreviewIframe();
	await loadPreviewFixture(iframe, 'button');
	await expect
		.poll(() => iframe.contentDocument?.querySelector('button')?.textContent)
		.toBe('Save changes');
	await expect.poll(() => getPreviewCanvas().clientHeight).toBeLessThan(320);
	expectPreviewSurfaceToFillViewport(iframe);
});

test('keeps the combobox in view when portalled options open and close', async () => {
	await page.viewport(927, 205);
	renderExampleBlock('combobox-field/basic');

	const iframe = getPreviewIframe();
	const fixtureLoaded = loadPreviewFixture(iframe, 'combobox');
	iframe.scrollIntoView({ block: 'center' });
	await fixtureLoaded;
	await expect
		.poll(() => iframe.contentDocument?.querySelector('[aria-label="Toggle options"]') !== null)
		.toBe(true);
	const previewDocument = iframe.contentDocument;
	if (!previewDocument) throw new Error('expected the example preview document');
	await expect.poll(() => getPreviewCanvas().clientHeight).toBeGreaterThanOrEqual(320);
	const initialCanvasHeight = getPreviewCanvas().clientHeight;
	const initialViewportHeight = iframe.contentWindow?.innerHeight;
	expectPreviewSurfaceToFillViewport(iframe);

	const openAndCloseOptions = async () => {
		await commands.clickExamplePreviewButton('Toggle options Favourite fruit');
		await expect.poll(() => previewDocument.querySelectorAll('[role="option"]').length).toBe(4);
		expect(getPreviewCanvas().clientHeight).toBe(initialCanvasHeight);
		expect(iframe.contentWindow?.innerHeight).toBe(initialViewportHeight);
		expect(
			Array.from(previewDocument.querySelectorAll<HTMLElement>('[role="option"]')).every(
				(option) => {
					const rect = option.getBoundingClientRect();
					return rect.top >= 0 && rect.bottom <= getPreviewCanvas().clientHeight;
				},
			),
		).toBe(true);

		await commands.clickExamplePreviewOption('Apple');
		await expect.poll(() => previewDocument.querySelectorAll('[role="option"]').length).toBe(0);
		expect(getPreviewCanvas().clientHeight).toBe(initialCanvasHeight);
	};

	await openAndCloseOptions();
	await openAndCloseOptions();
	await openAndCloseOptions();

	await expect
		.poll(() => {
			const control = previewDocument.querySelector<HTMLElement>('[aria-label="Toggle options"]');
			if (!control) return false;
			const rect = control.getBoundingClientRect();
			return rect.top >= 0 && rect.bottom <= getPreviewCanvas().clientHeight;
		})
		.toBe(true);
});

function renderExample(title: string) {
	container = document.body.appendChild(document.createElement('div'));
	container.className = `luke-ui-theme ${tactileThemeClassName}`;
	root = createRoot(container);
	act(() => {
		root?.render(
			<IconSpritesheetProvider href={spriteSheetHref}>
				<ExampleLoadingState mode="full-bleed" title={title} />
			</IconSpritesheetProvider>,
		);
	});
}

function renderExampleBlock(src = 'box/responsive-layout', inlineSize = '800px') {
	container = document.body.appendChild(document.createElement('div'));
	container.className = `luke-ui-theme ${tactileThemeClassName}`;
	container.style.inlineSize = inlineSize;
	root = createRoot(container);
	act(() => {
		root?.render(
			<ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
				<IconSpritesheetProvider href={spriteSheetHref}>
					<DocsThemeRoot>
						<ExamplePreview isCodeShown={false} src={src} />
					</DocsThemeRoot>
				</IconSpritesheetProvider>
			</ThemeProvider>,
		);
	});
}

function previewWidth() {
	return getPreviewCanvas().getBoundingClientRect().width;
}

function getPreviewCanvas(): HTMLElement {
	const canvas = container?.querySelector<HTMLElement>('[data-example-preview-canvas]');
	if (!canvas) throw new Error('expected the example preview canvas');
	return canvas;
}

function getPreviewIframe(): HTMLIFrameElement {
	const iframe = container?.querySelector<HTMLIFrameElement>('iframe');
	if (!iframe) throw new Error('expected the example preview iframe');
	return iframe;
}

function expectPreviewSurfaceToFillViewport(iframe: HTMLIFrameElement): void {
	const previewDocument = iframe.contentDocument;
	const previewWindow = iframe.contentWindow;
	if (!previewDocument || !previewWindow) throw new Error('expected the example preview document');
	const preview = previewDocument.querySelector<HTMLElement>('[data-example-preview]');
	const surfaceAtBottom = previewDocument.elementFromPoint(1, previewWindow.innerHeight - 1);
	if (!preview?.parentElement || !surfaceAtBottom) throw new Error('expected the preview surface');
	expect(previewWindow.getComputedStyle(surfaceAtBottom).backgroundColor).toBe(
		previewWindow.getComputedStyle(preview.parentElement).backgroundColor,
	);
}

async function loadPreviewFixture(
	iframe: HTMLIFrameElement,
	example: 'button' | 'combobox',
): Promise<void> {
	previewFixtureUrl = createPreviewFixtureUrl(mountExamplePreview, example);
	const fixtureLoaded = new Promise<void>((resolve) => {
		iframe.addEventListener('load', () => resolve(), { once: true });
	});
	iframe.src = previewFixtureUrl;
	await fixtureLoaded;
}

function createPreviewFixtureUrl(
	_mount: typeof mountExamplePreview,
	example: 'button' | 'combobox',
): string {
	return URL.createObjectURL(
		new Blob(
			[
				`
		<base href="${window.location.origin}/">
		<div id="root"></div>
		<script type="module">
			import { mountExamplePreview } from '/src/test-utils/example-preview-frame.tsx';
			mountExamplePreview(document.querySelector('#root'), '${example}');
		</script>
	`,
			],
			{ type: 'text/html' },
		),
	);
}
