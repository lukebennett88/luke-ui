import type { CSSProperties } from 'react';
import { expect, test } from 'vite-plus/test';
import { page } from 'vite-plus/test/context';
import { focusViaKeyboard, renderVisual, Stack } from '../test-utils/render-visual.js';
import { Link } from './index.js';

const darkPanelStyle = {
	backgroundColor: 'oklch(0.2 0 0)',
	paddingBlock: '0.25rem',
	paddingInline: '0.5rem',
} satisfies CSSProperties;

test('tones and states', async () => {
	const locator = renderVisual(
		<Stack align="flex-start">
			<Link href="#" tone="brand">
				Brand link
			</Link>
			<Link href="#" tone="neutral">
				Neutral link
			</Link>
			<Link href="#" isStandalone>
				Standalone link
			</Link>
			<Link href="#" isDisabled>
				Disabled link
			</Link>
			<div style={darkPanelStyle}>
				<Link href="#" tone="inverted">
					Inverted link
				</Link>
			</div>
		</Stack>,
	);

	await expect.element(locator).toMatchScreenshot('link-tones-states');
});

test('keyboard focus ring', async () => {
	const scene = renderVisual(
		<Stack>
			<Link href="#">Focus link</Link>
		</Stack>,
	);

	await focusViaKeyboard(page.getByRole('link', { name: 'Focus link' }));
	await expect.element(scene).toMatchScreenshot('link-focus-visible');
});
