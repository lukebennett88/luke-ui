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

test('keeps every portalled combobox option visible and usable inside the preview', async () => {
	renderExampleBlock('combobox-field/basic');

	const iframe = getPreviewIframe();
	previewFixtureUrl = createPreviewFixtureUrl(mountExamplePreview);
	iframe.src = previewFixtureUrl;
	await expect
		.poll(() => iframe.contentDocument?.querySelector('[aria-label="Toggle options"]') !== null)
		.toBe(true);
	const previewDocument = iframe.contentDocument;
	if (!previewDocument) throw new Error('expected the example preview document');

	previewDocument.querySelector<HTMLButtonElement>('[aria-label="Toggle options"]')?.click();
	await expect.poll(() => previewDocument.querySelectorAll('[role="option"]').length).toBe(4);

	await expect
		.poll(() => {
			const previewHeight = iframe.contentWindow?.innerHeight ?? 0;
			return Array.from(previewDocument.querySelectorAll<HTMLElement>('[role="option"]')).every(
				(option) =>
					option.getBoundingClientRect().top >= 0 &&
					option.getBoundingClientRect().bottom <= previewHeight,
			);
		})
		.toBe(true);

	previewDocument.querySelector<HTMLElement>('[role="option"]')?.click();
	await expect
		.poll(() => previewDocument.querySelector<HTMLInputElement>('input')?.value)
		.toBe('Apple');
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
	return (
		container?.querySelector<HTMLElement>('[data-example-preview-canvas]')?.getBoundingClientRect()
			.width ?? 0
	);
}

function getPreviewIframe(): HTMLIFrameElement {
	const iframe = container?.querySelector<HTMLIFrameElement>('iframe');
	if (!iframe) throw new Error('expected the example preview iframe');
	return iframe;
}

function createPreviewFixtureUrl(_mount: typeof mountExamplePreview): string {
	return URL.createObjectURL(
		new Blob(
			[
				`
		<base href="${window.location.origin}/">
		<div id="root"></div>
		<script type="module">
			import { mountExamplePreview } from '/src/test-utils/example-preview-frame.tsx';
			mountExamplePreview(document.querySelector('#root'));
		</script>
	`,
			],
			{ type: 'text/html' },
		),
	);
}
