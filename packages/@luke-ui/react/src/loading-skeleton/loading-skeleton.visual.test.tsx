import type { CSSProperties } from 'react';
import { test } from 'vite-plus/test';
import { Button } from '../button/index.js';
import { render, visualAppearances } from '../test-utils/render.js';
import { captureVisual, captureVisualAppearance, Stack } from '../test-utils/visual.js';
import { TextField } from '../text-field/index.js';
import { LoadingSkeleton } from './index.js';

test('text and component placeholders', async () => {
	const { locator } = render(
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
			<LoadingSkeleton radius="control">
				<TextField label="Email" name="email" placeholder="Email address" />
			</LoadingSkeleton>
		</Stack>,
	);

	await captureVisual(locator, 'loading-skeleton/placeholders');
});

test('loaded content', async () => {
	const { locator } = render(
		<Stack align="flex-start">
			<LoadingSkeleton isLoading={false}>
				<Button>Submit</Button>
			</LoadingSkeleton>
		</Stack>,
	);

	await captureVisual(locator, 'loading-skeleton/loaded');
});

for (const appearance of visualAppearances) {
	test(`flattens tactile descendants: ${appearance.theme} ${appearance.mode}`, async () => {
		const { locator: scene } = render(
			<LoadingSkeleton radius="surface">
				<div>
					<Button>Nested action</Button>
					<TextField label="Email" name="email" />
				</div>
			</LoadingSkeleton>,
			{ appearance },
		);
		await captureVisualAppearance(scene, 'loading-skeleton/descendant-suppression', appearance);
	});
}
