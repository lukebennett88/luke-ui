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
import { ExampleBlock, ExampleLoadingState, ExamplePreview } from './example-block';
import { DocsThemeRoot } from './theme-controls.js';

let container: HTMLElement | undefined;
let root: Root | undefined;
const exampleTitle = 'Combobox Field — Basic';
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

test('resizes a desktop preview from its external grip down to its minimum width', async () => {
	await page.viewport(1000, 800);
	renderPreviewHarness();

	const widthBefore = previewWidth();

	// The visible grip is 12px to the right of the 1px separator. This is
	// deliberately outside the playground's 16px target, so it proves the
	// example owns a sufficiently large hit target for its external grip.
	await commands.dragFromSeparator(12, -400);
	await expect.poll(previewWidth).toBeLessThan(widthBefore - 100);
	expect(document.documentElement.scrollWidth).toBe(document.documentElement.clientWidth);

	await commands.dragFromSeparator(0, -1000);
	await expect.poll(previewWidth).toBeGreaterThanOrEqual(320);
	await expect.poll(previewWidth).toBeLessThanOrEqual(322);
	expect(document.documentElement.scrollWidth).toBe(document.documentElement.clientWidth);
});

test('narrowing the preview panel flips a responsive example below its container breakpoint', async () => {
	await page.viewport(1000, 800);
	await renderExampleBlock();

	await expect.poll(flexDirection).toBe('row');

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
				<ExampleLoadingState mode="full-bleed" title={title} />
			</IconSpritesheetProvider>,
		);
	});
}

// Renders `ExamplePreview` directly with a static child instead of going
// through `ExampleBlock`'s lazily-loaded example module, so the resize
// mechanics under test do not depend on a Suspense boundary resolving.
function renderPreviewHarness() {
	container = document.body.appendChild(document.createElement('div'));
	container.className = `luke-ui-theme ${tactileThemeClassName}`;
	// Leaves headroom to the right of the viewport for the grip, which sits
	// outside the panel's own edge.
	container.style.inlineSize = '800px';
	root = createRoot(container);
	act(() => {
		root?.render(
			<DocsThemeRoot>
				<ExamplePreview isCodeShown={false} title="Resize harness">
					<div style={{ blockSize: '4rem' }} />
				</ExamplePreview>
			</DocsThemeRoot>,
		);
	});
}

async function renderExampleBlock() {
	container = document.body.appendChild(document.createElement('div'));
	container.className = `luke-ui-theme ${tactileThemeClassName}`;
	// Leaves headroom to the right of the viewport for the grip, which sits
	// outside the panel's own edge.
	container.style.inlineSize = '800px';
	root = createRoot(container);
	await act(async () => {
		root?.render(
			<ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
				<IconSpritesheetProvider href={spriteSheetHref}>
					<DocsThemeRoot>
						<ExampleBlock src="box/responsive-layout" title="Box — Responsive layout" />
					</DocsThemeRoot>
				</IconSpritesheetProvider>
			</ThemeProvider>,
		);
	});
	// The example module loads lazily behind Suspense. Poll inside repeated
	// `act` calls so the render React performs when the module resolves stays
	// wrapped, rather than waiting for it outside `act` and racing React's own
	// microtask continuation.
	while (!container.querySelector('[data-panel]')) {
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
	if (!panel) throw new Error('expected the example preview panel');
	return panel;
}

function previewWidth() {
	return getPreviewPanel().getBoundingClientRect().width;
}

function flexDirection() {
	const label = Array.from(getPreviewPanel().querySelectorAll('span')).find(
		(element) => element.textContent === 'Item',
	);
	const row = label?.parentElement?.parentElement;
	if (!row) throw new Error('expected the responsive-layout row element');
	return getComputedStyle(row).flexDirection;
}
