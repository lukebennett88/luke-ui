import '../../styles/app.css';
import '@luke-ui/react/themes/paper/stylesheet.css';
import '@luke-ui/react/themes/tactile/stylesheet.css';
import { act, useState } from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, test } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/context';
import { StoryWrapper } from '../../lib/story-wrapper';
import { DocsThemeRoot } from '../theme-controls';
import { PreviewToolbar } from './preview-toolbar';
import type { ViewportWidth } from './viewport-toggle';

let container: HTMLElement | undefined;
let root: Root | undefined;

afterEach(() => {
	if (root) act(() => root?.unmount());
	container?.remove();
	container = undefined;
	root = undefined;
});

test('enters and exits fullscreen with a clearly labelled toggle', async () => {
	renderToolbar();

	await userEvent.click(page.getByRole('button', { name: 'Enter fullscreen preview' }));

	const exitButton = page.getByRole('button', { name: 'Exit fullscreen preview' });
	await expect.element(exitButton).toBeVisible();
	expect(page.getByRole('button', { name: 'Enter fullscreen preview' }).elements()).toHaveLength(0);

	await userEvent.click(exitButton);

	await expect
		.element(page.getByRole('button', { name: 'Enter fullscreen preview' }))
		.toBeVisible();
});

function renderToolbar() {
	container = document.body.appendChild(document.createElement('div'));
	root = createRoot(container);

	act(() => {
		root?.render(
			<DocsThemeRoot>
				<StoryWrapper>
					<Harness />
				</StoryWrapper>
			</DocsThemeRoot>,
		);
	});
}

function Harness() {
	const [viewportWidth, setViewportWidth] = useState<ViewportWidth>('100%');
	const [isFullscreen, setIsFullscreen] = useState(false);

	return (
		<PreviewToolbar
			isFullscreen={isFullscreen}
			onFullscreenChange={setIsFullscreen}
			onViewportChange={setViewportWidth}
			viewportWidth={viewportWidth}
		/>
	);
}
