import type { CSSProperties } from 'react';
import { expect, test } from 'vite-plus/test';
import { Button } from '../button/index.js';
import {
	captureVisual,
	captureVisualAppearance,
	renderVisual,
	Stack,
	visualAppearances,
} from '../test-utils/render-visual.js';
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
			<LoadingSkeleton radius="control">
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

test.each(visualAppearances)('flattens tactile descendants: $theme $mode', async (appearance) => {
	const scene = renderVisual(
		<LoadingSkeleton radius="surface">
			<div>
				<Button>Nested action</Button>
				<TextField label="Email" name="email" />
			</div>
		</LoadingSkeleton>,
		appearance,
	);
	const button = requireElement(scene.element(), 'button');
	const field = requireElement(scene.element(), 'input');

	for (const descendant of [button, field]) {
		const style = getComputedStyle(descendant);
		expect(style.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
		expect(style.backgroundImage).toBe('none');
		expect(style.borderStyle).toBe('none');
		expect(style.boxShadow).toBe('none');
		expect(style.color).toBe('rgba(0, 0, 0, 0)');
	}

	await captureVisualAppearance(scene, 'loading-skeleton/descendant-suppression', appearance);
});

function requireElement(parent: ParentNode, selector: string) {
	const element = parent.querySelector(selector);
	if (!element) throw new Error(`Expected element matching "${selector}".`);
	return element;
}
