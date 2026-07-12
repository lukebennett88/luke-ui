import type { CSSProperties } from 'react';
import { test } from 'vite-plus/test';
import { Button } from '../button/index.js';
import { captureVisual, renderVisual, Stack } from '../test-utils/render-visual.js';
import { TextField } from '../text-field/index.js';
import { LoadingSkeleton } from './index.js';

test('text and component placeholders', async () => {
	const locator = renderVisual(
		<Stack align="flex-start">
			<LoadingSkeleton>Loading placeholder text</LoadingSkeleton>
			<div style={{ maxInlineSize: '16rem' } satisfies CSSProperties}>
				<LoadingSkeleton>
					A short paragraph of placeholder copy that wraps across two lines.
				</LoadingSkeleton>
			</div>
			<LoadingSkeleton>
				<Button>Submit</Button>
			</LoadingSkeleton>
			<LoadingSkeleton borderRadius="4px">
				<TextField label="Email" name="email" placeholder="Email address" />
			</LoadingSkeleton>
		</Stack>,
	);

	await captureVisual(locator, 'loading-skeleton/placeholders');
});

test('loaded content', async () => {
	const locator = renderVisual(
		<Stack align="flex-start">
			<LoadingSkeleton isLoading={false}>
				<Button>Submit</Button>
			</LoadingSkeleton>
		</Stack>,
	);

	await captureVisual(locator, 'loading-skeleton/loaded');
});
